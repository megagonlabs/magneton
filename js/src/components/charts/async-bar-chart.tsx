import * as d3 from "d3";
import React, { useEffect, useRef } from "react";
import { CategoricalDatum } from "../../types/data-types";
import { D3Chart } from "../../d3-helpers/d3-chart";
import { AsyncState } from "react-use/lib/useAsync";
import { LoadingOverlay } from "../misc/loading-overlay";
import { AttributeValue } from "../../d3-helpers/drawing-helpers";

const AsyncBarChart = <D extends CategoricalDatum>({
  state,
  color,
}: {
  state: { loading: boolean; error?: any; value?: D[] };
  color?: AttributeValue<D>;
}) => {
  const { loading, error, value: data = [] } = state;
  return (
    <LoadingOverlay loading={!!loading} error={error}>
      <D3Chart
        margin={{ top: 20, right: 20, bottom: 100, left: 40 }}
        initialize={(g) => [g, g.append("g"), g.append("g")]}
        draw={({ width, height, groups: [g, gx, gy], helpers }) => {
          // set the ranges
          const x = d3.scaleBand().range([0, width]).padding(0.1);
          const y = d3.scaleLinear().range([height, 0]);

          // Scale the range of the data in the domains
          x.domain(data.map((d: any) => d.x));
          y.domain([0, d3.max(data, (d: any) => d.y)]);

          // append the rectangles for the bar chart
          g.call(helpers.bars(data, x, y, color));

          // add the x Axis
          gx.call(helpers.xAxis(x));

          // add the y Axis
          gy.call(helpers.yAxis(y));
        }}
        drawDeps={[data]}
      />
    </LoadingOverlay>
  );
};

export default AsyncBarChart;
