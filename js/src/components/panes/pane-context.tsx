import { createContext, useContext } from "react";

export const PaneContext = createContext<{
  contentRect?: DOMRectReadOnly;
  direction: "row" | "column";
} | null>(null);
export const usePaneContext = () => useContext(PaneContext);
