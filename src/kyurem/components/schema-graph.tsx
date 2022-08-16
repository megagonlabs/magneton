import React, { useEffect, useMemo, useRef } from "react";
import cytoscape, {
  BaseLayoutOptions,
  EdgeDefinition,
  EdgeSingular,
  ElementsDefinition,
  NodeDefinition,
  NodeSingular,
} from "cytoscape";
import { Box } from "@mui/system";
import hash from "object-hash";
import * as d3 from "d3";
cytoscape.use(require("cytoscape-avsdf"));

/////////////////
/// COMPONENT ///
/////////////////

export const SchemaGraph = ({ schema }: { schema: Schema }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core>();

  const nodeColorScale = useMemo(() => makeNodeColorScale(schema), [schema]);

  // Initialize cytoscape
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
    });
  }, [containerRef.current]);

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

  // Update elements of graph
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Convert schema graph data into cytoscape data
    const elements = mergeParallelEdges(schemaToCyto(schema));
    cy.json({ elements });

    // Apply dynamic styles
    applyAggregatedEdgeStyles(cy);

    // Re-run layout
    cy.layout({
      name: "avsdf",
      nodeSeparation: 160,
    } as AVSDFLayoutOptions).run();
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

const mergeParallelEdges = <E extends ElementsDefinition>(elements: E) => {
  const mergedEdges: {
    [key: string]: EdgeDefinition & { data: { edges: EdgeDefinition[] } };
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

  return { nodes: elements.nodes, edges: Object.values(mergedEdges) };
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

const applyAggregatedEdgeStyles = (
  graph: cytoscape.Core,
  options: {
    maxEdgeWidth?: number;
  } = {}
) => {
  const { maxEdgeWidth = 30 } = options;

  // Limit the width of any edge to maxEdgeWidth
  const edgeWidthScale = Math.min(
    1,
    ...graph.edges().map((edge) => maxEdgeWidth / edge.data("edges").length)
  );

  // Style each edge based on number of merged edges
  graph.edges().forEach((edge) => {
    edge.style("width", edgeWidthScale * edge.data("edges").length);
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
