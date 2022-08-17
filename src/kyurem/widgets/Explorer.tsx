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
import { horizontalBarChart, strokeHighlight } from "../components/vega-mixins";
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
              highlightLabel={model.state.nodelabel}
              onSelect={(node) => {
                if (!node) {
                  model.actions.filter_by_label(null);
                } else if (node?.isNode()) {
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
                  ...strokeHighlight({
                    test: {
                      field: "x",
                      equal: model.state.nodetitle ?? false,
                    },
                  }),
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
                bar: strokeHighlight({
                  test: {
                    field: "x",
                    equal: model.state.relation?.type ?? "",
                  },
                }),
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
  state: {
    nodelabel?: string;
    nodetitle?: string;
    relation?: { type: string; direction?: string };
  };
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
