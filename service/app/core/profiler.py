from .graph import Graph


class Profiler:

    def __init__(self, neo4j_server_url, user, pwd, name):
        self.graph = Graph("bolt://{}:7687".format(neo4j_server_url), user,
                           pwd)
        self.name = name

    def get_node_distribution(self, skip_metadata=False):
        dist = self.graph.get_stat_by_node_label(skip_metadata)
        dist_arr = []
        for key, value in dist.items():
            dist_arr.append({"x": key, "y": value})
        return dist_arr