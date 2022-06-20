from .profiler import Profiler

class Explorer:

    def __init__(self, username, pwd):
        self.__user = username
        self.__password = pwd
        self.__profiler_dict = {}

    def set_profile(self, neo4j_server_url, name):
        if neo4j_server_url not in self.__profiler_dict:
            self.__profiler_dict[neo4j_server_url] = Profiler(neo4j_server_url, self.__user, self.__password, name)
        else:
            print("Profile already exists!!!")

    def get_profile(self, neo4j_server_url):
        if neo4j_server_url in self.__profiler_dict:
            return self.__profiler_dict[neo4j_server_url]
        else:
            print("Profile does not exist!!!")

    def get_distribution(self, _type, neo4j_server_url):
        kh_profiler = self.get_profile(neo4j_server_url)
        if _type == "node":
            return kh_profiler.get_node_distribution()
        return None