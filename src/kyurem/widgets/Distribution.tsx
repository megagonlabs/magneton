import React from "react";
import { CategoricalDatum } from "../lib/types/data-types";
import BarChart from "../components/charts/bar-chart";
import { RootPane } from "../components/panes/root-pane";

export const Distribution = ({ data }: { data: CategoricalDatum[] }) => {
  return (
    <RootPane>
      <BarChart data={data} />
    </RootPane>
  );
};
