import React, { useEffect, useRef } from "react";
import cytoscape, {
  BaseLayoutOptions,
  EdgeDefinition,
  EdgeSingular,
  ElementsDefinition,
  EventObject,
  NodeDefinition,
  NodeSingular,
} from "cytoscape";
import { Box } from "@mui/system";
import hash from "object-hash";
import * as d3 from "d3";
import { usePrevious } from "react-use";
cytoscape.use(require("cytoscape-avsdf"));

/////////////////
/// COMPONENT ///
/////////////////

export const SchemaGraph = ({
  baseSchema,
  nodeColorScale,
  schema,

  onSelect,
  highlightLabel,
}: {
  baseSchema: Schema;
  nodeColorScale: (label: string) => string;
  schema?: Schema;

  highlightLabel: string | null | undefined;
  onSelect: (selection?: NodeSingular | EdgeSingular) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core>();

  // Initialize cytoscape
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
    });
    cyRef.current.data("isCore", true);
  }, [containerRef.current]);

  // Attach event listeners
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const cb = (e: EventObject) => {
      const target = e.target.data("isCore")
        ? undefined
        : (e.target as NodeSingular | EdgeSingular);
      onSelect?.(target);
    };

    cy.on("tap", cb);
    return () => {
      cy.off("tap", cb);
    };
  }, [cyRef.current, onSelect]);

  // Update the selected node in display
  const prevSelection = usePrevious(highlightLabel);
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (prevSelection) cy.$id(prevSelection).data("isSelected", false);
    if (highlightLabel) cy.$id(highlightLabel).data("isSelected", true);
  }, [cyRef.current, prevSelection, highlightLabel]);

  // Update stylesheet of graph
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.json({
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": (node: NodeSingular) =>
              nodeColorScale(node.data("label")),
            "border-width": (node: NodeSingular) =>
              node.data("isSelected") ? 3 : 0,
            "border-color": "red",
          },
        },
        {
          selector: "edge",
          style: {
            "line-cap": "round",
            "line-fill": "linear-gradient",
            "line-gradient-stop-colors": (edge: EdgeSingular) => [
              nodeColorScale(edge.source().data("label")),
              nodeColorScale(edge.target().data("label")),
            ],
          },
        },
      ],
    });
  }, [cyRef.current, nodeColorScale]);

  // Update elements of base graph
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Convert schema graph data into cytoscape data
    const elements = mergeParallelEdges(
      mergeNodesByLabel(schemaToCyto(baseSchema))
    );
    cy.json({ elements });

    // Apply dynamic styles
    applyEdgeStyles(cy);

    // Re-run layout
    cy.layout({
      name: "avsdf",
      nodeSeparation: 160,
    } as AVSDFLayoutOptions).run();
  }, [cyRef.current, baseSchema]);

  // Update elements of graph
  useEffect(() => {
    const cy = cyRef.current;

    if (!cy) return;

    if (!schema) {
      // Reset subgraph data
      cy.edges().forEach((edge) => {
        edge.removeData("children");
      });
    } else {
      // Initialize subgraph data
      cy.edges().forEach((edge) => {
        edge.data("children", []);
      });

      // Update graph with data
      schema.forEach((edge) => {
        const [src, tgt] = [
          edge.source.node_label,
          edge.target.node_label,
        ].sort();
        const children = cy
          .$(
            `edge[source=${JSON.stringify(src)}][target=${JSON.stringify(tgt)}]`
          )
          .data("children");
        children.push(edge);
      });
    }
    // Apply dynamic styles
    applyEdgeStyles(cy);
  }, [cyRef.current, schema]);

  return <Box ref={containerRef} width="100%" height="100%" />;
};

////////////////////////
/// HELPER FUNCTIONS ///
////////////////////////

/**
 *  Convert a schema graph data to cytoscape graph data
 */
