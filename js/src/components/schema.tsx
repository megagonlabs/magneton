import React from "react";
import { Base } from "../base";
import FDgraph from "./charts/force-directed-graph";
import { CategoricalDatum } from "../types/data-types";

export const Schema = ({ data }: { data: CategoricalDatum[] }) => {
  return (
    <Base>
      <FDgraph data={data} />
    </Base>
  );
};
