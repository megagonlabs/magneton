import { useForkRef } from "@mui/material";
import Box from "@mui/system/Box";
import React, { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useContentRect } from "../../lib/use-content-rect";
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

  const [dragState, setDragState] = useState({
    isDragging: false,
    initialTotalWeight: 0,
    initialWeight: 0,
  });

  useEffect(() => {
    if (!dragState.isDragging) return;

    const listener1 = (e: MouseEvent) => {
      if (!(e.buttons & 1))
        return setDragState((state) => ({ ...state, isDragging: false }));

      if (!parent?.contentRect || !paneRef.current) return;

      const paneRect = paneRef.current.getBoundingClientRect();
      const targetSize =
        parent.direction === "row"
          ? paneRect.right - e.clientX
          : paneRect.bottom - e.clientY;

      const { initialTotalWeight, initialWeight } = dragState;
      const parentSize =
        parent.contentRect[parent.direction === "row" ? "width" : "height"];
      const ratio = Math.min(Math.max(targetSize / parentSize, 0.1), 0.9);

      const newWeight =
        (ratio / (1 - ratio)) * (initialTotalWeight - initialWeight);
      setWeight(newWeight);
    };

    const listener2 = (e: MouseEvent) => {
      if (e.button === 0)
        return setDragState((state) => ({ ...state, isDragging: false }));
    };

    window.addEventListener("mousemove", listener1);
    window.addEventListener("mouseup", listener2);
    return () => {
      window.removeEventListener("mousemove", listener1);
      window.removeEventListener("mouseup", listener2);
    };
  }, [dragState.isDragging]);

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
        onMouseDown={(e) => {
          e.preventDefault();

          if (!parent?.contentRect || !paneRef.current) return;

          const dim = parent.direction === "row" ? "width" : "height";
          const totalWeight =
            (weight * parent.contentRect[dim]) /
            paneRef.current.getBoundingClientRect()[dim];

          setDragState({
            isDragging: true,
            initialTotalWeight: totalWeight,
            initialWeight: weight,
          });
        }}
      />

      <Box
        position="absolute"
        display="flex"
        flexDirection={direction}
        sx={{ width: contentRect?.width, height: contentRect?.height }}
      >
        <PaneContext.Provider value={{ contentRect, direction }}>
          {children}
        </PaneContext.Provider>
      </Box>
    </Box>
  );
};
