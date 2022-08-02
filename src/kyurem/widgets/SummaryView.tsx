import React, { useMemo, useState } from "react";
import { ServiceWrapper } from "../lib/service-wrapper";
import { useAsync } from "react-use";
import { LoadingOverlay } from "../components/loading-overlay";
import { RootPane } from "../components/panes/root-pane";
import { Pane } from "../components/panes/pane";
import { SchemaGraph } from "../components/charts/schema-graph";
import AsyncBarChart from "../components/charts/async-bar-chart";
import * as d3 from "d3";

export const SummaryView = ({
  data: initialNeighborhood,
  ipy_service,
}: {
  data: any;
  ipy_service: string;
}) => {
  const service = useMemo(() => new ServiceWrapper(ipy_service), [ipy_service]);

  const [nodeTitle, setNodeTitle] = useState<string | undefined>();
  const [nodeLabel, setNodeLabel] = useState<string | undefined>();

  const neighborhood = useAsync(async () => {
    if (nodeTitle && nodeLabel) {
      const edges = await service.get_node_neighborhood({
        node_label: nodeLabel,
        node_property: "title",
        node_property_value: nodeTitle,
      });
      const nodeLabels = new Set();
      edges.forEach((el) => {
        nodeLabels.add(el.source);
        nodeLabels.add(el.target);
      });

      return {
        nodes: [...nodeLabels].map((id) => ({ id })),
        edges,
      };
    } else
      return {
        edges: initialNeighborhood.graph_json_links,
        nodes: initialNeighborhood.graph_json_nodes,
      };
  }, [nodeLabel, nodeTitle]);

  const childrenNodeDist = useAsync(
    () => service.get_children_node_distributions(nodeLabel),
    [nodeLabel]
  );
  const degreeDist = useAsync(
    async () =>
      nodeLabel ? await service.get_node_degree_distributions(nodeLabel) : null,
    [nodeLabel]
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
                setNodeLabel(type);
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
              setNodeTitle(d.x);
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
