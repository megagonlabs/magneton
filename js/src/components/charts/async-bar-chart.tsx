import React from "react";
import { CategoricalDatum } from "../../types/data-types";
import { LoadingOverlay } from "../misc/loading-overlay";
import { AttributeValue } from "../../d3-helpers/drawing-helpers";
import BarChart from "./bar-chart";

const AsyncBarChart = <D extends CategoricalDatum>({
  state,
  color,
  horizontal,
}: {
  state: { loading: boolean; error?: any; value?: D[] };
  color?: AttributeValue<D>;
  horizontal?: boolean;
}) => {
  const { loading, error, value: data = [] } = state;
  return (
    <LoadingOverlay loading={!!loading} error={error}>
      <BarChart data={data} horizontal={horizontal} color={color} />
    </LoadingOverlay>
  );
};

export default AsyncBarChart;
