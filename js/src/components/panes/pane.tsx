import { useForkRef } from "@mui/material";
import Box from "@mui/system/Box";
import React, { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useContentRect } from "../../lib/use-content-rect";
import { useDragHelper } from "../../lib/use-drag-helper";
import { usePaneContext, PaneContext } from "./pane-context";

export const Pane = ({
  children,
  initialWeight = 1,
  direction = "row",
}: PropsWithChildren<{
  initialWeight?: number;
  direction?: "row" | "column";
}>) => {
  const parent = usePaneContext();

  const paneRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentRect] = useContentRect();

  const [weight, setWeight] = useState(initialWeight);

  const dragHelper = useDragHelper();

  const stateRef = useRef({ parent, weight });
  stateRef.current = { parent, weight };

  useEffect(() => {
    let parentDirection: "row" | "column";
    let parentSize: number;
    let paneRect: DOMRectReadOnly;
    let initialSize: number;
    let initialWeight: number;

    const computeWeight = (e: { clientX: number; clientY: number }) => {
      const targetSize =
        parentDirection === "row"
          ? paneRect.right - e.clientX
          : paneRect.bottom - e.clientY;
      const ratio = Math.min(Math.max(targetSize / parentSize, 0.1), 0.9);
      const totalWeight = (initialWeight * parentSize) / initialSize;

      return (ratio / (1 - ratio)) * (totalWeight - initialWeight);
    };

    dragHelper.events.on("dragstart", () => {
      const { parent, weight } = stateRef.current;
      if (!parent?.contentRect || !paneRef.current) return;
      const dim = parent.direction === "row" ? "width" : "height";

      parentDirection = parent.direction;
      parentSize = parent.contentRect[dim];
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
      ref={useForkRef(contentRef, paneRef)}
      display="flex"
      position="relative"
      flexDirection={direction}
      flexBasis={0}
      flexGrow={weight}
      className="pane"
      sx={{
        ".pane + &":
          parent?.direction === "row"
            ? {
                borderLeft: 1,
              }
            : { borderTop: 1 },
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

          ...(parent?.direction === "row"
            ? { height: "100%", width: 10, left: -5, cursor: "col-resize" }
            : { width: "100%", height: 10, top: -5, cursor: "row-resize" }),
        }}
        {...dragHelper.props}
      />

      {contentRect && (
        <Box
          position="absolute"
          display="flex"
          flexDirection={direction}
          style={{ width: contentRect.width, height: contentRect.height }}
        >
          <PaneContext.Provider value={{ contentRect, direction }}>
            {children}
          </PaneContext.Provider>
        </Box>
      )}
    </Box>
  );
};
