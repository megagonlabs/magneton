import React from "react";
import { Base } from "../base";
import { CategoricalDatum } from "../types/data-types";
import BarChart from "./charts/bar-chart";
import { RootPane } from "./panes/root-pane";

export const Distribution = ({ data }: { data: CategoricalDatum[] }) => {
  return (
    <RootPane>
      <BarChart data={data} />
    </RootPane>
  );
};
