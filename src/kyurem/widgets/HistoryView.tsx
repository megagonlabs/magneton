import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import {
  CytoNodeData,
  makeNodeColorScale,
  Schema,
  SchemaGraph,
  SchemaNode,
} from "../components/schema-graph";
import { useObject } from "../lib/use-object";
import { horizontalBarChart, strokeHighlight } from "../components/vega-mixins";
import { LongBarChart } from "../components/long-bar-chart";
import { LoadingOverlay } from "../components/loading-overlay";
import { compareBy } from "../lib/data-utils";
import deepEqual from "deep-equal";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

export const HistoryView = () => {
  const [error, setError] = useState<any>();
  const { actions, state } = useWidgetModel<Model>();

  return (
    <LoadingOverlay error={error}>
      <Pane initialHeight={300}>
        <Box height="100%" width="100%" overflow="auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.history?.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <pre>{JSON.stringify(entry.action, null, 2)}</pre>
                  </TableCell>
                  <TableCell>
                    {state.active_index === i ? (
                      <Button disabled>Current</Button>
                    ) : (
                      <Button
                        onClick={() => actions.restore_state(i).catch(setError)}
                      >
                        Restore
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Pane>
    </LoadingOverlay>
  );
};

type Model = {
  actions: { restore_state: (i: number) => Promise<void> };
  state: {
    history: { action: Record<string, any>; state: Record<string, any> }[];
    active_index: number;
  };
};
