import React, { useState } from "react";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import {
  makeNodeColorScale,
  Schema,
  SchemaGraph,
} from "../components/schema-graph";
import { ContextTable } from "../components/data-table";
import { useObject } from "../lib/use-object";
import { LoadingOverlay } from "../components/loading-overlay";
import { compareBy } from "../lib/utils";
import { MergeDatum } from "../lib/types/data-types";
import {
  Box,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

export const MergeVerifier = () => {
  const [error, setError] = useState<any>();
  const { actions, state } = useWidgetModel<Model>();
  const data = state.data;

  return (
    <LoadingOverlay error={error}>
      <Pane initialHeight={300}>
        <Box height="100%" width="100%" overflow="auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Corpus Entity</TableCell>
                <TableCell>Graph Node</TableCell>
                <TableCell>Decision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.mergedata?.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Button
                      onClick={() =>
                        actions.focus(entry, "mergedata").catch(setError)
                      }
                    >
                      {entry.entity}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() =>
                        actions.focus(entry, "mergedata").catch(setError)
                      }
                    >
                      {entry.node}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={entry.decision}
                      label="decision"
                      onChange={(event: SelectChangeEvent) => {data.mergedata![i].decision = event.target.value;}}
                    > 
                      {data.decisions?.map((d, j) => (
                        <MenuItem key={j} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Pane>
      {(data.corpus || data.subgraph) && (
        <Pane direction="row">
          {data.corpus && (
            <Pane>
              <ContextTable rows={data.corpus} highlight={data.highlight} />
            </Pane>
          )}
          {data.subgraph && (
            <Pane>
              <SchemaGraph
                schema={data.subgraph}
                nodeColor={makeNodeColorScale(data.subgraph)}
                focused={state.focus_panel === "schema" && state.focus_row}
              />
            </Pane>
          )}
        </Pane>
      )}
    </LoadingOverlay>
  );
};

/////////////
/// TYPES ///
/////////////

type Model = {
  actions: {
    init(): Promise<void>;
    focus(row: MergeDatum | null, panel: string | null): Promise<void>;
    back(): Promise<void>;
  };

  state: {
    focus_row?: MergeDatum;
    focus_panel?: string;

    data: {
      mergedata?: MergeDatum[];
      corpus?: MergeDatum[] | null;
      subgraph?: Schema;
      decisions?: string[];
      highlight: any;
    };
  };
};
