import json

from ..core.widget import WidgetBase, WidgetModel


class WidgetWithHistory(WidgetBase):
    def __init__(self, component_name, model):
        super().__init__(component_name, model=model)

        self.__model = model
        if "state" not in model:
            model["state"] = {}

        self.history = []

    @property
    def state(self):
        return self.__model.state

    def push_state(self, action):
        self.history.append(
            {
                "action": action,
                "state": json.loads(
                    json.dumps(self.__model.state, default=WidgetModel.unproxy)
                ),
            }
        )

    def pop_state(self):
        assert len(self.history) > 1
        self.history.pop()
        self.__model["state"] = self.history[-1]["state"]
