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
  data: initialNeighborhood,
  ipy_service,
}: {
  data: GraphData;
  ipy_service: string;
}) => {
  const service = useMemo(() => new ServiceWrapper(ipy_service), [ipy_service]);

  const [mainNode, setMainNode] = useState<string | undefined>();
  const [node, setNode] = useState<string | undefined>();

  // const schema = use
  const neighborhood = useAsync(
    async () =>
      mainNode
        ? await service.get_node_neighborhood(mainNode)
        : initialNeighborhood,
    [mainNode]
  );
  const childrenNodeDist = useAsync(
    () => service.get_children_node_distributions(node),
    [node]
  );
  const degreeDist = useAsync(
    async () =>
      node ? await service.get_node_degree_distributions(node) : null,
    [node]
  );

  return (
    <RootPane initialHeight={600}>
      <Pane>
        <LoadingOverlay
          error={neighborhood.error}
          loading={neighborhood.loading}
        >
          {neighborhood.value && (
            <SchemaGraph
              data={neighborhood.value}
              onTap={(e) => {
                const type = e.target.data("id");
                setNode(type);
              }}
            />
          )}
        </LoadingOverlay>
      </Pane>
      <Pane direction="column">
        <Pane>
          <AsyncBarChart
            state={childrenNodeDist}
            horizontal
            onClick={(e, d) => {
              setMainNode(d.x);
            }}
          />
        </Pane>
        <Pane>
          <AsyncBarChart
            state={{
              ...degreeDist,
              value: degreeDist.value
                ?.sort((a, b) => a.y - b.y)
                .sort((a, b) => a.type.localeCompare(b.type)),
            }}
            color={(d) => d3["schemeCategory10"][d.type === "in" ? 0 : 1]}
            horizontal
          />
        </Pane>
      </Pane>
    </RootPane>
  );
};
