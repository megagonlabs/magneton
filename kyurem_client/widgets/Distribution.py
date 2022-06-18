from .. import _WEB_MODULE
import idom

class Distribution:

    def __init__(self, data):
        self.__data = data
        self.__widget = idom.web.export(_WEB_MODULE, "Distribution")

    @idom.component
    def show(self):
        return self.__widget({
            "data": self.__data
            })