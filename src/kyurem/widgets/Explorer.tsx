import React from "react";
import { VegaHelper } from "../components/vega-helper";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { SchemaGraph } from "../components/schema-graph";
import { useAsync } from "react-use";
import AsyncBarChart from "../components/charts/async-bar-chart";
import * as d3 from "d3";

export const Explorer = () => {
  const model = useWidgetModel();

  const childData = useAsync(
    async () => await model.children_distribution(model.current_node),
    [model.current_node]
  );

  const relationData = useAsync(
    async () => await model.relation_distribution(model.current_node),
    [model.current_node]
  );

  return (
    <Pane>
      <Pane>
        {model.schema && (
          <SchemaGraph
            data={model.schema}
            onTap={async (e) => {
              model.current_node = e.target.data("id");
            }}
          />
        )}
      </Pane>
      <Pane direction="column">
        <Pane>
          <AsyncBarChart
            state={childData}
            horizontal
            onClick={async (e, d) => {
              model.schema = await model.node_neighborhood_schema({
                node_label: model.current_node,
                node_property: "title",
                node_property_value: d.x,
              });
            }}
          />
        </Pane>
        <Pane>
          <AsyncBarChart
            state={{
              ...relationData,
              value: relationData.value
                ?.sort((a: any, b: any) => a.y - b.y)
                .sort((a: any, b: any) => a.type.localeCompare(b.type)),
            }}
            color={(d: any) => d3["schemeCategory10"][d.type === "in" ? 0 : 1]}
            horizontal
            onClick={async (e, d) => {
              model.schema = await model.relation_neighborhood_schema({
                type: d.x,
                direction: d.type,
              });
            }}
          />
        </Pane>
      </Pane>
    </Pane>
  );
};
