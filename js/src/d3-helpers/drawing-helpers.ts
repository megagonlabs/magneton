import * as d3 from "d3";
import { NumberValue } from "d3";

type Selection = d3.Selection<any, any, any, any>;
type AttributeValue<D> =
  | string
  | number
  | boolean
  | null
  | ((d: D) => string | number | boolean | null);

/**
 * A collection of helper functions for making d3 charts while
 * maintaining a consistent style
 */
export const helpers = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => ({
  xAxis:
    <A extends d3.AxisScale<any>>(x: A) =>
    <S extends Selection>(g: S) =>
      g
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)"),

  yAxis:
    <A extends d3.AxisScale<any>>(y: A) =>
    <S extends Selection>(g: S) =>
      g.transition().call(d3.axisLeft(y)),

  bars:
    <X, Y extends NumberValue>(
      data: { x: X; y: Y }[],
      x: d3.ScaleBand<X>,
      y: d3.ScaleLinear<number, number>,
      color: AttributeValue<{ x: X; y: Y }> = d3["schemeCategory10"][0]
    ) =>
    <S extends Selection>(g: S) =>
      g
        .selectAll("rect")
        .data(data)
        .join("rect")
        .call((g) =>
          g
            .transition()
            .attr("x", (d) => x(d.x)!)
            .attr("width", x.bandwidth())
            .attr("y", (d) => y(d.y))
            .attr("height", (d) => height - y(d.y))
            .attr("fill", color as any)
        ),
});
