import * as d3 from "d3";
import React from "react";
import { CategoricalDatum } from "../../lib/types/data-types";
import { D3Chart } from "../../lib/d3-helpers/d3-chart";
import { AttributeValue } from "../../lib/d3-helpers/drawing-helpers";
import Box from "@mui/system/Box";
import { measureTextWidth } from "../../lib/text-size";
import { usePaneSize } from "../panes/pane-context";

const BarChart = <D extends CategoricalDatum>({
  data,
  color,
  horizontal = false,
  minBarSize = 20,
  marginTop = 20,
  marginLeft = horizontal ? 20 : 40,
  marginBottom = horizontal ? 20 : 20,
  marginRight = 20,
  onClick,
}: {
  data: D[];
  color?: AttributeValue<D>;
  horizontal?: boolean;
  minBarSize?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  onClick?: (event: MouseEvent, datum: D) => void;
}) => {
  const padding = 0.1;

  const minChartSize = data.length * (minBarSize + padding);

  const scale = {
    x: (width: number, height: number) =>
      d3
        .scaleBand()
        .padding(padding)
        .domain(data.map((d: any) => d.x))
        .range([0, Math.max(horizontal ? height : width, minChartSize)]),

    y: (width: number, height: number) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d: any) => d.y)])
        .range(horizontal ? [0, width] : [height, 0]),
  };

  const paneRect = usePaneSize();

  return (
    <Box
      position="absolute"
      width="100%"
      height="100%"
      sx={{ transform: "translate(0,0)" }}
    >
      <Box
        position="absolute"
        width="100%"
        height="100%"
        sx={{
          ...(horizontal
            ? { overflowX: "hidden", overflowY: "auto" }
            : {
                overflowX: "auto",
                overflowY: "hidden",
              }),
        }}
      >
        <D3Chart
          margin={{
            top: marginTop,
            left: marginLeft,
            bottom: marginBottom,
            right: marginRight,
          }}
          initialize={(g) => [
            g.append("g"),
            g.append("g"),
            g.append("g"),
            g.append("g"),
          ]}
          draw={({
            width,
            height,
            groups: [ggrid, gbars, gaxis, glabels],
            helpers,
          }) => {
            // set the ranges
            const x = scale.x(width, height);
            const y = scale.y(width, height);

            // add the rectangles for the bar chart
            gbars.call(
              helpers.bars({ data, x, y, color, horizontal, onClick })
            );

            // add the independent axis
            gaxis.call(
              horizontal
                ? helpers.yAxis({ scale: x, hideLabels: true })
                : helpers.xAxis({ scale: x })
            );

            // add gridlines
            ggrid
              .selectAll("line")
              .data(y.ticks())
              .join("line")
              .attr("fill", "none")
              .attr("stroke", "rgba(0,0,0,0.1)")
              .attr("stroke-width", "1px")
              .call((g) =>
                horizontal
                  ? g
                      .attr("x1", y)
                      .attr("x2", y)
                      .attr("y1", 0)
                      .attr("y2", height)
                  : g
                      .attr("y1", y)
                      .attr("y2", y)
                      .attr("x1", 0)
                      .attr("x2", width)
              );

            // Overlay labels in horiz. mode
            if (horizontal) {
              glabels
                .selectAll("text")
                .data(data)
                .join("text")
                .attr(
                  "x",
                  (d) =>
                    5 + (measureTextWidth(d.x, 14) + 10 > y(d.y) ? y(d.y) : 0)
                )
                .attr("fill", (d) =>
                  measureTextWidth(d.x, 14) + 10 > y(d.y) ? "black" : "white"
                )
                .attr("y", (d) => x(d.x)! + x.bandwidth() / 2 + 4.5)
                .text((d) => d.x);
            }
          }}
          drawDeps={[data, horizontal]}
          sx={{
            ...(horizontal && {
              "& .tick line": {
                visibility: "hidden",
              },
            }),
            ...(paneRect &&
              (horizontal
                ? minChartSize + marginBottom + marginTop > paneRect.height && {
                    height: minChartSize + marginBottom + marginTop,
                  }
                : minChartSize + marginLeft + marginRight > paneRect.width && {
                    width: minChartSize + marginLeft + marginRight,
                  })),
          }}
        />

        <D3Chart
          margin={{
            top: horizontal ? marginTop : marginTop + marginBottom - 10,
            right: marginRight,
            bottom: horizontal ? marginBottom + 0.5 : 10,
            left: marginLeft,
          }}
          initialize={(g) => [g.append("g")]}
          draw={({ width, height, groups: [g], helpers }) => {
            // set the ranges
            const y = scale.y(width, height);

            // add the dependent axis
            g.call(
              horizontal
                ? helpers.xAxis({ scale: y })
                : helpers.yAxis({ scale: y })
            );
          }}
          drawDeps={[data, horizontal]}
          position="fixed"
          bgcolor="white"
          sx={
            horizontal
              ? { height: marginBottom + 1, bottom: 0 }
              : { width: marginLeft + 0.5, left: 0, bottom: marginBottom - 10 }
          }
        />
      </Box>
    </Box>
  );
};

export default BarChart;
