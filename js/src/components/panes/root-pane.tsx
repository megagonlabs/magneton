import { CssBaseline } from "@mui/material";
import { Box } from "@mui/system";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import DehazeIcon from "@mui/icons-material/Dehaze";

export const RootPane = ({
  initialHeight = 400,
  minHeight = 200,
  children,
}: PropsWithChildren<{ initialHeight?: number; minHeight?: number }>) => {
  const paneRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [height, setHeight] = useState(initialHeight);

  useEffect(() => {
    if (!isDragging) return;

    const listener = (e: MouseEvent) => {
      if (!(e.buttons & 1)) return setIsDragging(false);
      if (!paneRef.current || !thumbRef.current) return;
      setHeight(
        Math.max(
          e.clientY - paneRef.current.getBoundingClientRect().top,
          minHeight
        )
      );
    };
    window.addEventListener("mousemove", listener);
    return () => window.removeEventListener("mousemove", listener);
  }, [isDragging]);

  return (
    <Box display="flex" flexDirection="column">
      <CssBaseline />
      <Box
        ref={paneRef}
        width="100%"
        height={height}
        border={1}
        borderColor="rgba(0,0,0,0.5)"
        borderRadius={1.5}
        boxShadow={2}
        overflow="hidden"
      >
        {children}
      </Box>
      <Box
        ref={thumbRef}
        alignSelf="center"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
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
