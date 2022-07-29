from typing import Union
from ..core.widget import WidgetBase, WidgetModel


class Explorer(WidgetBase):
    def __init__(self, model: Union[WidgetModel, None] = None):
        if model == None:
            model = WidgetModel.make_model()
        super().__init__("Explorer", model=model)
        self.model = model

