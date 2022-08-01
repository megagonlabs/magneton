import { EventEmitter } from "events";
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { v4 as uuid } from "uuid";
export interface EventData {
  target: string;
  data: Array<any>;
}

export interface LayoutContext {
  sendEvent(data: EventData): void;
}

type Message = { type: string; payload: any; id: string };

type ModelProperty<T = any> =
  | { type: "function" }
  | { type: "collection"; model: any }
  | { type: "value"; value: T }
  | { type: "native"; value: T };

export type WidgetDataModel<M extends {} = any> = {
  [K in keyof M]: ModelProperty<M[K]>;
};

export const WidgetWrapperContext = React.createContext<{
  model: WidgetDataModel;
  updateWidgetData: (key: string, value: any) => void;
  callFunc: (key: string, ...args: any) => Promise<any>;
}>({
  model: {},
  updateWidgetData() {},
  async callFunc() {},
});

export const WidgetWrapper = ({
  children,
  layoutContext,
  clientId,
  messages,
  model,
}: React.PropsWithChildren<{
  layoutContext: LayoutContext;
  clientId: string;
  messages: Message[];
  model: WidgetDataModel;
}>) => {
  // Use an EventEmitter to simulate and listen for
  // messages from the back-end
  const emitter = useRef(new EventEmitter());
  const receiver = emitter.current;

  // Helper utilities for communicating with back-end
  const sendMessage = (type: string, payload: any) =>
    layoutContext.sendEvent({
      target: "message",
      data: [type, payload, clientId],
    });

  const recvMessage = (type: string) =>
    new Promise<any>((res) => receiver.once(type, res));

  // IDOM sends messages to the component by changing the
  // lastMessage prop. This emits an event based on the
  // received message
  useEffect(() => {
    if (messages)
      messages.forEach((message) => {
        // broadcast message
        receiver.emit(message.type, message.payload);

        // send an acknowledgement that message was received
        sendMessage("message_ack", message.id);
      });
  }, [messages]);

  // Store the model parameters as state, and keep local model
  // up to date with back-end model
  const [localModel, setLocalModel] = React.useState(model);
  useEffect(() => {
    setLocalModel(model);
  }, [model]);

  // Helpers for using model
  const updateModel = (key: string, value: any) => {
    // Update local model
    setLocalModel((model) => ({
      ...model,
      [key]: { type: "native" as const, value },
    }));
    // Update model in back-end
    sendMessage("update_model", { key, value });
  };

  const callFunc = async (key: string, ...args: any[]) => {
    const returnId = uuid();

    sendMessage("call_func", { key, returnId, args });

    const [value, err] = await recvMessage(returnId);
    if (err) throw err;
    return value;
  };

  return (
    <WidgetWrapperContext.Provider
      value={{
        model: localModel,
        updateWidgetData: updateModel,
        callFunc,
      }}
    >
      {children}
    </WidgetWrapperContext.Provider>
  );
};

export function bind(node: Element, context: LayoutContext) {
  const root = ReactDOM.createRoot(node);

  return {
    create: (Component: any, props: any, children: any) => (
      <WidgetWrapper layoutContext={context} {...props.wrapperProps}>
        <Component {...props.componentProps}>{children}</Component>
      </WidgetWrapper>
    ),
    render: (element: any) => root.render(element),
    unmount: () => root.unmount(),
  };
}
