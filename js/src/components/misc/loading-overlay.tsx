import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { SystemCssProperties } from "@mui/system";
import React, { CSSProperties, PropsWithChildren } from "react";
import ErrorIcon from "@mui/icons-material/Error";

export const LoadingOverlay = ({
  children,
  loading,
  error,
  sx,
  style,
}: PropsWithChildren<{
  loading: boolean;
  error?: any;
  sx?: SystemCssProperties;
  style?: CSSProperties;
}>) => {
  return (
    <Box position="relative" width="100%" height="100%" sx={sx} style={style}>
      {children}
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        width="100%"
        height="100%"
        left={0}
        top={0}
        bgcolor="rgba(0,0,0,0.5)"
        sx={{
          opacity: loading || error ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
        }}
      >
        {error ? (
          <>
            <ErrorIcon
              fontSize="large"
              sx={{ color: (theme) => theme.palette.error.main }}
            />
            <pre style={{ color: "white" }}>{error}</pre>
          </>
        ) : (
          <CircularProgress sx={{ color: "white" }} />
        )}
      </Box>
    </Box>
  );
};
