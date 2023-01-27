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
  loading?: boolean;
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
          pointerEvents: loading || error ? undefined : "none",
        }}
      >
        {error ? (
          <Box
            color="white"
            minWidth={300}
            width="60%"
            borderRadius={1}
            padding={1}
            bgcolor="#100020"
            maxHeight="80%"
            display="flex"
            gap={1}
            alignItems="start"
          >
            <ErrorIcon
              fontSize="large"
              sx={{ color: (theme) => theme.palette.error.main }}
            />
            <Box fontFamily="monospace" whiteSpace="pre" overflow="auto">
              {error}
            </Box>
          </Box>
        ) : (
          <CircularProgress sx={{ color: "white" }} />
        )}
      </Box>
    </Box>
  );
};
