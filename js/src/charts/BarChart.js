import * as d3 from 'd3';
import React, { useRef, useEffect } from 'react';

function BarChart(bar_data){
    const ref = useRef();
    
    useEffect(() => {
        // set the dimensions and margins of the graph
        // size of plot
        const margin = {top: 20, right: 20, bottom: 100, left: 40},
            width = 600 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;
        const data = bar_data.data;

        // set the ranges
        var x = d3.scaleBand()
                  .range([0, width])
                  .padding(0.1);
        var y = d3.scaleLinear()
                  .range([height, 0]);

        // append the svg object to the body of the page
        // append a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        const svg = d3.select(ref.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data in the domains
        x.domain(data.map(function(d) { return d.x; }));
        y.domain([0, d3.max(data, function(d) { return d.y; })]);

        // append the rectangles for the bar chart
        svg.selectAll(".bar")
          .data(data)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.x); })
          .attr("width", x.bandwidth())
          .attr("y", function(d) { return y(d.y); })
          .attr("height", function(d) { return height - y(d.y); });

        // add the x Axis
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // add the y Axis
        svg.append("g")
          .call(d3.axisLeft(y));
    }, []);


    return (
        <div className="chart">
            <svg ref={ref}>
            </svg>
        </div>
        
    )

};

export default BarChart;