import { CategoricalDatum } from "../types/data-types";
import { ipy_function } from "./ipy-utils";

/**
 * Delegates service calls to the IPy kernel. This allows us to define
 * parameter and return types
 */
export class ServiceWrapper {
  constructor(private _service: string) {}

  async get_node_granularity_distribution(nodeType?: string) {
    const text = await ipy_function(
      `${this._service}.get_node_granularity_distribution(${
        nodeType ? `node_type='${nodeType}'` : ""
      })`
    );
    return JSON.parse(text) as CategoricalDatum[];
  }

  async get_children_node_distributions(nodeType?: string) {
    const text = await ipy_function(
      `${this._service}.get_children_node_distributions(${
        nodeType ? `node_type='${nodeType}'` : ""
      })`
    );
    return JSON.parse(text) as CategoricalDatum[];
  }
}
