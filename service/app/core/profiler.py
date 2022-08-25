from .graph import Graph


class Profiler:

    def __init__(self, neo4j_server_url, user, pwd, name):
        self.graph = Graph("bolt://{}:7687".format(neo4j_server_url), user,
                           pwd)
        self.name = name

    def get_node_distribution(self):
        distribution = self.graph.get_stat_by_node_label()
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

    def get_children_node_distributions(self, node):
        distribution, metadata = self.graph.get_children_stat_by_node_type_v1(node)
        distribution_list = []
        for key, value in distribution.items():
            distribution_list.append({"x": key, "y": value, "node": metadata[key]})
        return distribution_list

    def get_node_degree_distributions(self, nodeType):
        distribution = self.graph.get_node_degree_distributions(nodeType)
        distribution_list = []
        for key, value in distribution.items():
            distribution_list.append({"x": key, "y": value["count"], "type":value["type"]})
        return distribution_list

    def get_node_degree_distributions_v1(self, nodeType):
        distribution = self.graph.get_node_degree_distributions_v1(nodeType) 

        distribution_list = []
        for edge in distribution['in']:
            distribution_list.append({"x": edge["label"], "y": edge["count"], "type":"in"})
        for key, value in distribution['out']:
            distribution_list.append({"x": edge["label"], "y": edge["count"], "type":"out"})
        return distribution_list

    def get_kh_edge_list(self):
        return self.graph.get_graph_edge_list_v1()

    def get_node_neighborhood(self, node):
        return self.graph.get_sampled_node_neighborhood_graph_summary(node)

    def get_relation_neighborhood(self, node, relation):
        return self.graph.get_sampled_relation_neighborhood_graph_summary(node, relation)
        