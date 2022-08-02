import React, { ComponentProps } from "react";
import { Spec } from "vega";
import { VegaLite, VisualizationSpec } from "react-vega";
import { AsyncState } from "react-use/lib/useAsyncFn";
import { LoadingOverlay } from "./loading-overlay";
import { usePaneSize } from "./panes/pane-context";

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
