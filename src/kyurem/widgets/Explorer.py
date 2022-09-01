from asyncio import sleep
from typing import Callable, Literal, Mapping
from kyurem.widgets.HistoryView import HistoryView
from kyurem.widgets.StatefulWidgetBase import StatefulWidgetBase
from ..core.widget import WidgetModel
from ..utils.mdump import mdump


class Explorer:
    def __init__(
        self,
        fetchers: Mapping[Literal["init", "focus"], Callable],
        schema,
        component_name="Explorer",
    ):
        # Initialize base widget
        base: StatefulWidgetBase = StatefulWidgetBase(component_name)

        # Initialize state
        base.state = {"data": {"schema": schema}}

        # Initialize transient state
        # Note: transient state is not saved in history
        base.model.t_state = {"is_loading": True, "selection": []}

        # Initialize actions
        self.init = base.define_action(self.init, recorded=True)
        self.focus = base.define_action(self.focus, recorded=True)
        self.select = base.define_action(self.select)
        self.back = base.define_action(self.back)

        # Initialize internals
        self.__base = base
        self.__fetchers = fetchers

        # Initialize data
        self.init()

    async def init(self):
        model, fetchers = self.__base.model, self.__fetchers

        # Allow component to mount
        await sleep(0.1)

        # Fetch/update data
        data = fetchers["init"]()
        WidgetModel.unproxy(model.state.data).update(data)
        model.t_state.is_loading = False

    def focus(self, node, panel):
        model, fetchers = self.__base.model, self.__fetchers

        # Set interaction state
        model.state.focus_node = node
        model.state.focus_panel = panel
        model.t_state.is_loading = True
        yield  # Allow component to render

        # Fetch/update data
        data = fetchers["focus"](node, panel)
        WidgetModel.unproxy(model.state.data).update(data)
        model.t_state.is_loading = False

    def select(self, node):
        model = self.__base.model
        WidgetModel.unproxy(model.t_state.selection).append(node)

    def back(self):
        base = self.__base

        if len(base.history) > 1:
            base.pop_state()

    def debug(self, l=2):
        print(mdump(self.__base.model, l))

    def export_selection(self):
        model = self.__base.model
        print(model.t_state.selection)

    def history(self):
        return HistoryView(self.__base)

    def show(self):
        return self.__base.component()
