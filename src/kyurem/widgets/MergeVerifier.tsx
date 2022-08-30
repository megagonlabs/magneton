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
import { MergeDatum } from "../lib/types/data-types";
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
                        onClick={() => actions.focus(entry, "mergedata").catch(setError)}
                      >
                        {entry.entity}
                      </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                        onClick={() => actions.focus(entry, "mergedata").catch(setError)}
                      >
                        {entry.node}
                      </Button>
                  </TableCell>
                  <TableCell>Accept/Reject/Defer</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Pane>
      {data.corpus && (
        <Pane>
          <ContextTable rows={data.corpus} highlight={data.highlight}/>
        </Pane>
      )}
      {data.subgraph && (
        <Pane>
          <SchemaGraph
            nodeColor={color}
            subgraph={data.subgraph}
            highlight={state.focus_panel === "schema" && state.focus_row}
          />
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
    did_init?: boolean;
    is_loading?: boolean;

    focus_row?: MergeDatum;
    focus_panel?: string;

    data: {
      mergedata?: MergeDatum[];
      corpus?:MergeDatum[];
      subgraph?: Schema;
    };
  };
};
