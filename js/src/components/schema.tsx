import React from "react";
import { Base } from "../base";
import FDgraph from "./charts/force-directed-graph";
import { CategoricalData } from "../types/data-types";

export const Schema = ({ data }: { data: CategoricalData }) => {
  return (
    <Base>
      <FDgraph data={data} />
    </Base>
  );
};