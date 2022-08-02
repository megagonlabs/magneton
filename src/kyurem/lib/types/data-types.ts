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
