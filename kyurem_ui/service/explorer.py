from .profiler import Profiler

class Explorer:

    def __init__(self, neo4j_server_url, name):
        self.__profiler = Profiler(neo4j_server_url, name)

    def get_distribution(self, _type):
    	if _type == "node":
    		return self.__profiler.get_node_distribution()
    	return None
