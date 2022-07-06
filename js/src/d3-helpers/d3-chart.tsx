import { SystemCssProperties } from "@mui/system";
import Box from "@mui/system/Box";
import * as d3 from "d3";
import React, { useRef, useEffect } from "react";
import { useContentRect } from "../lib/use-content-rect";
import { helpers } from "./drawing-helpers";

export type DrawingParams = {
  width: number;
  height: number;
  groups: d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>[];

  helpers: ReturnType<typeof helpers>;
};

/**
 * @param initialize — Called before the first draw. Any selections returned
 * will be forwarded as the `groups` property of DrawingParams
 * @param draw — Called when chart is drawn/redrawn.
 * @param drawDeps — Chart will be redrawn if the values in the list change.
 */
export const D3Chart = ({
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
  initialize,
  draw,
  drawDeps,

  style,
  sx,
}: {
  margin?: { top: number; right: number; bottom: number; left: number };
  initialize: (
    g: d3.Selection<SVGGElement, unknown, null, unknown>
  ) => d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>[] | void;
  draw: (params: DrawingParams) => void;
  drawDeps: unknown[];

  style?: React.CSSProperties;
  sx?: SystemCssProperties;
}) => {
  const [
    containerRef,
    { width: outerWidth = 0, height: outerHeight = 0 } = {},
  ] = useContentRect();

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef =
    useRef<d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>[]>();

  useEffect(() => {
    // Ensure width and height are > 0
    if (!outerWidth || !outerHeight) return;

    // Ensure svg is loaded
    if (!svgRef.current) return;

    // Size the svg appropriately
    const svg = d3
      .select(svgRef.current)
      .attr("width", outerWidth)
      .attr("height", outerHeight);

    // Call initialize only once
    if (initialize && !gRef.current) {
      // Create the main 'group' element
      const g = svg.append("g");
      // move the 'group' element to the top left margin
      g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      gRef.current = initialize(g) ?? [];
    }

    if (gRef.current) {
      // Call draw on every update
      const width = outerWidth - margin.left - margin.right;
      const height = outerHeight - margin.bottom - margin.top;
      draw?.({
        width,
        height,
        groups: gRef.current,
        helpers: helpers({ width, height }),
      });
    }
  }, [outerWidth, outerHeight, ...drawDeps]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        ...sx,
      }}
      style={style}
      ref={containerRef}
    >
      <svg ref={svgRef}></svg>
    </Box>
  );
};
