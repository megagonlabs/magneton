from ..core.widget import WidgetModel
from .ReducerWidget import ReducerWidget


class Explorer:
    def __init__(self, actions, schema):
        async def init(state):
            state.is_loading = True
            state.did_init = True
            await widget.flush()

            data = actions["init"](state)
            WidgetModel.dict(state.data).update(data)
            state.is_loading = False
            await widget.flush()

        async def focus(state, node, panel):
            state.focus_node = node
            state.focus_panel = panel
            state.is_loading = True
            await widget.flush()

            data = actions["focus"](state, node, panel)
            WidgetModel.dict(state.data).update(data)
            state.is_loading = False
            await widget.flush()

        async def back(state):
            state.is_loading = True
            await widget.flush()

            if len(self.history) > 1:
                self.history.pop()
                state = self.history[-1]["state"]

            state["is_loading"] = False
            await widget.flush()

        widget = ReducerWidget(
            "Explorer",
            {"did_init": False, "data": {"schema": schema}},
            {"init": init, "focus": focus, "back": back},
            capture={"init", "focus"},
        )

        # Run init function
        widget.dispatch("init")

        # Internals
        self.__widget = widget

    @property
    def history(self):
        return self.__widget.history

    @property
    def dispatch(self):
        return self.__widget.__dispatch

    @property
    def state(self):
        return self.__widget.model.state

    def show(self):
        return self.__widget.component()
