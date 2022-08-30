from collections import defaultdict
import json
from kyurem.utils.deepcopy import deepcopy

from kyurem.utils.emitter import Emitter

from ..core.widget import WidgetBase, WidgetModel


class WidgetWithHistory(WidgetBase):
    def __init__(self, component_name, model):
        super().__init__(component_name, model=model)

        self._model = model
        if "state" not in model:
            model["state"] = {}

        self.history = []
        self.active_index = 0

        self._emitter = Emitter()

    def on_change(self, cb):
        self._emitter.on("change", cb)

    @property
    def state(self):
        return self._model.state

    def push_state(self, action):
        # Truncate history to active state index
        self.history = self.history[: self.active_index + 1]

        # Append
        self.history.append(
            {
                "action": action,
                "state": deepcopy(self._model.state, replacer=WidgetModel.unproxy),
            }
        )

        # Update active state index
        self.active_index = len(self.history) - 1

        # Notify listeners
        self._emitter.emit("change")

    def pop_state(self):
        assert len(self.history) > 1
        self.restore_state(self.active_index - 1)

    def restore_state(self, i):
        # Copy state from history
        self._model["state"] = deepcopy(
            self.history[i]["state"], replacer=WidgetModel.unproxy
        )
        self.active_index = i

        # Notify listeners
        self._emitter.emit("change")
