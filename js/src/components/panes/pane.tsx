import Box from "@mui/system/Box";
import React, { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useDragHelper } from "../../lib/use-drag-helper";
import { useParentPane, PaneContext } from "./pane-context";

export const Pane = ({
  children,
  initialWeight = 1,
  direction = "row",
}: PropsWithChildren<{
  initialWeight?: number;
  direction?: "row" | "column";
}>) => {
  const parent = useParentPane();

  const paneRef = useRef<HTMLDivElement>(null);

  const [weight, setWeight] = useState(initialWeight);

  const dragHelper = useDragHelper();

  const stateRef = useRef({ parent, weight });
  stateRef.current = { parent, weight };
  useEffect(() => {
    let parentSize: number;
    let paneRect: DOMRectReadOnly;
    let initialSize: number;
    let initialWeight: number;

    const computeWeight = (e: { clientX: number; clientY: number }) => {
      const { parent } = stateRef.current;

      const targetSize =
        parent.direction === "row"
          ? paneRect.right - e.clientX
          : paneRect.bottom - e.clientY;
      const ratio = Math.min(Math.max(targetSize / parentSize, 0.1), 0.9);
      const totalWeight = (initialWeight * parentSize) / initialSize;

      return (ratio / (1 - ratio)) * (totalWeight - initialWeight);
    };

    dragHelper.events.on("dragstart", () => {
      const { parent, weight } = stateRef.current;

      if (!parent.node || !paneRef.current) return;
      const dim = parent.direction === "row" ? "width" : "height";

      parentSize = parent.node.getBoundingClientRect()[dim];
      paneRect = paneRef.current.getBoundingClientRect();
      initialSize = paneRect[dim];
      initialWeight = weight;
    });

    dragHelper.events.on("drag", (e) => {
      if (!paneRef.current) return;
      paneRef.current.style.flexGrow = `${computeWeight(e)}`;
    });

    dragHelper.events.on("dragend", (e) => {
      setWeight(computeWeight(e));
    });
  }, []);

  return (
    <Box
      ref={paneRef}
      position="relative"
      flexBasis={0}
      className="pane"
      sx={{
        ".pane + &":
          parent.direction === "row"
            ? {
                borderLeft: 1,
              }
            : { borderTop: 1 },
      }}
      style={{
        flexGrow: weight,
      }}
    >
      <Box
        position="absolute"
        bgcolor={"rgba(0,0,0,0.15)"}
        sx={{
          zIndex: 1,

          display: "none",
          ".pane + .pane &": { display: "block" },

          opacity: 0,
          "&:hover": { opacity: 1 },

          ...(parent.direction === "row"
            ? { height: "100%", width: 10, left: -5, cursor: "col-resize" }
            : { width: "100%", height: 10, top: -5, cursor: "row-resize" }),
        }}
        {...dragHelper.props}
      />
      <Box
        position="absolute"
        width="100%"
        height="100%"
        display="flex"
        flexDirection={direction}

        overflow="hidden"
      >
        <PaneContext.Provider value={{ node: paneRef.current, direction }}>
          {children}
        </PaneContext.Provider>
      </Box>
    </Box>
  );
};
