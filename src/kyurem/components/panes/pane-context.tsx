import EventEmitter from "events";
import { createContext, useContext, useRef } from "react";
import TypedEventEmitter from "typed-emitter";

type PaneEventEmitter = TypedEventEmitter<{
  resizestart(): void;
  resizeend(): void;
  prebake(): void;
  bake(): void;
}>;

export const ParentPaneContext = createContext<{
  direction: "row" | "column";
  events: PaneEventEmitter;
} | null>(null);

export const useParentPaneContext = ({
  direction,
}: {
  direction: "row" | "column";
}) => {
  const contextRef = useRef({
    events: new EventEmitter() as PaneEventEmitter,
    direction: "row" as "row" | "column",
  });
  contextRef.current.direction = direction;
  return contextRef.current;
};

export const useParentPane = () => useContext(ParentPaneContext);

export const PaneSizeContext = createContext<DOMRectReadOnly | undefined>(
  undefined
);

export const usePaneSize = () => useContext(PaneSizeContext);
