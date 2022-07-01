from .. import _WEB_MODULE
import idom

class DualDistribution:

    def __init__(self, node, granularity):
        self.__data = {'node': node, 'granularity': granularity} 
        self.__widget = idom.web.export(_WEB_MODULE, "DualDistribution")

    @idom.component
    def show(self):
        return self.__widget({
            "data": self.__data
            })