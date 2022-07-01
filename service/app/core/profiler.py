from .graph import Graph


class Profiler:

    def __init__(self, neo4j_server_url, user, pwd, name):
        self.graph = Graph("bolt://{}:7687".format(neo4j_server_url), user,
                           pwd)
        self.name = name

    def get_node_distribution(self, skip_metadata=False):
        distribution = self.graph.get_stat_by_node_label(skip_metadata)
        distribution_list = []
        for key, value in distribution.items():
            distribution_list.append({"x": key, "y": value})
        return distribution_list

    def get_relation_distribution(self):
        distribution = self.graph.relation_count()
        distribution_list = []
        for key, value in distribution.items():
            distribution_list.append({"x": key, "y": value})
        return distribution_list

    def get_node_granularity_distributions(self, nodeType=None):
        distribution = self.graph.get_stat_by_node_granularity(nodeType)
        distribution_list = []
        for key, value in distribution.items():
            distribution_list.append({"x": key, "y": value})
        return distribution_list

    def get_kh_edge_list(self):
        return self.graph.get_graph_edge_list()
        