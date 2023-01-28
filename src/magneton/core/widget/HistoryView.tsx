import React, { useState } from "react";
import { Pane } from "../../components/panes/pane";
import { useWidgetModel } from "../widget";
import { LoadingOverlay } from "../../components/loading-overlay";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { ObjectExplorer } from "../../components/object-explorer";

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
                <TableCell width="15%">Action Type</TableCell>
                <TableCell width="30%">Element</TableCell>
                <TableCell width="15%">Component</TableCell>
                <TableCell width="30%">Data</TableCell>
                <TableCell width="10%" />
              </TableRow>
            </TableHead>
            <TableBody>
              {state.history?.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ObjectExplorer value={entry.action.name} />
                  </TableCell>
                    <TableCell>
                      {entry.action.args.length > 0 ? (
                        <ObjectExplorer value={entry.state.event_element} />
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.action.args.length > 1 ? (
                        <ObjectExplorer value={entry.state.event_component} />
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <ObjectExplorer value={entry.state.data} />
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
