import * as d3 from "d3";
import React, { useRef, useEffect } from "react";
import { Data } from "../types";

const FDgraph = (payload: any) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // size of plot
    const width = 800;
    const height = 600;

    // node radius
    const node_radius = payload.data.node_radius;
    // link distance before weight is applied
    const link_distance = payload.data.link_distance;
    // collision exclusion sclae
    const collision_scale = payload.data.collision_scale;
    // link with scale
    const link_width_scale = payload.data.link_width_scale;

    // links and nodes data
    const nodes = payload.data.graph_json_nodes;
    const links = payload.data.graph_json_links;
    const grouped_links = d3.flatGroup(links, d => d.source,  d => d.target);
    grouped_links.forEach(g => {
        g[2].forEach((d, i) => { d.sibling_index = i; });
    });

    console.log(nodes)
    console.log(links)
    console.log(grouped_links)

    // TODO: change domain from id to node type    
    const colors = d3.scaleOrdinal(nodes.map(d => d.id), d3.schemeCategory10);

    // create simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(d => link_distance / d.weight))
        .force("charge", d3.forceManyBody().strength(-20))
        .force("collision", d3.forceCollide().radius(collision_scale * node_radius))
        .force("center", d3.forceCenter(width / 2, height / 2));

    /// dragging nodes
    const drag = simulation => {

        function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
    };

    // select HTML element and attach SVG to it
    const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // TODO: fix location and angle
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("xoverflow", "visible")
        .append("svg:path")
        .attr("d", "M 0,-5 L 10,0 L 0,5")
        .attr("fill", "#999")
        .style("stroke", "none");

    // edges
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("g")
        .data(links)
        .join("g");

    const edgepath = link.append("path")
        // .attr("class", "edgepath")
        .attr("id", function (d, i) {return "edgepath-" + i})
        .style("stroke-width", d => Math.sqrt(link_width_scale * d.weight))
        .attr("marker-end", "url(#arrowhead)");

    const edgelabel = link.append("text")
        // .attr("class", "edgelabels")
        .attr("fill", "#aaa")
        .attr("font-size", 10)
        .attr("id", function (d, i) {return "edgelabel-"+ i});

    edgelabel.append('textPath')
        .attr("xlink:href", function (d, i) {return "#edgepath-"+ i})
        .attr("startOffset", "50%")
        .text(function (d) {return d.label});

    // nodes
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g");

    const circle = node.append("circle")
        .attr("r", node_radius)
        .style("fill", d => colors(d))
        .call(drag(simulation));

    // svg text labels for eachnode
    const label = node.append("text")
        .attr("dx", 1.1 * node_radius)
        .attr("dy", ".35em")
        .text(d => d.id);

    // update svg on simulation ticks
    simulation.on("tick", () => {
        circle
        // keep within edge of canvas, larger margin on right for text labels
            .attr("cx", d => (d.x = Math.max(3*node_radius, Math.min(width - 3*node_radius - 10*d.id.length, d.x)) ))
            .attr("cy", d => (d.y = Math.max(3*node_radius, Math.min(height - 3*node_radius, d.y)) ));

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        
        // path arc:
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // a rx ry x-axis-rotation large-arc-flag sweep-flag dx dy
        edgepath.attr("d", function (d) {
            if (d.source.x == d.target.x && d.source.y == d.target.y) { // self loop
                return "M" + (d.source.x + 1) + "," + (d.source.y + 1)
                    + "A" + node_radius * 1.5 + "," + node_radius * 1 + ",-45,1,0," + d.target.x + "," + d.target.y;
            } else {
                var r = Math.sqrt((d.target.x - d.source.x)**2 + (d.target.y - d.source.y)**2)
                var angle = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI;
                return "M" + d.source.x + "," + d.source.y + 
                    "A" + r + "," + r * 0.5 * (d.sibling_index + 1) 
                    + "," + angle + ",0,1," + d.target.x + "," + d.target.y;
            }
        });

        // TODO: fix label shape
        edgelabel.attr('transform', function (d) {
            if (d.target.x < d.source.x) {
                var bbox = this.getBBox();

                var rx = bbox.x + bbox.width / 2;
                var ry = bbox.y + bbox.height / 2;
                return 'rotate(180 ' + rx + ' ' + ry + ')';
            }
            else {
                return 'rotate(0)';
            }
        });
    });
  }, []);

  return (
    <div>
      <svg ref={ref}></svg>
    </div>
  );
};

export default FDgraph;
