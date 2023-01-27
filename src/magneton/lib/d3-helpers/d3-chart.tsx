import { useForkRef } from "@mui/material";
import Box from "@mui/system/Box";
import * as d3 from "d3";
import React, {
  useRef,
  useEffect,
  ComponentPropsWithoutRef,
  forwardRef,
  Ref,
} from "react";
import { useContentRect } from "../use-content-rect";
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
export const D3Chart = forwardRef(
  (
    {
      margin = { top: 0, right: 0, bottom: 0, left: 0 },
      initialize,
      draw,
      drawDeps,
      ...props
    }: {
      margin?: { top: number; right: number; bottom: number; left: number };
      initialize: (
        g: d3.Selection<SVGGElement, unknown, null, unknown>
      ) => d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>[] | void;
      draw: (params: DrawingParams) => void;
      drawDeps: unknown[];
    } & ComponentPropsWithoutRef<typeof Box>,
    ref: Ref<HTMLDivElement>
  ) => {
    const [
      containerRef,
      { width: outerWidth = 0, height: outerHeight = 0 } = {},
    ] = useContentRect();

    const svgRef = useRef<SVGSVGElement>(null);
    const gRef =
      useRef<d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>[]>();

    const prevDims = useRef({ width: 0, height: 0 });

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
        g.attr(
          "transform",
          "translate(" + margin.left + "," + margin.top + ")"
        );

        gRef.current = initialize(g) ?? [];
      }

      if (gRef.current) {
        // Call draw on every update
        const width = outerWidth - margin.left - margin.right;
        const height = outerHeight - margin.bottom - margin.top;

        const didResize =
          Math.abs(width - prevDims.current.width) > 0.01 ||
          Math.abs(height - prevDims.current.height) > 0.01;

        draw?.({
          width,
          height,
          groups: gRef.current,
          helpers: helpers({ width, height, didResize }),
        });

        prevDims.current = { width, height };
      }
    }, [outerWidth, outerHeight, ...drawDeps]);

    return (
      <Box
        width="100%"
        height="100%"
        position="absolute"
        ref={useForkRef(containerRef, ref)}
        {...props}
      >
        <svg ref={svgRef}></svg>
      </Box>
    );
  }
);
