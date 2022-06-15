from . import _WEB_MODULE
import idom
from .profiler import Profiler

class Widget:

    def __init__(self, neo4j_server_url, name):
        self.__profiler = Profiler(neo4j_server_url, name)
        self.__data = self.__profiler.get_node_distribution()
        #self.__data = [{"x": "A", "y": 100}, {"x": "B", "y": 78}, {"x": "C", "y": 120}]
        self.__widget = idom.web.export(_WEB_MODULE, "Widget")

    @idom.component
    def show(self):
        return self.__widget({
            "data": self.__data
            })