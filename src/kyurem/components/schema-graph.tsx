import React, { useEffect, useMemo, useRef } from "react";
import { LinkData } from "../lib/types/data-types";
import CytoscapeComponent from "react-cytoscapejs";
import * as d3 from "d3";
import cytoscape from "cytoscape";

const adjustLightness = (
  color: string,
  { clamp }: { clamp: [number, number] }
) => {
  const c = d3.lab(color);
  c.l = Math.max(clamp[0], Math.min(clamp[1], c.l));
  return c.formatRgb();
};

export const SchemaGraph = ({
  data,
  onTap,
}: {
  data: (LinkData & { emphasis: "yes" | "no" })[];
  onTap?: (ev: cytoscape.InputEventObject) => void;
}) => {
  const elements = useMemo(() => {
    // Collapse multi-edges into undirected edges
    const edges: Record<
      string,
      {
        nodeA: string;
        nodeB: string;
        count: number;
        emph: number;
      }
    > = {};

    const nodes = new Set<string>();

    data.forEach(({ source, target, emphasis = "no" }) => {
      nodes.add(source);
      nodes.add(target);

      const [nodeA, nodeB] = [source, target].sort();
      const edge = (edges[`${nodeA} --> ${nodeB}`] ??= {
        nodeA,
        nodeB,
        count: 0,
        emph: 0,
      });

      edge.count++;
      if (emphasis === "yes") edge.emph += 1;
    });

    const maxCount = Math.max(...Object.values(edges).map((e) => e.count));
    const maxEmph = Math.max(...Object.values(edges).map((e) => e.emph), 1);

    // Create cytoscape element definitions
    const elements = [
      ...[...nodes].map((id) => ({
        data: { id, label: id },
      })),

      ...Object.values(edges).map(({ nodeA, nodeB, count, emph }) => {
        return {
          data: {
            source: nodeA,
            target: nodeB,
            width: Math.max((15 * emph) / maxEmph, 1),
            color: adjustLightness(d3.interpolateGreys(emph / maxEmph), {
              clamp: [20, 80],
            }),
          },
        };
      }),
    ];

    return elements;
  }, [data]);

  const cy = useRef<cytoscape.Core | null>(null);
  useEffect(() => {
    if (onTap) {
      cy.current?.on("tap", onTap);
      return () => {
        cy.current?.off("tap", onTap);
      };
    }
  }, [cy.current, onTap]);

  useEffect(() => {
    cy.current?.layout({ name: "circle" }).run();
  }, [data]);

  return (
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
            width: "data(width)",
            "line-color": "data(color)",
          } as any,
        },
      ]}
      cy={(instance) => {
        cy.current = instance;
      }}
    />
  );
};
