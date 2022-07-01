import React from "react";
import { Base } from "../base";
import DynamicBarChart from "./charts/dynamic-bar-chart";
import BarChart from "./charts/bar-chart";
import Stack from "@mui/material/Stack";
import { ServiceWrapper } from "../lib/service-wrapper";
import { CategoricalData } from "../types/data-types";

export const LinkedDistribution = ({
  data,
  ipy_service,
}: {
  data: { node: CategoricalData; granularity: any };
  ipy_service: string;
}) => {
  const node = data.node;
  const granularity = data.granularity;
  const service = new ServiceWrapper(ipy_service);

  return (
    <Base>
      <Stack direction="row" spacing={2}>
        <DynamicBarChart data={node} service={service} />
        <BarChart data={granularity} />
      </Stack>
    </Base>
  );
};
