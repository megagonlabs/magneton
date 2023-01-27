import { useContext } from "react";
import { WidgetWrapperContext } from "./widget-wrapper";

export const useWidgetModel = <M extends Record<string, any> = any>() => {
  const { model, callFunc, updateModel } = useContext(WidgetWrapperContext);

  // Create a proxy to parse the model properties and make them act like regular
  // javascript objects.

  const proxify = (path: (string | number)[], value: any): any => {
    if (!value || typeof value !== "object") {
      return value;
    } else if (Array.isArray(value)) {
      return value.map((x, i) => proxify([...path, i], x));
    } else if ((value as any).__callable__) {
      return (...args: any) => callFunc(path, ...args);
    } else {
      return new Proxy(value, {
        get(target, key, receiver) {
          if (typeof key === "symbol") {
            return Reflect.get(target, key, receiver);
          } else {
            return proxify([...path, key], target[key]);
          }
        },
        set(target, key, value, receiver) {
          if (typeof key === "symbol") {
            return Reflect.set(target, key, value, receiver);
          } else {
            updateModel([...path, key], value);
            return true;
          }
        },
      });
    }
  };

  return proxify([], model) as M;
};

export const useWidgetMessages = () => {
  const { sendMessage, receiver } = useContext(WidgetWrapperContext);

  return { send: sendMessage, incoming: receiver };
};
