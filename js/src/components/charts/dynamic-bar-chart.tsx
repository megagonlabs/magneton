import * as d3 from "d3";
import React from "react";
import { ServiceWrapper } from "../../lib/service-wrapper";
// import { useClientDims } from "../../lib/use-content-rect";
import { CategoricalData } from "../../types/data-types";
import { D3Chart } from "./d3-chart";

const DynamicBarChart = ({
  data,
  service,
}: {
  data: CategoricalData;
  service: ServiceWrapper;
}) => {
  return (
    <D3Chart
      margin={{ top: 20, right: 20, bottom: 100, left: 40 }}
      initialize={(g) => [g, g.append("g"), g.append("g")]}
      draw={({ height, width, groups: [g, gx, gy] }) => {
        // set the ranges
        const x = d3.scaleBand().range([0, width]).padding(0.1);
        const y = d3.scaleLinear().range([height, 0]);

        // Scale the range of the data in the domains
        x.domain(data.map((d: any) => d.x));
        y.domain([0, d3.max(data, (d: any) => d.y)]);

        // append the rectangles for the bar chart
        g.selectAll("rect")
          .data(data)
          .join("rect")
          .attr("x", (d) => x(d.x)!)
          .attr("width", x.bandwidth())
          .attr("y", (d) => y(d.y))
          .attr("height", (d) => height - y(d.y))
          .on("click", async (d) => {
            // Do something on click
            // Remember, we drew random barcharts?
            const barObj = d.target.__data__.x;
            console.log(barObj);
            const dist = await service.get_node_granularity_distribution(
              barObj
            );
            console.log(dist);
          });

        // add the x Axis
        gx.attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)");

        // add the y Axis
        gy.call(d3.axisLeft(y));
      }}
      drawDeps={[]}
    />
  );
};

export default DynamicBarChart;
