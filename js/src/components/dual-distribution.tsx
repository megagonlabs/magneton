import React from "react";
import { Base } from "../base";
import BarChart from "./charts/bar-chart";
import { Data } from "./types";
import Stack from '@mui/material/Stack';

export const DualDistribution = (payload: any) => {
  const node = payload.data.node;
  const granularity = payload.data.granularity;
  return (
    <Base>
      <Stack direction="row" spacing={2}>
        <BarChart data={node} />
        <BarChart data={granularity} />
      </Stack>
    </Base>
  );
};