from .profiler import Profiler


class Explorer:

    def __init__(self, database_username, database_password):
        self.__database_username = database_username
        self.__database_password = database_password
        self.__profilers_map = {}

    def set_profile(self, database_name: str = None, database_uri: str = None):
        if database_name is None or len(database_name.strip()) == 0:
            raise ValueError('"database_name" can not be None or empty.')
        elif database_uri is None or len(database_uri.strip()) == 0:
            raise ValueError('"database_uri" can not be None or empty.')
        elif database_name not in self.__profilers_map:
            self.__profilers_map[database_name] = Profiler(
                neo4j_server_url=database_uri,
                user=self.__database_username,
                pwd=self.__database_password,
                name=database_name)
        return self.__profilers_map[database_name]

    def get_profile(self, database_name: str = None, database_uri: str = None):
        if database_name is None or len(database_name.strip()) == 0:
            raise ValueError('"database_name" can not be None or empty.')
        elif database_name in self.__profilers_map:
            self.__profilers_map[database_name]
        elif database_uri is None or len(database_uri.strip()) == 0:
            raise ValueError('"database_uri" can not be None or empty.')
        else:
            # profile has not been set, set profile
            return self.set_profile(database_name=database_name,
                                    database_uri=database_uri)

    def has_profile(self, database_name: str = None):
        if database_name is None or len(database_name.strip()) == 0:
            raise ValueError('"database_name" can not be None or empty.')
        elif database_name not in self.__profilers_map:
            return False
        return True