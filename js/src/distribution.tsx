import React from "react";
import { Base } from "./base";
import BarChart from "./charts/bar-chart";
import { Data } from "./types";

export const Distribution = ({ data }: { data: Data }) => {
  return (
    <Base>
      <BarChart data={data} />
    </Base>
  );
};
