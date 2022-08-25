import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import {
  CytoNodeData,
  makeNodeColorScale,
  Schema,
  SchemaGraph,
  SchemaNode,
} from "../components/schema-graph";
import { useObject } from "../lib/use-object";
import { horizontalBarChart, strokeHighlight } from "../components/vega-mixins";
import { LongBarChart } from "../components/long-bar-chart";
import { LoadingOverlay } from "../components/loading-overlay";
import { compareBy } from "../lib/data-utils";

export const Explorer = () => {
  const [error, setError] = useState<any>();
  const { actions, state } = useWidgetModel<Model>();
  const data = state.data;

  useEffect(() => {
    if (!state.did_init) actions.init().catch(setError);
  }, []);

  const color = useMemo(
    () => makeNodeColorScale(data.schema),
    [useObject(data.schema)]
  );

  const getNodeFromDatum = useCallback(
    (datum: { x: string }) => {
      const { node_label, node_property } = state.focus_node ?? {};
      const node = {
        node_label: node_label ?? datum.x,
        node_property: node_property ?? "title",
        node_property_value: datum.x,
      };
      return node;
    },
    [useObject(state.focus_node)]
  );

  const debounce = useMemo(() => {
    let timeout: NodeJS.Timeout | null = null;
    return (cb: () => any) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(cb, 200);
    };
  }, []);

  return (
    <LoadingOverlay loading={state.is_loading} error={error}>
      <Pane initialHeight={800}>
        <Pane>
          <SchemaGraph
            schema={data.schema}
            nodeColor={color}
            subgraph={data.subgraph}
            highlight={state.focus_panel === "schema" && state.focus_node}
            onFocus={(node) => {
              if (!node) {
              } else if (node.isNode()) {
                const data = node.data() as CytoNodeData;
                actions.focus(data.schemaNode, "schema").catch(setError);
              }
            }}
            onZoom={(node) => {
              if (!node) {
                actions.back().catch(setError);
              } else if (node.isNode()) {
                const data = node.data() as CytoNodeData;
                actions.focus(data.schemaNode, null).catch(setError);
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
                      mark: { fill: color(state.focus_node?.node_label) },
                      ...strokeHighlight({
                        test: {
                          field: "x",
                          equal:
                            (state.focus_panel === "children" &&
                              state.focus_node?.node_property_value) ||
                            "",
                        },
                      }),
                    },
                  }),
                ]}
                data={data.children?.sort(compareBy((d) => -d.y))}
                signals={{
                  focus: { on: [{ events: "rect:click", update: "datum" }] },
                  zoom: { on: [{ events: "rect:dblclick", update: "datum" }] },
                }}
                signalListeners={{
                  focus: (_, datum: ChildDatum) =>
                    debounce(() =>
                      actions
                        .focus(getNodeFromDatum(datum), "children")
                        .catch(setError)
                    ),
                  zoom: (_, datum: ChildDatum) =>
                    debounce(() =>
                      actions
                        .focus(getNodeFromDatum(datum), null)
                        .catch(setError)
                    ),
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
                  .sort(
                    compareBy(
                      (d) => d.type,
                      (d) => -d.y
                    )
                  )}
                signals={{
                  select: { on: [{ events: "rect:click", update: "datum" }] },
                }}
                signalListeners={{
                  select(_, datum) {
                    // actions
                    //   .filter_by_relation(datum.x, datum.direction)
                    //   .catch(setError);
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
    init(): Promise<void>;
    focus(node: SchemaNode | null, panel: string | null): Promise<void>;
    back(): Promise<void>;
  };

  state: {
    did_init?: boolean;
    is_loading?: boolean;

    focus_node?: SchemaNode;
    focus_panel?: string;

    relation?: { type: string; direction?: string };

    data: {
      schema?: Schema;
      subgraph?: Schema;
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
