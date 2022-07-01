import React from "react";
import { Base } from "../base";
import DynamicBarChart from "./charts/dynamic-bar-chart";
import BarChart from "./charts/bar-chart";
import { Data } from "./types";
import Stack from '@mui/material/Stack';

export const LinkedDistribution = (payload: any) => {
  const node = payload.data.node;
  const granularity = payload.data.granularity;
  const ipy_service = payload.ipy_service;
  return (
    <Base>
      <Stack direction="row" spacing={2}>
        <DynamicBarChart data={node} service={ipy_service}/>
        <BarChart data={granularity} />
      </Stack>
    </Base>
  );
};
