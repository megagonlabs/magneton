import React, { useMemo, useState } from "react";
import DynamicBarChart from "../components/charts/dynamic-bar-chart";
import BarChart from "../components/charts/bar-chart";
import { ServiceWrapper } from "../lib/service-wrapper";
import { CategoricalDatum } from "../lib/types/data-types";
import { useAsync } from "react-use";
import { LoadingOverlay } from "../components/loading-overlay";
import { RootPane } from "../components/panes/root-pane";
import { Pane } from "../components/panes/pane";

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
    <RootPane>
      <Pane>
        <DynamicBarChart
          data={data.node}
          onSelect={(d) => {
            setSelectedType(d.x);
          }}
        />
      </Pane>
      <Pane>
        <LoadingOverlay
          sx={{ width: "100%", height: "100%" }}
          loading={loading}
          error={error}
        >
          <BarChart data={value} />
        </LoadingOverlay>
      </Pane>
    </RootPane>
  );
};
