import React from "react";
import BarChart from "../components/charts/bar-chart";
import { CategoricalDatum } from "../lib/types/data-types";
import { RootPane } from "../components/panes/root-pane";
import Box from "@mui/system/Box";

export const DualDistribution = ({
  data,
}: {
  data: { node: CategoricalDatum[]; granularity: any };
}) => {
  const node = data.node;
  const granularity = data.granularity;
  return (
    <RootPane>
      <Box display="flex" height="100%">
        <BarChart data={node} />
        <BarChart data={granularity} />
      </Box>
    </RootPane>
  );
};
