export type CategoricalDatum = { x: string; y: number };

/** @deprecated */
export type CategoricalData = CategoricalDatum[];

export type NodeData = {
  id: string;
};

export type LinkData = {
  label: string;
  source: string;
  target: string;
  weight: number;
};

export type ContextDatum = {
  concept: string;
  context: string;
  highlight: string;
};

export type MergeDatum = {
  decision: string;
  entity: string;
  node_label: string;
  node_uuid: string;
  node: string;
};
