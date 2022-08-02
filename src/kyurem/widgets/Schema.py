import pandas as pd
from ..core.widget import WidgetBase


class Schema(WidgetBase):
    def __init__(self, edge_list):
        self.__data = {}
        self.set_data(edge_list)

        super().__init__("Schema", {"data": self.__data})

    def set_data(
        self,
        edge_list,
        node_radius=15,
        link_distance=5,
        collision_scale=10,
        link_width_scale=1,
    ):
        df = pd.DataFrame(edge_list)

        nodes = list(set(df["source"].unique()).union(set(df["target"].unique())))
        graph_json_nodes = [{"id": n} for n in nodes]
        graph_json_links = edge_list

        self.__data["node_radius"] = node_radius
        self.__data["link_distance"] = link_distance
        self.__data["collision_scale"] = collision_scale
        self.__data["link_width_scale"] = link_width_scale

        self.__data["graph_json_links"] = graph_json_links
        self.__data["graph_json_nodes"] = graph_json_nodes
