from varname import argname
from ..core.widget import WidgetBase


class LinkedDistribution(WidgetBase):
    def __init__(self, node, service=None):
        self.__data = {"node": node}
        self.__service = service
        if service is not None:
            if type(service) is str:
                self.__service = service
            else:
                self.__service = argname("service")

        super().__init__(
            "LinkedDistribution", {"data": self.__data, "ipy_service": self.__service}
        )
