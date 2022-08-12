import React from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { SchemaGraph } from "../components/schema-graph";
import AsyncBarChart from "../components/charts/async-bar-chart";
import * as d3 from "d3";
import { LoadingOverlay } from "../components/loading-overlay";

export const Explorer = () => {
  const model = useWidgetModel();

  return (
    <Pane initialHeight={800}>
      <Pane>
        <LoadingOverlay
          loading={model.status.schema?.loading}
          error={model.status.schema?.error}
        >
          {model.data.schema && (
            <SchemaGraph
              data={model.data.schema}
              onTap={async (e) => {
                model.actions.filter_by_type(e.target.data("id") ?? null);
              }}
            />
          )}
        </LoadingOverlay>
      </Pane>
      <Pane direction="column">
        <Pane>
          <AsyncBarChart
            state={{
              loading: model.status.children?.loading,
              error: model.status.children?.error,
              value: model.data.children,
            }}
            horizontal
            onClick={async (e, d) => {
              model.actions.filter_by_title(d.x);
            }}
          />
        </Pane>
        <Pane>
          <AsyncBarChart
            state={{
              loading: model.status.relations?.loading,
              error: model.status.relations?.error,
              value: model.data.relations
                ?.sort((a: any, b: any) => a.y - b.y)
                .sort((a: any, b: any) =>
                  (a.type ?? "").localeCompare(b.type ?? "")
                ),
            }}
            color={(d: any) =>
              d3["schemeCategory10"][
                d.type === "in" ? 0 : d.type === "out" ? 1 : 2
              ]
            }
            horizontal
            onClick={async (e, d) => {
              model.actions.filter_by_relation(d.x, d.type);
            }}
          />
        </Pane>
      </Pane>
    </Pane>
  );
};
