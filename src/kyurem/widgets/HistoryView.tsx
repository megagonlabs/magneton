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
import { ObjectExplorer } from "../components/object-explorer";

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
                <TableCell width="45%">Action</TableCell>
                <TableCell width="45%">State</TableCell>
                <TableCell width="10%" />
              </TableRow>
            </TableHead>
            <TableBody>
              {state.history?.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ObjectExplorer value={entry.action} />
                  </TableCell>
                  <TableCell>
                    <ObjectExplorer value={entry.state} />
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
