import idom
from ..idom_loader import load_component

class DualDistribution:

    def __init__(self, node, granularity):
        self.__data = {'node': node, 'granularity': granularity} 
        self.__widget = load_component("DualDistribution")

    @idom.component
    def show(self):
        return self.__widget({
            "data": self.__data
            })