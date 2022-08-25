from ..core.widget import WidgetModel
from .ReducerWidget import ReducerWidget
import json


class Explorer:
    def __init__(self, actions, schema):
        def init(state):
            state.is_loading = True
            state.did_init = True
            yield state

            data = actions["init"](state)
            WidgetModel.dict(state.data).update(data)
            state.is_loading = False
            yield state

        def focus(state, node, panel):
            state.focus_node = node
            state.focus_panel = panel
            state.is_loading = True
            yield state

            data = actions["focus"](state, node, panel)
            WidgetModel.dict(state.data).update(data)
            state.is_loading = False
            yield state

        def back(state):
            state.is_loading = True
            yield state

            if len(self.history) > 1:
                self.history.pop()

            state = self.history[-1]["state"]
            yield state

            state["is_loading"] = False
            yield state

        self.__widget = ReducerWidget(
            "Explorer",
            {"did_init": False, "data": {"schema": schema}},
            {"init": init, "focus": focus, "back": back},
            capture={"init", "focus"},
        )

    @property
    def history(self):
        return self.__widget.history

    @property
    def dispatch(self):
        return self.__widget.dispatch_sync

    @property
    def state(self):
        return self.__widget.model.state

    def show(self):
        return self.__widget.component()
