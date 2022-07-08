import React from "react";
import { Base } from "../base";
import FDgraph from "./charts/force-directed-graph";
import { GraphData } from "../types/data-types";

export const Schema = ({ data }: { data: GraphData }) => {
  return (
    <Base>
      <FDgraph data={data} />
    </Base>
  );
};
