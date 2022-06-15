from .graph_utils import GRAPH_Utils

class Profiler:
    def __init__(self, neo4j_server_url, name):
        self.graph_utils = GRAPH_Utils("bolt://{}:7687".format(neo4j_server_url))
        self.name = name
    
    def get_node_distribution(self, skip_metadata=False):
        dist = self.graph_utils.get_stat_by_node_label(skip_metadata)
        return dist