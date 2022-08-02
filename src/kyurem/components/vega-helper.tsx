import React, { ComponentProps } from "react";
import { Spec } from "vega";
import { VegaLite, VisualizationSpec } from "react-vega";
import { AsyncState } from "react-use/lib/useAsyncFn";
import { LoadingOverlay } from "./loading-overlay";
import { usePaneSize } from "./panes/pane-context";
import { AnyMark, BarConfig } from "vega-lite/build/src/mark";

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
  spec: Partial<VisualizationSpec>;
  data: Datum[] | AsyncState<Datum[]>;
  signals?: Spec["signals"];
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
  signals = [],
  ...props
}: Omit<
  ComponentProps<typeof VegaLite>,
  "data" | "spec" | "signalListeners"
> & {
  spec: Partial<VisualizationSpec>;
  data: any[];
  signals?: Spec["signals"];
  signalListeners?: {
    [signalName: string]: (name: string, value: any) => void;
  };
}) => {
  const { width, height } = usePaneSize() ?? {};
  if (width === 0 || height === 0) return <></>;

  return (
    <VegaLite
      spec={{
        width,
        height,
        autosize: { type: "fit", contains: "padding" },
        data: { name: "data" },

        ...spec,
      }}
      data={{ data }}
      patch={(spec) => ({
        ...spec,
        signals: [...(spec.signals ?? []), ...signals],
      })}
      {...(props as any)}
    />
  );
};

/////////////////
// MIXIN SPECS //
/////////////////

export const mergeSpec = (...specs: Partial<VisualizationSpec>[]) => {
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
  fields,
  marks: { bar = (x) => x, label = (x) => x } = {},
}: {
  fields: { category: string; value: string };
  marks?: {
    bar?(markSpec: AnyMark): AnyMark;
    label?(markSpec: AnyMark): AnyMark;
  };
}) =>
  ({
    encoding: {
      y: {
        field: fields.category,
        type: "nominal",
        axis: null,
      },
    },
    layer: [
      {
        mark: bar({ type: "bar", color: "#ddd" }),
        encoding: {
          x: {
            field: fields.value,
            type: "quantitative",
            title: "",
          },
        },
      },
      {
        mark: label({ type: "text", align: "left", x: 5 }),
        encoding: {
          text: { field: fields.category },
          detail: { aggregate: "count" },
        },
      },
    ],
  } as VisualizationSpec);
