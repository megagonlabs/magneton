import React, { useMemo, useState } from "react";
import DynamicBarChart from "./charts/dynamic-bar-chart";
import BarChart from "./charts/bar-chart";
import { ServiceWrapper } from "../lib/service-wrapper";
import { CategoricalDatum, GraphData } from "../types/data-types";
import { useAsync } from "react-use";
import { LoadingOverlay } from "./misc/loading-overlay";
import { RootPane } from "./panes/root-pane";
import { Pane } from "./panes/pane";
import { SchemaGraph } from "./charts/schema-graph";
import { LinkedDistribution } from "./linked-distribution";

export const SummaryView = ({
  data,
  ipy_service,
}: {
  data: GraphData;
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
        <SchemaGraph
          data={data}
          onTap={(e) => {
            const type = e.target.data("id");
            setSelectedType(type);
          }}
        />
      </Pane>
      <Pane direction="column">
        <Pane>
          <LoadingOverlay loading={loading} error={error}>
            <BarChart data={value} />
          </LoadingOverlay>
        </Pane>
        <Pane>WIP 2</Pane>
      </Pane>
    </RootPane>
  );
};
