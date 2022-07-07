import { CssBaseline, useForkRef } from "@mui/material";
import { Box } from "@mui/system";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import DehazeIcon from "@mui/icons-material/Dehaze";
import { PaneContext } from "./pane-context";
import { useContentRect } from "../../lib/use-content-rect";

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

  const [isDragging, setIsDragging] = useState(false);
  const [prevHeight, setPrevHeight] = useState(initialHeight);
  const [height, setHeight] = useState(initialHeight);

  useEffect(() => {
    if (!isDragging) return;

    const listener1 = (e: MouseEvent) => {
      if (!(e.buttons & 1)) return setIsDragging(false);
      if (!paneRef.current || !thumbRef.current) return;
      setHeight(
        Math.max(
          e.clientY - paneRef.current.getBoundingClientRect().top,
          minHeight
        )
      );
    };

    const listener2 = (e: MouseEvent) => {
      if (e.button === 0) return setIsDragging(false);
    };

    window.addEventListener("mousemove", listener1);
    window.addEventListener("mouseup", listener2);
    return () => {
      window.removeEventListener("mousemove", listener1);
      window.removeEventListener("mouseup", listener2);
    };
  }, [isDragging]);

  const [contentRef, contentRect] = useContentRect();

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight={isDragging ? prevHeight : minHeight}
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
        alignSelf="center"
        onMouseDown={(e) => {
          e.preventDefault();

          if (e.button === 0) {
            setIsDragging(true);
            setPrevHeight(height);
          }
        }}
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
