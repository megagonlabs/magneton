import React, { useMemo, useState } from "react";
import { Base } from "../base";
import DynamicBarChart from "./charts/dynamic-bar-chart";
import BarChart from "./charts/bar-chart";
import Stack from "@mui/material/Stack";
import { ServiceWrapper } from "../lib/service-wrapper";
import { CategoricalDatum } from "../types/data-types";

export const LinkedDistribution = ({
  data,
  ipy_service,
}: {
  data: { node: CategoricalDatum[]; granularity: CategoricalDatum[] };
  ipy_service: string;
}) => {
  
  const [granularity, setGranularity] = useState<CategoricalDatum[]>(
    data.granularity
  );

  const node = data.node;
  const service = useMemo(() => new ServiceWrapper(ipy_service), [ipy_service]);

  return (
    <Base>
      <Stack direction="row" spacing={2}>
        <DynamicBarChart
          data={node}
          onSelect={async (d) => {
            setGranularity(
              await service.get_node_granularity_distribution(d.x)
            );
          }}
        />
        <BarChart data={granularity} />
      </Stack>
    </Base>
  );
};
