import { CategoricalDatum } from "./types/data-types";
import { ipy_function } from "./ipy-utils";

/**
 * Delegates service calls to the IPy kernel. This allows us to define
 * parameter and return types
 */
export class ServiceWrapper {
  constructor(private _service: string) {}

  async get_node_granularity_distribution(node?: string) {
    const text = await ipy_function(
      `${this._service}.get_node_granularity_distribution(${
        JSON.stringify(node) ?? ""
      })`
    );
    return JSON.parse(text) as CategoricalDatum[];
  }

  async get_children_node_distributions(node?: string) {
    const text = await ipy_function(
      `${this._service}.get_children_node_distributions(${
        JSON.stringify(node) ?? ""
      })`
    );
    return JSON.parse(text) as CategoricalDatum[];
  }

  async get_node_degree_distributions(node: string) {
    const text = await ipy_function(
      `${this._service}.get_node_degree_distributions(${
        JSON.stringify(node) ?? ""
      })`
    );
    return JSON.parse(text) as { x: string; y: number; type: "in" | "out" }[];
  }

  async get_node_neighborhood(node: {
    node_label: string;
    node_property: string;
    node_property_value: string;
  }) {
    const text = await ipy_function(
      `${this._service}.get_node_neighborhood(${JSON.stringify(node) ?? ""})`
    );
    return JSON.parse(text) as {
      label: string;
      target: string;
      source: string;
    }[];
  }
}
