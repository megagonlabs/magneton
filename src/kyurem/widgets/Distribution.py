from ..core.widget import WidgetBase


class Distribution(WidgetBase):
    def __init__(self, data):
        self.__data = data
        super().__init__("Distribution", {"data": self.__data})
