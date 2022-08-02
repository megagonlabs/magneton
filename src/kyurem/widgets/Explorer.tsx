import React, { useEffect, useState } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { SchemaGraph } from "../components/schema-graph";
import AsyncBarChart from "../components/charts/async-bar-chart";
import * as d3 from "d3";
import { LoadingOverlay } from "../components/loading-overlay";

type AsyncState = { loading?: boolean; error?: any };

export const Explorer = () => {
  const model = useWidgetModel();
  const [schemaState, setSchemaState] = useState<AsyncState>({});
  const [childrenState, setChildrenState] = useState<AsyncState>({});
  const [relationState, setRelationState] = useState<AsyncState>({});

  useEffect(() => {
    (async () => {
      setChildrenState({ loading: true });
      setRelationState({ loading: true });
      try {
        const [children_dist, relation_dist] = await Promise.all([
          model.children_distribution(model.selected_label),
          model.relation_distribution(model.selected_label),
        ]);

        model.children_dist = children_dist;
        model.relation_dist = relation_dist;

        setChildrenState({ loading: false });
        setRelationState({ loading: false });
      } catch (e) {
        setChildrenState({ error: e });
        setRelationState({ error: e });
      }
    })();
  }, [model.selected_label]);

  useEffect(() => {
    (async () => {
      if (!model.selected_title) return;

      setSchemaState({ loading: true });
      setRelationState({ loading: true });
      try {
        const { relation_dist, schema } = await model.node_neighborhood_schema({
          node_label: model.selected_label,
          node_property: "title",
          node_property_value: model.selected_title,
        });

        console.log(schema, relation_dist);

        model.schema = schema;
        model.relation_dist = Object.entries(relation_dist).map(
          ([key, { count, type }]: any) => ({ x: key, y: count, type })
        );

        setSchemaState({ loading: false });
        setRelationState({ loading: false });
      } catch (e) {
        setSchemaState({ error: e });
        setRelationState({ error: e });
      }
    })();
  }, [model.selected_title]);

  return (
    <Pane initialHeight={800}>
      <Pane>
        <LoadingOverlay
          loading={!!schemaState.loading}
          error={schemaState.error}
        >
          {model.schema && (
            <SchemaGraph
              data={model.schema}
              onTap={async (e) => {
                model.selected_label = e.target.data("id");
                model.selected_title = "";
              }}
            />
          )}
        </LoadingOverlay>
      </Pane>
      <Pane direction="column">
        <Pane>
          <AsyncBarChart
            state={{
              loading: !!childrenState.loading,
              error: childrenState.error,
              value: model.children_dist,
            }}
            horizontal
            onClick={async (e, d) => {
              model.selected_title = d.x;
            }}
          />
        </Pane>
        <Pane>
          <AsyncBarChart
            state={{
              loading: !!relationState.loading,
              error: relationState.error,
              value: model.relation_dist
                ?.sort((a: any, b: any) => a.y - b.y)
                .sort((a: any, b: any) => a.type.localeCompare(b.type)),
            }}
            color={(d: any) => d3["schemeCategory10"][d.type === "in" ? 0 : 1]}
            horizontal
            onClick={async (e, d) => {
              model.schema = await model.relation_neighborhood_schema(
                {},
                {
                  type: d.x,
                  direction: d.type,
                }
              );
            }}
          />
        </Pane>
      </Pane>
    </Pane>
  );
};
