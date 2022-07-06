import React from "react";
import BarChart from "./charts/bar-chart";
import { CategoricalDatum } from "../types/data-types";
import { RootPane } from "./panes/root-pane";
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
