import { VisualizationSpec } from "react-vega";
import { PositionFieldDef } from "vega-lite/build/src/channeldef";
import { Predicate } from "vega-lite/build/src/predicate";
import { LayerSpec, UnitSpec } from "vega-lite/build/src/spec";

/////////////////
// MIXIN SPECS //
/////////////////

export const extend = <T extends object>(...specs: T[]): T => {
  const isObjectLiteral = (x: unknown): x is object => {
    if (!x || typeof x !== "object") return false;
    const p = Reflect.getPrototypeOf(x);
    if (!p) return false;
    return Reflect.getPrototypeOf(p) === null;
  };

  const extend2 = (a: Record<any, any>, b: Record<any, any>) => {
    const merged: Record<any, any> = {};

    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (Array.isArray(a[key]) && Array.isArray(b[key])) {
        merged[key] = [...a[key], ...b[key]];
      } else if (isObjectLiteral(a[key]) && isObjectLiteral(b[key])) {
        merged[key] = extend2(a[key], b[key]);
      } else if (key in b) {
        merged[key] = b[key];
      } else {
        merged[key] = a[key];
      }
    }

    return merged;
  };

  return specs.reduce((prev, curr) => extend2(prev, curr));
};
type PartialRecursive<T> = T extends object
  ? {
      [K in keyof T]+?: PartialRecursive<T[K]>;
    }
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
      extend(
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
      extend(
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

export const strokeHighlight = ({ test }: { test: Predicate }) => ({
  encoding: {
    stroke: {
      condition: [
        {
          value: "red",
          test,
        },
      ],
      value: null,
    },
    strokeWidth: {
      condition: [
        {
          value: 3,
          test,
        },
      ],
      value: 0,
    },
  },
});
