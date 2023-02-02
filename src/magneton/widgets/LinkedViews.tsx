import React, { useCallback, useEffect, useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Box,
  Button,
} from "@mui/material";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { useObject } from "../lib/use-object";
import { horizontalBarChart, strokeHighlight } from "../components/vega-mixins";
import { LongBarChart } from "../components/long-bar-chart";
import { LoadingOverlay } from "../components/loading-overlay";
import { compareBy } from "../lib/utils";
import deepEqual from "deep-equal";

export const LinkedViews = () => {
  const [error, setError] = useState<any>();
  const { actions, state, t_state } = useWidgetModel<Model>();
  const data = state.data;

  console.log(data);
  const debounce = useMemo(() => {
    let timeout: NodeJS.Timeout | null = null;
    return (cb: () => any) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(cb, 200);
    };
  }, []);

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14
    }
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover
    },
    // hide last border
    "&:last-child td, &:last-child th": {
      border: 0
    }
  }));

  return (
    <LoadingOverlay loading={t_state.is_loading} error={error}>
      <Pane initialHeight={400}>
        <Pane direction="row">
          <Pane>
            <TableContainer
              sx={{
                height: 400    
              }}
            >
              <Table sx={{ height: "max-content" }} aria-label="customized table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>State</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.table && data.table.map((row, i) => (

                    <StyledTableRow key={i}>
                      <StyledTableCell>
                        {state.data.index === i ? (
                          <Button disabled>{row}</Button>
                        ) : (
                          <Button
                            onClick={() => actions.select(row,"table").catch(setError)}
                          >
                            {row}
                          </Button>
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Pane>
          <Pane>
            {data.distribution && (
              <LongBarChart
                spec={[
                  horizontalBarChart({
                    categories: { sort: null },
                    bar: {
                      mark: { fill: "steelblue" },
                      ...strokeHighlight({
                        test: "datum.highlight",
                      }),
                    },
                  }),
                ]}
                data={data.distribution
                  ?.map((d) => ({
                    ...d
                  }))}
              />
            )}
          </Pane>
        </Pane>
      </Pane>
    </LoadingOverlay>
  );
};

/////////////
/// TYPES ///
/////////////

type Model = {
  actions: {
    init(): Promise<void>;
    select: (state: string | null, component: string | null) => Promise<void>;
  };

  state: {
    event_element?: string;
    event_component?: string;
    data: {
      table?: string[];
      index?: number;
      distribution?: DistDatum[];
    };
  };

  t_state: {
    is_loading?: boolean;
  };
};

type DistDatum = {
  x: string;
  y: number;
};
