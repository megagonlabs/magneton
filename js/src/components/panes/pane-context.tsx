import { createContext, useContext } from "react";

export const PaneContext = createContext<{
  node: HTMLDivElement | null;
  direction: "row" | "column";
}>({ node: null, direction: "row" });
export const useParentPane = () => useContext(PaneContext);
