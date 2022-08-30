import React, { useState } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { LoadingOverlay } from "../components/loading-overlay";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { printObject } from "../lib/utils";

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
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {state.history?.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <pre>{JSON.stringify(entry.action, null, 2)}</pre>
                  </TableCell>
                  <TableCell>
                    <pre>{printObject(entry.state, 3)}</pre>
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
