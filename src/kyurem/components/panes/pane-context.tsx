import EventEmitter from "events";
import { createContext, useContext, useRef } from "react";
import TypedEventEmitter from "typed-emitter";

type PaneEventEmitter = TypedEventEmitter<{
  resizestart(): void;
  resizeend(): void;
  prebake(): void;
  bake(): void;
}>;

export const PaneContext = createContext({
  direction: "row" as "row" | "column",
  events: new EventEmitter() as PaneEventEmitter,
});

export const usePaneContext = ({
  direction,
}: {
  direction: "row" | "column";
}) => {
  const contextRef = useRef({
    direction: "row" as "row" | "column",
    events: new EventEmitter() as PaneEventEmitter,
  });
  contextRef.current.direction = direction;

  return contextRef.current;
};

export const useParentPane = () => useContext(PaneContext);
