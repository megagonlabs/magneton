import React, { useMemo } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { LoadingOverlay } from "../components/loading-overlay";
import {
  makeNodeColorScale,
  Schema,
  SchemaGraph,
} from "../components/schema-graph";
import { useObject } from "../lib/use-object";
import { horizontalBarChart, VegaHelper } from "../components/vega-helper";
import { LongBarChart } from "../components/long-bar-chart";

export const Explorer = () => {
  const model = useWidgetModel<Model>();

  const baseSchema = useObject(model.data.base_schema);
  const nodeColorScale = useMemo(
    () => makeNodeColorScale(baseSchema),
    [baseSchema]
  );

  return (
    <Pane initialHeight={800}>
      <Pane>
        <LoadingOverlay
          loading={model.status.schema?.loading}
          error={model.status.schema?.error}
        >
          {baseSchema && (
            <SchemaGraph
              baseSchema={baseSchema}
              nodeColorScale={nodeColorScale}
              schema={model.data.schema}
              selection={model.state.selection}
              onSelect={(node) => {
                if (!node) {
                  model.state.selection = null;
                  model.actions.filter_by_label(null);
                }
                if (node?.isNode()) {
                  model.state.selection = node.id();
                  model.actions.filter_by_label(node.data("label"));
                }
              }}
            />
          )}
        </LoadingOverlay>
      </Pane>
      <Pane direction="column">
        <Pane>
          <LongBarChart
            spec={[
              horizontalBarChart({
                categories: { sort: null },
                bar: {
                  mark: {
                    fill: model.state.nodelabel
                      ? nodeColorScale(model.state.nodelabel)
                      : undefined,
                  },
                  encoding: {
                    stroke: { value: "red" },
                    strokeWidth: {
                      condition: [
                        {
                          value: 3,
                          test: {
                            field: "x",
                            equal: model.state.nodetitle ?? false,
                          },
                        },
                      ],
                      value: 0,
                    },
                  },
                },
              }),
            ]}
            data={{
              loading: model.status.children?.loading,
              value: model.data.children?.sort((a, b) => b.y - a.y),
            }}
            signals={{
              select: {
                on: [{ events: "rect:click", update: "datum" }],
              },
            }}
            signalListeners={{
              select(_, datum: ChildDatum) {
                model.actions.filter_by_title(datum.x);
              },
            }}
          />
        </Pane>
        <Pane>
          <LongBarChart
            spec={[
              {
                encoding: {
                  color: {
                    field: "type",
                    type: "nominal",
                    scale: { domain: ["in", "out", "in/out"] },
                  },
                },
              },
              horizontalBarChart({
                categories: { field: "label", sort: { field: "type" } },
              }),
            ]}
            data={{
              loading: model.status.relations?.loading,
              error: model.status.relations?.error,
              value: model.data.relations
                ?.map((r) => ({
                  direction: r.type,
                  type: "in/out",
                  label: `${r.x}${r.type ? ` (${r.type})` : ""}`,
                  ...r,
                }))
                .sort((a, b) => a.type.localeCompare(b.type) || b.y - a.y),
            }}
            signals={{
              select: { on: [{ events: "rect:click", update: "datum" }] },
            }}
            signalListeners={{
              select(_, datum) {
                model.actions.filter_by_relation(datum.x, datum.direction);
              },
            }}
          />
        </Pane>
      </Pane>
    </Pane>
  );
};

/////////////
/// TYPES ///
/////////////

type Model = {
  status: {
    [K in "schema" | "children" | "relations"]?: {
      loading?: boolean;
      error?: any;
    };
  };
  actions: {
    filter_by_label(label?: string | null): Promise<void>;
    filter_by_title(title?: string): Promise<void>;
    filter_by_relation(label?: string, direction?: string): Promise<void>;
  };
  data: {
    base_schema: Schema;
    schema?: Schema;
    children?: ChildDatum[];
    relations?: RelationDatum[];
  };
  state: { selection?: string | null; nodelabel?: string; nodetitle?: string };
};

type RelationDatum = {
  type?: string;
  x: string;
  y: number;
};

type ChildDatum = {
  x: string;
  y: number;
};
