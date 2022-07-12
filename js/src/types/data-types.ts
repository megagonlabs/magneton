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

export type GraphData = {
  node_radius: number;
  link_distance: number;
  collision_scale: number;
  link_width_scale: number;
  graph_json_links: LinkData[];
  graph_json_nodes: NodeData[];
};
