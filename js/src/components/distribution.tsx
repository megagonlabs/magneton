import React from "react";
import { Base } from "../base";
import { CategoricalDatum } from "../types/data-types";
import BarChart from "./charts/bar-chart";

export const Distribution = ({ data }: { data: CategoricalDatum[] }) => {
  return (
    <Base>
      <BarChart data={data} />
    </Base>
  );
};
