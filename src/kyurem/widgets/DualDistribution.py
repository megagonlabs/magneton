from ..core.widget import WidgetBase


class DualDistribution(WidgetBase):
    def __init__(self, node, granularity):
        self.__data = {"node": node, "granularity": granularity}
        super().__init__("DualDistribution", {"data": self.__data})
