import React, { useMemo } from "react";
import { GraphData } from "../types/data-types";
import { RootPane } from "./panes/root-pane";
import CytoscapeComponent from "react-cytoscapejs";
import * as d3 from "d3";

const multiplyLightness = (color: string, factor: number) => {
  const c = d3.lab(color);
  c.l *= factor;
  return c.formatRgb();
};

export const Schema = ({ data }: { data: GraphData }) => {
  const elements = useMemo(() => {
    // Collapse multi-edges into undirected edges
    const edges: Record<
      string,
      {
        nodeA: string;
        nodeB: string;
        count: number;
      }
    > = {};

    data.edges.forEach(({ source, target }) => {
      const [nodeA, nodeB] = [source, target].sort();
      const edge = (edges[`${nodeA} --> ${nodeB}`] ??= {
        nodeA,
        nodeB,
        count: 0,
      });
      edge.count++;
    });

    const maxCount = Math.max(...Object.values(edges).map((e) => e.count));

    // Create cytoscape element definitions
    const elements = [
      ...data.nodes.map(({ id }) => ({
        data: { id, label: id },
      })),
      ...data.edges.map(({source, target, label}) => ({ data: { source, target, label } }))

      // ...Object.values(edges).map(({ nodeA, nodeB, count }) => ({
      //   data: {
      //     source: nodeA,
      //     target: nodeB,
      //     width: Math.max((15 * count) / maxCount, 1),
      //     color: multiplyLightness(
      //       d3.interpolateGnBu(count / maxCount),
      //       count / maxCount
      //     ),
      //   },
      // })),
    ];

    return elements;
  }, [data]);

  return (
    <RootPane>
      <CytoscapeComponent
        elements={elements}
        style={{ width: "100%", height: "100%" }}
        layout={{ name: "circle" }}
        stylesheet={[
          {
            selector: "node",
            style: {
              label: "data(label)",
            },
          },
          {
            selector: "edge",
            style: {
              // width: "data(width)",
              // "line-color": "data(color)",
              "target-arrow-shape": "triangle"
            },
          },
        ]}
      />
    </RootPane>
  );
};
