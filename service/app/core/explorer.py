from .profiler import Profiler


class Explorer:

    def __init__(self, database_username, database_password):
        self.__database_username = database_username
        self.__database_password = database_password
        self.__profilers_map = {}

    def set_profile(self, database_name: str = None):
        if database_name is None or len(database_name.strip()):
            raise ValueError('"database_name" can not be None or empty.')
        elif database_name not in self.__profilers_map:
            database_uri = ''
            # TODO: get database URI by searching on AWS cluster with the name parameter
            self.__profilers_map[database_name] = Profiler(
                neo4j_server_url=database_uri,
                user=self.__database_username,
                pwd=self.__database_password,
                name=database_name)
        return self.__profilers_map[database_name]

    def get_profile(self, database_name: str = None):
        if database_name is None or len(database_name.strip()):
            raise ValueError('"database_name" can not be None or empty.')
        elif database_name in self.__profilers_map:
            self.__profilers_map[database_name]
        else:
            # profile has not been set, set profile
            return self.set_profile(database_name=database_name)

    def get_distribution(self, type, neo4j_server_url):
        kh_profiler = self.get_profile(neo4j_server_url)
        if type == "node":
            return kh_profiler.get_node_distribution()
        return None