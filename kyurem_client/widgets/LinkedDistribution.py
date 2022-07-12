import idom
from varname import argname
from ..idom_loader import load_component


class LinkedDistribution:
    def __init__(self, node, service=None):
        self.__data = {"node": node}
        self.__service = service
        if service is not None:
            if type(service) is str:
                self.__service = service
            else:
                self.__service = argname("service")

        self.__widget = load_component("LinkedDistribution")

    @idom.component
    def show(self):
        return self.__widget({"data": self.__data, "ipy_service": self.__service})
