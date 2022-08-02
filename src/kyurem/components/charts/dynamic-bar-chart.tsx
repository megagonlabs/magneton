import * as d3 from "d3";
import React, { useState } from "react";
import { CategoricalDatum } from "../../lib/types/data-types";
import { D3Chart } from "../../lib/d3-helpers/d3-chart";

const DynamicBarChart = ({
  data,
  onSelect,
}: {
  data: CategoricalDatum[];
  onSelect?: (d: CategoricalDatum) => void;
}) => {
  const [selectedDatum, setSelectedDatum] = useState<CategoricalDatum | null>(
    null
  );

  return (
    <D3Chart
      margin={{ top: 20, right: 20, bottom: 100, left: 40 }}
      initialize={(g) => [g, g.append("g"), g.append("g")]}
      draw={({ height, width, groups: [g, gx, gy], helpers }) => {
        // set the ranges
        const x = d3.scaleBand().range([0, width]).padding(0.1);
        const y = d3.scaleLinear().range([height, 0]);

        // Scale the range of the data in the domains
        x.domain(data.map((d: any) => d.x));
        y.domain([0, d3.max(data, (d: any) => d.y)]);

        // append the rectangles for the bar chart
        const bars = helpers.bars({ data, x, y })(g);
        bars
          .style("stroke", (d) => (d === selectedDatum ? "#ff0000" : ""))
          .style("stroke-width", (d) => (d === selectedDatum ? "2px" : "0"))
          .on("click", async (e, d) => {
            onSelect?.(d);
            setSelectedDatum(d);
          });

        // add the x Axis
        gx.call(helpers.xAxis({ scale: x }));

        // add the y Axis
        gy.call(helpers.yAxis({ scale: y }));
      }}
      drawDeps={[data, selectedDatum]}
    />
  );
};

export default DynamicBarChart;
