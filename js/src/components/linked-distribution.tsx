import React, { useMemo, useState } from "react";
import DynamicBarChart from "./charts/dynamic-bar-chart";
import BarChart from "./charts/bar-chart";
import { ServiceWrapper } from "../lib/service-wrapper";
import { CategoricalDatum } from "../types/data-types";
import { useAsync } from "react-use";
import { LoadingOverlay } from "./misc/loading-overlay";
import { RootPane } from "./panes/root-pane";
import { Pane } from "./panes/pane";

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
      <Pane direction="column">
        <Pane>
          <LoadingOverlay
            sx={{ width: "100%", height: "100%" }}
            loading={loading}
            error={error}
          >
            <BarChart data={value} />
          </LoadingOverlay>
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
      </Pane>
    </RootPane>
  );
};
