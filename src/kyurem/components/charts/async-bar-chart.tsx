import React from "react";
import { CategoricalDatum } from "../../lib/types/data-types";
import { LoadingOverlay } from "../loading-overlay";
import { AttributeValue } from "../../lib/d3-helpers/drawing-helpers";
import BarChart from "./bar-chart";

const AsyncBarChart = <D extends CategoricalDatum>({
  state,
  color,
  horizontal,
  onClick,
}: {
  state: { loading: boolean; error?: any; value?: D[] };
  color?: AttributeValue<D>;
  horizontal?: boolean;
  onClick?: (event: MouseEvent, data: D) => void;
}) => {
  const { loading, error, value: data = [] } = state;
  return (
    <LoadingOverlay loading={!!loading} error={error}>
      <BarChart
        data={data}
        horizontal={horizontal}
        color={color}
        onClick={onClick}
      />
    </LoadingOverlay>
  );
};

export default AsyncBarChart;
