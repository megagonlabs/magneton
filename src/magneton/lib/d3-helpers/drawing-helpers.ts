import * as d3 from "d3";

type Selection<D = any> = d3.Selection<any, D, any, any>;

export type AttributeValue<D> =
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
  didResize,
}: {
  width: number;
  height: number;
  didResize: boolean;
}) => {
  /** Creates a transition from selection iff not resizing */
  const smartTransition = <S extends Selection>(g: S) => g; // Disable transitions for now
  // (didResize
  //   ? g.transition().duration(0)
  //   : g.transition().duration(200)) as unknown as S;

  return {
    xAxis:
      <A extends d3.AxisScale<any>>({ scale }: { scale: A }) =>
      <S extends Selection>(g: S) =>
        g
          .call((g) =>
            smartTransition(g).attr("transform", "translate(0," + height + ")")
          )
          .call(d3.axisBottom(scale)),

    yAxis:
      <A extends d3.AxisScale<any>>({
        scale,
        hideLabels = false,
      }: {
        scale: A;
        hideLabels?: boolean;
      }) =>
      <S extends Selection>(g: S) =>
        smartTransition(g).call(
          hideLabels ? d3.axisLeft(scale).tickValues([]) : d3.axisLeft(scale)
        ),

    bars:
      <X, D extends { x: X; y: any }>({
        data,
        x,
        y,
        color = d3["schemeCategory10"][0],
        horizontal = false,
        onClick = () => {},
      }: {
        data: D[];
        x: d3.ScaleBand<X>;
        y: d3.ScaleLinear<number, number>;
        color?: AttributeValue<D>;
        horizontal?: boolean;
        onClick?: (event: MouseEvent, datum: D) => void;
      }) =>
      <S extends Selection>(g: S) => {
        const attr = (g: Selection<D>) =>
          (horizontal
            ? g
                .attr("x", () => y(0))
                .attr("width", (d) => y(d.y))
                .attr("y", (d) => x(d.x)!)
                .attr("height", x.bandwidth())
            : g
                .attr("x", (d) => x(d.x)!)
                .attr("width", x.bandwidth())
                .attr("y", (d) => y(d.y))
                .attr("height", (d) => height - y(d.y))
          ).attr("fill", color as any);

        return g
          .selectAll("rect")
          .data(data)
          .join(
            (enter) => enter.append("rect").call(attr),
            (update) => smartTransition(update).call(attr)
          )
          .on("click", onClick);
      },
  };
};
