from ..core.widget import WidgetBase, WidgetModel


class Explorer(WidgetBase):
    def __init__(self, model=None):
        if model == None:
            model = WidgetModel.proxy({}, dotdict=True)
        super().__init__("Explorer", model=model)
        self.model = model
