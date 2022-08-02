SERVICE_ENDPOINTS = {
    'get_node_distribution': '/distributions/node',
    'get_relation_distribution': '/distributions/relation',
    'get_node_granularity_distribution': '/granularity_distributions/{nodetype}',
    'get_children_node_distributions': '/children_distributions/{nodetype}',
    'get_edge_list': '/edge_list',
    'get_node_degree_distribution':'/degree_distributions/{nodetype}',
    'get_node_neighborhood':'/node_neighborhood',
    'get_relation_neighborhood':'/relation_neighborhood'
}
REQUEST_TIMEOUT_SECONDS = 15