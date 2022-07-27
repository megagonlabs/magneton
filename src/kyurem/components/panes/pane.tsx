import Box from "@mui/system/Box";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useDragHelper } from "../../lib/use-drag-helper";
import { useParentPane, PaneContext, usePaneContext } from "./pane-context";

export const Pane = ({
  children,
  direction = "row",
}: PropsWithChildren<{
  direction?: "row" | "column";
}>) => {
  const paneRef = useRef<HTMLDivElement>(null);
  const parent = useParentPane();

  const dragHelper = useDragHelper();

  // Handle events for root panes
  const minHeight = 100;

  const [height, setHeight] = useState<number>();
  const [growHeight, setGrowHeight] = useState<number>();
  useEffect(() => {
    if (parent) return;
    let baseY: number;
    dragHelper.events.on("dragstart", (e) => {
      baseY = e.clientY - paneRef.current!.getBoundingClientRect().height;
    });

    dragHelper.events.on("drag", (e) => {
      const height = Math.max(e.clientY - baseY, minHeight);
      setGrowHeight((growHeight) => Math.max(growHeight ?? 0, height));
      setHeight(height);
    });

    dragHelper.events.on("dragend", (e) => {
      const height = Math.max(e.clientY - baseY, minHeight);
      setGrowHeight(height);
    });
  }, []);

  // Handle events for non-root panes
  useEffect(() => {
    if (!parent) return;

    // Handle events when this pane is resizing
    dragHelper.events.on("dragstart", () => {
      parent.events.emit("prebake");
      parent.events.emit("bake");

      paneRef.current!.classList.add("active");
      parent.events.emit("resizestart");
    });

    dragHelper.events.on("drag", (e) => {
      const paneRect = paneRef.current!.getBoundingClientRect();
      const basis =
        parent.direction === "row"
          ? e.clientX - paneRect.left
          : e.clientY - paneRect.top;

      paneRef.current!.style.flexBasis = `${basis}px`;
    });

    dragHelper.events.on("dragend", () => {
      parent.events.emit("prebake");
      parent.events.emit("bake");

      paneRef.current!.classList.remove("active");
      parent.events.emit("resizeend");
    });

    // Handle events just before siblings resize
    let basis: number;
    parent.events.on("prebake", () => {
      const dim = parent.direction === "row" ? "width" : "height";
      basis = paneRef.current!.getBoundingClientRect()[dim];
    });

    parent.events.on("bake", () => {
      paneRef.current!.style.flexBasis = `${basis}px`;
    });

    // Handle events when sibling panes are resizing
    parent.events.on("resizestart", () => {
      paneRef.current!.classList.add("resizing");
    });

    parent.events.on("resizeend", () => {
      paneRef.current!.classList.remove("resizing");
    });
  }, []);

  const context = usePaneContext({ direction });
  return (
    <Box
      ref={paneRef}
      position="relative"
      className="pane"
      sx={{
        // Set the height manually if the pane is a "root" pane
        // i.e., not a descendent of another pane
        height: 400,
        border: 1,
        mb: "5px",
        ".pane &": {
          height: "unset",
          border: "unset",
          mb: "unset",
        },

        ".pane + &":
          parent?.direction === "row"
            ? {
                borderLeft: 1,
              }
            : { borderTop: 1 },

        flexGrow: 1,
        flexShrink: 1,
        "&.resizing:not(.active + &)": {
          flexGrow: 0,
          flexShrink: 0,
        },
      }}
      style={{
        ...(height &&
          growHeight && {
            height,
            marginBottom: Math.max(growHeight - height, 0) + 5,
          }),
      }}
    >
      <Box
        position="absolute"
        bgcolor={"rgba(0,0,0,0.15)"}
        sx={{
          zIndex: 1,

          ".pane .pane:last-child > &": { display: "none" },

          opacity: 0,
          "&:hover": { opacity: 1 },

          ...(parent?.direction === "row"
            ? { height: "100%", width: 10, right: -5.5, cursor: "col-resize" }
            : {
                width: "100%",
                height: 10,
                bottom: -5.5,
                cursor: "row-resize",
              }),
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
        <PaneContext.Provider value={context}>{children}</PaneContext.Provider>
      </Box>
    </Box>
  );
};
