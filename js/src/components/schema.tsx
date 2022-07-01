import React from "react";
import { Base } from "../base";
import FDgraph from "./charts/force-directed-graph";
import { Data } from "./types";

export const Schema = ({ data }: { data: Data }) => {
  return (
    <Base>
      <FDgraph data={data} />
    </Base>
  );
};