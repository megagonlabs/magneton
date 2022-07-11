from .. import _WEB_MODULE
import idom
from varname import argname
import pandas as pd


class SummaryView:
    def __init__(self, edge_list, service=None):
        self.__data = {}
        self.set_data(edge_list)

        self.__service = service
        if service is not None:
            if type(service) is str:
                self.__service = service
            else:
                self.__service = argname("service")

        self.__widget = idom.web.export(_WEB_MODULE, "SummaryView")

    def set_data(self, edge_list):
        df = pd.DataFrame(edge_list)

        nodes = list(set(df["source"].unique()).union(set(df["target"].unique())))
        graph_json_nodes = [{"id": n} for n in nodes]
        graph_json_links = edge_list

        self.__data["graph_json_links"] = graph_json_links
        self.__data["graph_json_nodes"] = graph_json_nodes

    @idom.component
    def show(self):
        return self.__widget({"data": self.__data, "ipy_service": self.__service})
