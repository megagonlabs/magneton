import { ipy_function } from "./ipy-utils";

/**
 * Delegates service calls to the IPy kernel. This allows us to define 
 * parameter and return types
 */
export class ServiceWrapper {
  constructor(private _service: string) {}

  async get_node_granularity_distribution(nodeType: string) {
    const text = await ipy_function(
      `${this._service}.get_node_granularity_distribution(node_type='${nodeType}')`
    );
    return JSON.parse(text);
  }
}
