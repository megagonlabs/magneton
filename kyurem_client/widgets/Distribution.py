import idom
from ..idom_loader import load_component


class Distribution:
    def __init__(self, data):
        self.__data = data
        self.__widget = load_component("Distribution")

    @idom.component
    def show(self):
        return self.__widget({"data": self.__data})
