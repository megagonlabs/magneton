from asyncio import sleep
from typing import Callable, Literal, Mapping
from ..core.widget.HistoryView import HistoryView
from ..core.widget.StateView import StateView
from ..core.widget.StatefulWidgetBase import StatefulWidgetBase
from ..core.widget import WidgetModel
from ..utils.mdump import mdump


class LinkedViews:
    def __init__(
        self,
        fetchers: Mapping[Literal["init","select"], Callable],
        component_name="LinkedViews",
    ):
        # Initialize base widget
        base: StatefulWidgetBase = StatefulWidgetBase(component_name)

        # Initialize state
        base.state = {"data": {}}

        # Initialize transient state
        # Note: transient state is not saved in history
        base.model.t_state = {"is_loading": True}

        # Initialize actions
        self.init = base.define_action(self.init, recorded=True)
        self.select = base.define_action(self.select, recorded=True)
        
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

    def select(self, state, component):
        model, fetchers = self.__base.model, self.__fetchers

        # Set interaction state
        model.state.event_element = state
        model.state.event_component = component
        model.t_state.is_loading = True
        yield  # Allow component to render

        # Fetch/update data
        data = fetchers["select"](state, component)
        WidgetModel.unproxy(model.state.data).update(data)
        model.t_state.is_loading = False

    def debug(self, l=2):
        print(mdump(self.__base.model, l))

    def history(self):
        return HistoryView(self.__base)

    def get_state(self):
        return self.__base.state

    def view_state(self):
        return StateView(self.__base).show()

    def show(self):
        return self.__base.component()
