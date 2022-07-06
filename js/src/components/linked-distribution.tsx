import React, { useMemo, useState } from "react";
import { Base } from "../base";
import DynamicBarChart from "./charts/dynamic-bar-chart";
import BarChart from "./charts/bar-chart";
import Stack from "@mui/material/Stack";
import { ServiceWrapper } from "../lib/service-wrapper";
import { CategoricalDatum } from "../types/data-types";
import { useAsync } from "react-use";
import { LoadingOverlay } from "./misc/loading-overlay";

export const LinkedDistribution = ({
  data,
  ipy_service,
}: {
  data: { node: CategoricalDatum[] };
  ipy_service: string;
}) => {
  const service = useMemo(() => new ServiceWrapper(ipy_service), [ipy_service]);

  const [selectedType, setSelectedType] = useState<string | undefined>();
  const {
    loading,
    error,
    value = [],
  } = useAsync(
    () => service.get_node_granularity_distribution(selectedType),
    [selectedType]
  );

  return (
    <Base>
      <Stack direction="row" spacing={2}>
        <DynamicBarChart
          data={data.node}
          onSelect={(d) => {
            setSelectedType(d.x);
          }}
        />
        <LoadingOverlay sx={{ width: "100%" }} loading={loading} error={error}>
          <BarChart data={value} />
        </LoadingOverlay>
      </Stack>
    </Base>
  );
};
