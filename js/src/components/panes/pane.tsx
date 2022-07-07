import Box from "@mui/system/Box";
import React, { PropsWithChildren, useState } from "react";
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

  const [ref, contentRect] = useContentRect();

  const [weight, setWeight] = useState(initialWeight);

  return (
    <Box
      ref={ref}
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
      ></Box>

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
