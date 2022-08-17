import React, { ComponentProps, useMemo } from "react";
import { Signal, Spec } from "vega";
import { VegaLite, VisualizationSpec } from "react-vega";
import { LoadingOverlay } from "./loading-overlay";
import { usePaneSize } from "./panes/pane-context";
import { MarkDef } from "vega-lite/build/src/mark";
import { PositionFieldDef } from "vega-lite/build/src/channeldef";

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
  data: Datum[] | { loading?: boolean; error?: any; value?: Datum[] };
  signals?: { [name: string]: Partial<Signal> };
  signalListeners?: { [K in string]: (name: K, value: Datum) => void };
}) =>
  Array.isArray(data) ? (
    <Component data={data} {...props} />
  ) : (
    <LoadingOverlay loading={data.loading} error={data.error}>
      {data.value && <Component data={data.value} {...props} />}
    </LoadingOverlay>
  );

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
  const { width, height } = usePaneSize() ?? {};
  if (width === 0 || height === 0) return <></>;

  const spec2 = useMemo(
    () => (Array.isArray(spec) ? mergeSpec(...spec) : spec),
    [spec]
  );

  return (
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

export const horizontalBarChart = ({
  categories,
  values,
  bar,
  label,
}: {
  categories?: PositionFieldDef<any>;
  values?: PositionFieldDef<any>;
  bar?: Partial<MarkDef<"bar">>;
  label?: Partial<MarkDef<"text">>;
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
      {
        mark: { type: "bar", ...bar },
        encoding: {
          x: {
            field: "y",
            type: "quantitative",
            title: "",
            ...values,
          },
        },
      },
      {
        mark: {
          type: "text",
          align: "left",
          x: 5,
          fill: "black",
          ...label,
        },
        encoding: {
          text: { field: categories?.field ?? "x" },
          detail: { aggregate: "count" },
        },
      },
    ],
  } as VisualizationSpec);
