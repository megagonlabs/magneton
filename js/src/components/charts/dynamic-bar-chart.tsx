import * as d3 from "d3";
import React, { useRef, useEffect } from "react";
import { Data } from "../types";
import { ipy_function } from "../constant";

const DynamicBarChart = (payload: any) => {
  const ref = useRef<SVGSVGElement>(null);
  const data = payload.data;
  const service = payload.service;

  useEffect(() => {
    // set the dimensions and margins of the graph
    // size of plot
    const margin = { top: 20, right: 20, bottom: 100, left: 40 },
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    // set the ranges
    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const svg = d3
      .select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data in the domains
    x.domain(data.map((d: any) => d.x));
    y.domain([0, d3.max(data, (d: any) => d.y)]);

    // append the rectangles for the bar chart
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.x)!)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.y))
      .attr("height", (d) => height - y(d.y))
      .on("click", function(d, i) {
        // Do something on click
        // Remember, we drew random barcharts?
        const barObj = d.target.__data__.x;
        console.log(barObj);
        console.log(service);
        const get_granularity_distribution = `${service}.get_node_granularity_distribution(node_type='${barObj}')`;
        ipy_function(get_granularity_distribution)
            .then((result) => {
              const clicked_distribution = JSON.parse(result);
              console.log(clicked_distribution);
            })
            .catch((error) => {
                console.log("Bar click error!!!")
            });


      });

    // add the x Axis
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    // add the y Axis
    svg.append("g").call(d3.axisLeft(y));
  }, []);

  return (
    <div>
      <svg ref={ref}></svg>
    </div>
  );
};

export default DynamicBarChart;