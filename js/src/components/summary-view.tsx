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
import AsyncBarChart from "./charts/async-bar-chart";
import * as d3 from "d3";

export const SummaryView = ({
  data,
  ipy_service,
}: {
  data: GraphData;
  ipy_service: string;
}) => {
  const service = useMemo(() => new ServiceWrapper(ipy_service), [ipy_service]);

  const [selectedType, setSelectedType] = useState<string | undefined>();
  const childrenNodeDist = useAsync(
    () => service.get_children_node_distributions(selectedType),
    [selectedType]
  );
  const degreeDist = useAsync(
    () => service.get_node_degree_distributions(selectedType),
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
          <AsyncBarChart state={childrenNodeDist} />
        </Pane>
        <Pane>
          <AsyncBarChart
            state={degreeDist}
            color={(d) => d3["schemeCategory10"][d.type === "in" ? 0 : 1]}
          />
        </Pane>
      </Pane>
    </RootPane>
  );
};
