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
import InteractiveBarChart from "./charts/interactive-bar-chart";

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
    () => service.get_children_node_distributions(selectedType),
    [selectedType]
  );

  return (
    <RootPane initialHeight={600}>
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
            <InteractiveBarChart data={value} />
          </LoadingOverlay>
        </Pane>
        <Pane>
          Hello World
        </Pane>
        <Pane>
          Hello Again
        </Pane>
      </Pane>
    </RootPane>
  );
};
