import React, { PropsWithChildren } from "react";
import CSSBaseline from "@mui/material/CssBaseline";

export const Base = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div style={{ position: "relative" }}>
      <CSSBaseline />
      <div
        style={{
          boxShadow:
            "0 0 0 1px rgb(16 22 26 / 15%), 0 0 0 rgb(16 22 26 / 0%), 0 0 0 rgb(16 22 26 / 0%)",
          borderRadius: 3,
          padding: 0,
          margin: 1,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};
