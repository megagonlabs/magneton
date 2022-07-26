import {useContext} from "react";
import { WidgetWrapperContext } from "./widget-wrapper";


export const useWidgetModel = <M extends {} = any>() => {
  const { model, callFunc, updateModel } = useContext(WidgetWrapperContext);

  // Create a proxy to parse the model properties and make them act like regular
  // javascript objects.
  return new Proxy(model, {
    get(target, key, receiver) {
      if (typeof key === "symbol") {
        return Reflect.get(target, key, receiver);
      } else {
        const property = target[key];
        if (!property) {
          return undefined;
        }

        if (property.type === "value" || property.type === "native") {
          return property.value;
        } else if (property.type === "function") {
          return (...args: any) => callFunc(key, ...args);
        } else {
          throw new Error("Unknown property type encountered");
        }
      }
    },
    set(target, key, value, receiver) {
      if (typeof key === "symbol") {
        return Reflect.set(target, key, value, receiver);
      } else {
        updateModel(key, value);
        return true;
      }
    },
  }) as M;
};
