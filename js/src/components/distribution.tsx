import React from "react";
import { Base } from "../base";
import { CategoricalData } from "../types/data-types";
import BarChart from "./charts/bar-chart";

export const Distribution = ({ data }: { data: CategoricalData }) => {
  return (
    <Base>
      <BarChart data={data} />
    </Base>
  );
};
