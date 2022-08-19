import React, { useMemo, useState } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import {
  makeNodeColorScale,
  Schema,
  SchemaGraph,
} from "../components/schema-graph";
import { useObject } from "../lib/use-object";
import { horizontalBarChart, strokeHighlight } from "../components/vega-mixins";
import { LongBarChart } from "../components/long-bar-chart";
import { LoadingOverlay } from "../components/loading-overlay";

export const Explorer = () => {
  const [error, setError] = useState<any>();
  const { actions, state } = useWidgetModel<Model>();
  const data = state.data;

  const baseSchema = useObject(state.base_schema);
  const nodeColorScale = useMemo(
    () => makeNodeColorScale(baseSchema),
    [baseSchema]
  );

  return (
    <LoadingOverlay loading={state.is_loading} error={error}>
      <Pane initialHeight={800}>
        <Pane>
          <SchemaGraph
            baseSchema={baseSchema}
            nodeColorScale={nodeColorScale}
            schema={data.schema}
            highlightLabel={state.nodelabel}
            onSelect={(node) => {
              if (!node) {
                actions.filter_by_label(null).catch(setError);
              } else if (node?.isNode()) {
                actions.filter_by_label(node.data("label")).catch(setError);
              }
            }}
          />
        </Pane>
        <Pane direction="column">
          <Pane>
            {data.children && (
              <LongBarChart
                spec={[
                  horizontalBarChart({
                    categories: { sort: null },
                    bar: {
                      mark: {
                        fill: state.nodelabel
                          ? nodeColorScale(state.nodelabel)
                          : undefined,
                      },
                      ...strokeHighlight({
                        test: {
                          field: "x",
                          equal: state.nodetitle ?? false,
                        },
                      }),
                    },
                  }),
                ]}
                data={data.children?.sort((a, b) => b.y - a.y)}
                signals={{
                  select: {
                    on: [{ events: "rect:click", update: "datum" }],
                  },
                }}
                signalListeners={{
                  select(_, datum: ChildDatum) {
                    actions.filter_by_title(datum.x).catch(setError);
                  },
                }}
              />
            )}
          </Pane>
          <Pane>
            {data.relations && (
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
                        equal: state.relation?.type ?? "",
                      },
                    }),
                  }),
                ]}
                data={data.relations
                  ?.map((r) => ({
                    direction: r.type,
                    type: "in/out",
                    label: `${r.x}${r.type ? ` (${r.type})` : ""}`,
                    ...r,
                  }))
                  .sort((a, b) => a.type.localeCompare(b.type) || b.y - a.y)}
                signals={{
                  select: { on: [{ events: "rect:click", update: "datum" }] },
                }}
                signalListeners={{
                  select(_, datum) {
                    actions
                      .filter_by_relation(datum.x, datum.direction)
                      .catch(setError);
                  },
                }}
              />
            )}
          </Pane>
        </Pane>
      </Pane>
    </LoadingOverlay>
  );
};

/////////////
/// TYPES ///
/////////////

type Model = {
  actions: {
    filter_by_label(label?: string | null): Promise<void>;
    filter_by_title(title?: string): Promise<void>;
    filter_by_relation(label?: string, direction?: string): Promise<void>;
  };

  state: {
    is_loading?: boolean;

    base_schema: Schema;

    nodelabel?: string;
    nodetitle?: string;
    relation?: { type: string; direction?: string };

    data: {
      schema?: Schema;
      children?: ChildDatum[];
      relations?: RelationDatum[];
    };
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
