import React, { useMemo } from "react";
import { GraphData } from "../types/data-types";
import { RootPane } from "./panes/root-pane";
import CytoscapeComponent from "react-cytoscapejs";

export const Schema = ({ data }: { data: GraphData }) => {
  const elements = useMemo(
    () => [
      ...data.graph_json_nodes.map(({ id }) => ({
        data: { id, label: id },
      })),
      ...data.graph_json_links.map(({ label, source, target }) => ({
        data: { label, source, target },
      })),
    ],
    [data]
  );

  return (
    <RootPane>
      <CytoscapeComponent
        elements={elements}
        style={{ width: "100%", height: "100%" }}
        layout={{ name: "circle" }}
      />
    </RootPane>
  );
};
