import React, { ComponentProps, useMemo, useRef } from "react";
import { Signal, Spec } from "vega";
import { VegaLite, VisualizationSpec } from "react-vega";
import { LoadingOverlay } from "./loading-overlay";
import { usePaneSize } from "./panes/pane-context";
import { MarkDef } from "vega-lite/build/src/mark";
import { PositionFieldDef } from "vega-lite/build/src/channeldef";
import { useContentRect } from "../lib/use-content-rect";
import { Box } from "@mui/system";
import { LayerSpec, UnitSpec } from "vega-lite/build/src/spec";

////////////////////
// MAIN COMPONENT //
////////////////////

export const VegaHelper = <Datum,>({
  data,
  ...props
}: Omit<
  ComponentProps<typeof VegaLite>,
  "patch" | "data" | "signalListeners" | "spec"
> & {
  spec: Partial<VisualizationSpec> | Partial<VisualizationSpec>[];
  data?: Datum[] | { loading?: boolean; error?: any; value?: Datum[] } | null;
  signals?: { [name: string]: Partial<Signal> };
  signalListeners?: { [K in string]: (name: K, value: Datum) => void };
}) => {
  const rawData = useRef<Datum[]>();
  if (data) rawData.current = Array.isArray(data) ? data : data.value;

  return (
    <LoadingOverlay
      loading={
        !data || !rawData.current || (!Array.isArray(data) && data.loading)
      }
    >
      {rawData.current && <Component data={rawData.current} {...props} />}
    </LoadingOverlay>
  );
};

const Component = ({
  data,
  spec,
  signals = {},
  ...props
}: Omit<
  ComponentProps<typeof VegaLite>,
  "data" | "spec" | "signalListeners"
> & {
  spec: Partial<VisualizationSpec> | Partial<VisualizationSpec>[];
  data: any[];
  signals?: { [name: string]: Partial<Signal> };
  signalListeners?: {
    [signalName: string]: (name: string, value: any) => void;
  };
}) => {
  const [ref, { width = 0, height = 0 } = {}] = useContentRect();

  const spec2 = useMemo(
    () => (Array.isArray(spec) ? mergeSpec(...spec) : spec),
    [spec]
  );

  return (
    <Box ref={ref} position="absolute" width="100%" height="100%">
      <VegaLite
        spec={{
          width,
          height,
          autosize: { type: "fit", contains: "padding" },
          data: { name: "data" },

          ...spec2,
        }}
        data={{ data }}
        patch={(spec) => ({
          ...spec,
          signals: [
            ...(spec.signals ?? []),
            ...Object.entries(signals).map(([name, signal]) => ({
              name,
              ...signal,
            })),
          ],
        })}
        {...(props as any)}
      />
    </Box>
  );
};

/////////////////
// MIXIN SPECS //
/////////////////

export const mergeSpec = <T extends object>(...specs: T[]): T => {
  const isObjectLiteral = (x: unknown): x is object => {
    if (!x || typeof x !== "object") return false;
    const p = Reflect.getPrototypeOf(x);
    if (!p) return false;
    return Reflect.getPrototypeOf(p) === null;
  };

  const extend = (a: Record<any, any>, b: Record<any, any>) => {
    const merged: Record<any, any> = {};

    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (Array.isArray(a[key]) && Array.isArray(b[key])) {
        merged[key] = [...a[key], ...b[key]];
      } else if (isObjectLiteral(a[key]) && isObjectLiteral(b[key])) {
        merged[key] = extend(a[key], b[key]);
      } else if (key in b) {
        merged[key] = b[key];
      } else {
        merged[key] = a[key];
      }
    }

    return merged;
  };

  return specs.reduce((prev, curr) => extend(prev, curr));
};

type PartialRecursive<T> = T extends object
  ? { [K in keyof T]+?: PartialRecursive<T[K]> }
  : T;

export const horizontalBarChart = ({
  categories,
  values,
  bar = {},
  label = {},
}: {
  categories?: PositionFieldDef<any>;
  values?: PositionFieldDef<any>;
  bar?: PartialRecursive<LayerSpec<any> | UnitSpec<any>>;
  label?: PartialRecursive<LayerSpec<any> | UnitSpec<any>>;
} = {}) =>
  ({
    encoding: {
      y: {
        field: "x",
        type: "nominal",
        axis: null,
        ...categories,
      },
    },
    layer: [
      mergeSpec(
        {
          mark: { type: "bar" },
          encoding: {
            x: {
              field: "y",
              type: "quantitative",
              title: "",
              ...values,
            },
          },
        },
        bar
      ),
      mergeSpec(
        {
          mark: {
            type: "text",
            align: "left",
            x: 5,
            fill: "black",
            clip: true,
          },
          encoding: {
            text: { field: categories?.field ?? "x" },
            detail: { aggregate: "count" },
          },
        },
        label
      ),
    ],
  } as VisualizationSpec);
