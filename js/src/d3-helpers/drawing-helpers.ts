import * as d3 from "d3";
import { NumberValue } from "d3";

type Selection<D = any> = d3.Selection<any, D, any, any>;
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
  prevWidth,
  prevHeight,
}: {
  width: number;
  height: number;
  prevWidth?: number;
  prevHeight?: number;
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
    <S extends Selection>(g: S) => {
      if (prevWidth !== width || prevHeight !== height) {
        // No transition animation if bounding box changed
        return g.call(d3.axisLeft(y));
      } else {
        return g.transition().call(d3.axisLeft(y));
      }
    },

  bars:
    <X, Y extends NumberValue>(
      data: { x: X; y: Y }[],
      x: d3.ScaleBand<X>,
      y: d3.ScaleLinear<number, number>,
      color: AttributeValue<{ x: X; y: Y }> = d3["schemeCategory10"][0]
    ) =>
    <S extends Selection>(g: S) => {
      const applyAttributes = (g: any) =>
        (g as Selection<{ x: X; y: Y }>)
          .attr("x", (d) => x(d.x)!)
          .attr("width", x.bandwidth())
          .attr("y", (d) => y(d.y))
          .attr("height", (d) => height - y(d.y))
          .attr("fill", color as any);

      if (prevWidth !== width || prevHeight !== height) {
        // No transition animation if bounding box changed
        return g
          .selectAll("rect")
          .data(data)
          .join("rect")
          .call(applyAttributes);
      } else {
        const rects = g.selectAll("rect");

        let prevData = rects.data() as { x: X; y: Y }[];
        if (!Array.isArray(prevData)) prevData = [];
        const prevX = new Set(prevData.map((d) => d.x));

        return rects
          .data(data)
          .join("rect")
          .call((g) =>
            // Transition only on previously existing categories
            g
              .filter((d) => prevX.has(d.x))
              .transition()
              .call(applyAttributes)
          )
          .call((g) =>
            // Instantly apply affects to new categories
            g.filter((d) => !prevX.has(d.x)).call(applyAttributes)
          );
      }
    },
});
