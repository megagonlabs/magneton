from typing import Union
from ..core.widget import WidgetBase, WidgetData


class Explorer(WidgetBase):
    def __init__(self, model=None):
        if model == None:
            model = WidgetData.Object()
        super().__init__("Explorer", data=model)
        self.model = model
