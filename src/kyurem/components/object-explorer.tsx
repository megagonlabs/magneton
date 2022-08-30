import React, { useState } from "react";
import { Box, BoxProps } from "@mui/system";

export const ObjectExplorer = ({
  value,
  defaultDepth = 1,
}: {
  value: unknown;
  defaultDepth?: number;
}) => {
  return (
    <Box component="pre">
      <ObjectExplorer2 value={value} defaultDepth={defaultDepth} />
    </Box>
  );
};

const indent = (i: number) => "  ".repeat(i);

const Button = (props: BoxProps) => (
  <Box component="button" border={0} p={0} {...props} />
);

const ObjectExplorer2 = ({
  value,
  defaultDepth,
  depth = 1,
}: {
  value: unknown;
  defaultDepth: number;
  depth?: number;
}) => {
  const [expanded, setExpanded] = useState(defaultDepth > 0);

  return (
    <>
      {Array.isArray(value) ? (
        expanded ? (
          <>
            <Button onClick={() => setExpanded(false)}>{"▵["}</Button>
            <br />
            {value.map((value, i) => (
              <>
                {indent(depth)}
                <ObjectExplorer2
                  key={i}
                  value={value}
                  defaultDepth={defaultDepth - 1}
                  depth={depth + 1}
                />
                ,
                <br />
              </>
            ))}
            {indent(depth - 1)}
            {"]"}
          </>
        ) : (
          <Button onClick={() => setExpanded(true)}>
            [...{value.length} items]
          </Button>
        )
      ) : value && typeof value === "object" ? (
        expanded ? (
          <>
            <Button onClick={() => setExpanded(false)}>{"▵{"}</Button>
            <br />
            {Object.entries(value).map(([key, value]) => (
              <>
                {indent(depth)}
                {`"${key}": `}
                <ObjectExplorer2
                  key={key}
                  value={value}
                  defaultDepth={defaultDepth - 1}
                  depth={depth + 1}
                />
                ,
                <br />
              </>
            ))}
            {indent(depth - 1)}
            {"}"}
          </>
        ) : (
          <Button onClick={() => setExpanded(true)}>{"{ ... }"}</Button>
        )
      ) : typeof value === "string" ? (
        `"${value}"`
      ) : (
        "" + value
      )}
    </>
  );
};