const schemaToCyto = (schema: Schema) => {
  // Extract node and edge data from schema
  const nodeId = (node: SchemaNode) => hash(node);
  const edgeId = (edge: SchemaEdge) => hash(edge);
  const nodeLabel = (node: SchemaNode) => node.node_label;

  // Extract node definitions from schema
  const nodes: { [id: string]: NodeDefinition & { data: SchemaNode } } = {};
  const makeNode = (node: SchemaNode) => {
    const id = nodeId(node);
    nodes[id] ??= { data: { id, label: nodeLabel(node), ...node } };
  };
  schema.forEach((edge) => {
    makeNode(edge.source);
    makeNode(edge.target);
  });

  // Extract edge definitions from schema
  const edges = schema.map((edge) => ({
    data: {
      id: edgeId(edge),
      ...edge,
      source: nodeId(edge.source),
      target: nodeId(edge.target),
    },
  }));

  return { nodes: Object.values(nodes), edges };
};

const mergeNodesByLabel = <E extends ElementsDefinition>(elements: E) => {
  const nodes: {
    [label: string]: NodeDefinition;
  } = {};

  const nodeRemap: {
    [id: string]: string;
  } = {};

  elements.nodes.forEach((node) => {
    const label = node.data.label;
    const newNode = (nodes[label] ??= {
      data: { id: label, label },
    });

    // Save map to new node for remapping edges
    nodeRemap[node.data.id!] = label;
  });

  const edges = elements.edges.map((edge) => ({
    data: {
      ...edge.data,
      source: nodeRemap[edge.data.source],
      target: nodeRemap[edge.data.target],
    },
  }));

  return { nodes: Object.values(nodes), edges };
};

const mergeParallelEdges = <E extends ElementsDefinition>(elements: E) => {
  const mergedEdges: {
    [key: string]: EdgeDefinition & { data: { edges: E["edges"] } };
  } = {};
  elements.edges.forEach((edge) => {
    // Ignore directionality of edge
    const [source, target] = [edge.data.source, edge.data.target].sort();

    // Create merged edge if it doesn't already exist
    const id = `${source} --- ${target}`;
    const mergedEdge = (mergedEdges[id] ??= {
      data: {
        id,
        source,
        target,
        edges: [],
      },
    });
    mergedEdge.data.edges.push(edge);
  });

  return {
    nodes: elements.nodes as E["nodes"],
    edges: Object.values(mergedEdges),
  };
};

export const makeNodeColorScale = (schema: Schema) => {
  const labels = [
    ...new Set(
      schema.flatMap((edge) => [edge.source.node_label, edge.target.node_label])
    ),
  ].sort();
  const colors = labels.map((_, i) => d3.interpolateRainbow(i / labels.length));
  return d3.scaleOrdinal(colors).domain(labels);
};

const applyEdgeStyles = (
  graph: cytoscape.Core,
  options: {
    maxEdgeWidth?: number;
  } = {}
) => {
  const { maxEdgeWidth = 30 } = options;

  const getParam = (edge: EdgeSingular) =>
    edge.data("children")?.length ?? edge.data("edges").length;

  // Limit the width of any edge to maxEdgeWidth
  const edgeWidthScale = Math.min(
    1,
    ...graph.edges().map((edge) => maxEdgeWidth / getParam(edge))
  );

  // Style each edge based on number of merged edges
  graph.edges().forEach((edge) => {
    const x = getParam(edge);
    edge.style("width", x == 0 ? 0 : Math.max(1, edgeWidthScale * x));
  });
};

/////////////
/// TYPES ///
/////////////

type SchemaNode = {
  node_label: string;
  node_property: string;
  node_property_value: string;
};

type SchemaEdge = {
  emphasis: "yes" | "no";
  label: string;
  source: SchemaNode;
  target: SchemaNode;
  weight: number;
};

export type Schema = SchemaEdge[];
interface AVSDFLayoutOptions extends BaseLayoutOptions {
  /** Called on `layoutready` **/
  ready?(): void;

  /**  Called on `layoutstop` **/
  stop?(): void;

  /** number of ticks per frame; higher is faster but more jerky. Default: 30 **/
  refresh?: number;

  /**  Whether to fit the network view after when done. Default: true **/
  fit?: boolean;

  /** Padding on fit. Default: 30 **/
  padding?: number;

  /** Prevent the user grabbing nodes during the layout (usually with animate:true). Default: false **/
  ungrabifyWhileSimulating?: boolean;

  /**   Type of layout animation. The option set is {'during', 'end', false}. Default: 'end'  */
  animate?: "during" | "end" | false;

  /** Duration for animate:end. Default: 500 **/
  animationDuration?: number;

  /** How apart the nodes are. Default: 60 **/
  nodeSeparation?: number;
}
