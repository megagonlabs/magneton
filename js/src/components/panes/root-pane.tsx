import { CssBaseline, useForkRef } from "@mui/material";
import { Box } from "@mui/system";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import DehazeIcon from "@mui/icons-material/Dehaze";
import { PaneContext } from "./pane-context";
import { useContentRect } from "../../lib/use-content-rect";
import { useDragHelper } from "../../lib/use-drag-helper";

export const RootPane = ({
  initialHeight = 400,
  minHeight = 200,
  children,
  direction = "row",
}: PropsWithChildren<{
  initialHeight?: number;
  minHeight?: number;
  direction?: "row" | "column";
}>) => {
  const paneRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [prevHeight, setPrevHeight] = useState(initialHeight);
  const [height, setHeight] = useState(initialHeight);

  const dragHelper = useDragHelper();
  useEffect(() => {
    dragHelper.events.on("dragstart", () => {
      setPrevHeight(height);
    });

    dragHelper.events.on("drag", (e) => {
      if (!paneRef.current) return;

      setHeight(
        Math.max(
          e.clientY - paneRef.current.getBoundingClientRect().top,
          minHeight
        )
      );
    });
  }, []);

  const [contentRef, contentRect] = useContentRect();

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight={dragHelper.state.isDragging ? prevHeight : minHeight}
    >
      <CssBaseline />
      <Box
        ref={useForkRef(paneRef, contentRef)}
        width="100%"
        height={height}
        border={1}
        borderColor="rgba(0,0,0,0.5)"
        borderRadius={1.5}
        boxShadow={2}
        overflow="hidden"
        display="flex"
        flexDirection={direction}
      >
        <PaneContext.Provider value={{ contentRect, direction }}>
          {children}
        </PaneContext.Provider>
      </Box>
      <Box
        ref={thumbRef}
        {...dragHelper.props}
        alignSelf="center"
        height="20px"
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ transform: "translateY(-50%)", cursor: "row-resize" }}
      >
        <Box borderRadius={1.5} bgcolor="grey" height="15px" width="32px">
          <DehazeIcon
            sx={{ color: "white", transform: "scale(2, 1) translateX(4.25px)" }}
          />
        </Box>
      </Box>
    </Box>
  );
};
