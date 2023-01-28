import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { useObject } from "../lib/use-object";
import { horizontalBarChart, strokeHighlight } from "../components/vega-mixins";
import { LongBarChart } from "../components/long-bar-chart";
import { LoadingOverlay } from "../components/loading-overlay";
import { compareBy } from "../lib/utils";
import deepEqual from "deep-equal";

export const BarViewer = () => {
  const [error, setError] = useState<any>();
  const { actions, state, t_state } = useWidgetModel<Model>();
  const data = state.data;

  const debounce = useMemo(() => {
    let timeout: NodeJS.Timeout | null = null;
    return (cb: () => any) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(cb, 200);
    };
  }, []);

  return (
    <LoadingOverlay loading={t_state.is_loading} error={error}>
      <Pane initialHeight={400}>
        <Pane>
          {data.distribution && (
            <LongBarChart
              spec={[
                horizontalBarChart({
                  categories: { sort: null },
                  bar: {
                    mark: { fill: "steelblue" },
                    ...strokeHighlight({
                      test: "datum.highlight",
                    }),
                  },
                }),
              ]}
              data={data.distribution
                ?.map((d) => ({
                  ...d
                }))}
            />
          )}
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
    back(): Promise<void>;
  };

  state: {
    focus_panel?: string;
    data: {
      distribution?: DistDatum[];
    };
  };

  t_state: {
    is_loading?: boolean;
  };
};

type DistDatum = {
  x: string;
  y: number;
};
