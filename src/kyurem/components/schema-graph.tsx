import React, { useEffect, useRef } from "react";
import cytoscape, {
  BaseLayoutOptions,
  EdgeDefinition,
  EdgeSingular,
  EventObject,
  NodeDefinition,
  NodeSingular,
  Singular,
} from "cytoscape";
import { Box } from "@mui/system";
import hash from "object-hash";
import * as d3 from "d3";
import { useObject } from "../lib/use-object";
cytoscape.use(require("cytoscape-avsdf"));

/////////////////
/// COMPONENT ///
/////////////////

export const SchemaGraph = ({
  schema = [],
  subgraph,

  nodeColor,

  highlight,
  onFocus,
  onZoom,
}: {
  schema?: Schema;
  subgraph?: Schema;

  nodeColor?: (label: string) => string;

  highlight?: SchemaNode | null | false;
  onFocus?: (elem: Singular | null) => void;
  onZoom?: (elem: Singular | null) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core>();

  // Initialize cytoscape
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    cyRef.current = cytoscape({ container });
    cyRef.current.data("isCore", true);
  }, [containerRef.current]);

  // Attach event listeners
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const cb = (e: EventObject) => onFocus?.(getTarget(e));
    cy.on("onetap", cb);
    return () => void cy.off("onetap", cb);
  }, [cyRef.current, onFocus]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const cb = (e: EventObject) => onZoom?.(getTarget(e));
    cy.on("dbltap", cb);
    return () => void cy.off("dbltap", cb);
  }, [cyRef.current, onZoom]);

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
            "border-width": (node: NodeSingular) =>
              node.data("isSelected") ? 3 : 0,
            "border-color": "red",

            ...(nodeColor && {
              "background-color": (node: NodeSingular) =>
                nodeColor(node.data("label")),
            }),
          },
        },
        {
          selector: "edge",
          style: {
            "line-cap": "round",
            "line-fill": "linear-gradient",

            ...(nodeColor && {
              "line-gradient-stop-colors": (edge: EdgeSingular) => [
                nodeColor(edge.source().data("label")),
                nodeColor(edge.target().data("label")),
              ],
            }),
          },
        },
      ],
    });
  }, [cyRef.current, nodeColor]);

  // Update schema
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Convert schema graph data into cytoscape data
    const elements = mergeParallelEdges(schemaToCyto(schema));
    cy.json({ elements });

    // Apply dynamic styles
    applyEdgeStyles(cy);

    // Re-run layout
    cy.layout({
      name: "avsdf",
      nodeSeparation: 160,
    } as AVSDFLayoutOptions).run();
  }, [cyRef.current, useObject(schema)]);

  // Update subgraph graph
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (!subgraph) {
      // Reset subgraph data
      cy.edges().forEach((edge) => void edge.removeData("subedges"));
    } else {
      // Initialize subgraph data
      cy.edges().forEach((edge) => void edge.data("subedges", []));

      // Update graph with data
      subgraph.forEach((edge) =>
        cy
          .nodes(
            `node[schemaNode.node_property_value=${quote(
              edge.source.node_label
            )}]`
          )
          .edgesWith(
            `node[schemaNode.node_property_value=${quote(
              edge.target.node_label
            )}]`
          )
          .data("subedges")
          ?.push(edge)
      );
    }

    // Apply dynamic styles
    applyEdgeStyles(cy);
  }, [cyRef.current, useObject(subgraph)]);

  // Update the selected node in display
  const prevHighlightRef = useRef<NodeSingular>();
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const prevHighlight = prevHighlightRef.current;
    if (prevHighlight) {
      prevHighlight.data("isSelected", false);
      prevHighlightRef.current = undefined;
    }

    if (highlight) {
      const selector = `node[schemaNode.node_property_value="${highlight.node_property_value}"]`;
      const selection = cy.$(selector);
      selection.data("isSelected", true);
      prevHighlightRef.current = selection;
    }
  }, [cyRef.current, useObject(highlight)]);

  return <Box ref={containerRef} width="100%" height="100%" />;
};

////////////////////////
/// HELPER FUNCTIONS ///
////////////////////////

// Extract node and edge data from schema
const nodeId = (node: SchemaNode) => hash(node);
const edgeId = (edge: SchemaEdge) => hash(edge);

/**
 *  Convert a schema graph data to cytoscape graph data
 */
const schemaToCyto = (schema: Schema) => {
  // Extract node definitions from schema
  const nodes: {
    [id: string]: NodeDefinition & { data: { schemaNode: SchemaNode } };
  } = {};
  const makeNode = (node: SchemaNode) => {
    const id = nodeId(node);
    nodes[id] ??= {
      data: { id, label: node.node_property_value, schemaNode: node },
    };
  };
  schema.forEach((edge) => {
    makeNode(edge.source);
    makeNode(edge.target);
  });

  // Extract edge definitions from schema
  const edges = schema.map((edge) => ({
    data: {
      id: edgeId(edge),
      source: nodeId(edge.source),
      target: nodeId(edge.target),
      schemaEdge: edge,
    },
  }));

  return { nodes: Object.values(nodes), edges };
};

const mergeParallelEdges = <
  N extends NodeDefinition,
  E extends EdgeDefinition
>(elements: {
  nodes: N[];
  edges: E[];
}) => {
  const mergedEdges: {
    [key: string]: EdgeDefinition & { data: { children: E["data"][] } };
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
        children: [],
      },
    });
    mergedEdge.data.children.push(edge.data);
  });

  return {
    nodes: elements.nodes,
    edges: Object.values(mergedEdges),
  };
};

export const makeNodeColorScale = (schema?: Schema) => {
  const labels = [
    ...new Set(
      schema?.flatMap((edge) => [
        edge.source.node_label,
        edge.target.node_label,
      ])
    ),
  ].sort();
  const colors = labels.map((_, i) => d3.interpolateRainbow(i / labels.length));
  const scale = d3.scaleOrdinal(colors).domain(labels);

  return (label?: string) => (label ? scale(label) : "#aaa");
};

const applyEdgeStyles = (
  graph: cytoscape.Core,
  options: {
    maxEdgeWidth?: number;
  } = {}
) => {
  const { maxEdgeWidth = 30 } = options;

  const getParam = (edge: EdgeSingular) =>
    edge.data("subedges")?.length ?? edge.data("children").length;

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

const getTarget = (e: EventObject) =>
  e.target.data("isCore") ? null : (e.target as Singular);

/**
 * Quote and escape special characters in string
 */
const quote = (str: string) => JSON.stringify(str);

/////////////
/// TYPES ///
/////////////

export type SchemaNode = {
  node_label: string;
  node_property: string;
  node_property_value: string;
};

export type SchemaEdge = {
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

export type CytoNodeData = {
  id: string;
  label: string;
  schemaNode: SchemaNode;
};
export type CytoEdgeData = {
  id: string;
  label: string;
  source: string;
  target: string;
  children: {
    id: string;
    source: string;
    target: string;
    schemaEdge: SchemaEdge;
  }[];
};
