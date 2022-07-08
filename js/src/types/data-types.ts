export type CategoricalDatum = { x: string; y: number };

/** @deprecated */
export type CategoricalData = CategoricalDatum[];

export type NodeData = {
  id: string;
  index: number;
  x: number;
  y: number;
  vy: number;
  vx: number;
};

export type LinkData = {
  label: string;
  source: Node;
  target: Node;
  weight: number;
  sibling_index: number;
  index: number;
};

export type GraphData = {
  node_radius: number;
  link_distance: number;
  collision_scale: number;
  link_width_scale: number;
  graph_json_links: LinkData[];
  graph_json_nodes: NodeData[];
};
