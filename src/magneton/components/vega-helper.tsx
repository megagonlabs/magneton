import React, { ComponentProps, useMemo, useRef } from "react";
import { Signal, Spec } from "vega";
import { VegaLite, VisualizationSpec } from "react-vega";
import { LoadingOverlay } from "./loading-overlay";
import { usePaneSize } from "./panes/pane-context";
import { MarkDef } from "vega-lite/build/src/mark";
import { useContentRect } from "../lib/use-content-rect";
import { Box } from "@mui/system";
import { extend } from "./vega-mixins";

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
    () => (Array.isArray(spec) ? extend(...spec) : spec),
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


