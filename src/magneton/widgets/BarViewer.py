from asyncio import sleep
from typing import Callable, Literal, Mapping
from ..core.widget.HistoryView import HistoryView
from ..core.widget.StatefulWidgetBase import StatefulWidgetBase
from ..core.widget import WidgetModel
from ..utils.mdump import mdump


class BarViewer:
    def __init__(
        self,
        fetchers: Mapping[Literal["init"], Callable],
        component_name="BarViewer",
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

    def back(self):
        base = self.__base

        if len(base.history) > 1:
            base.pop_state()

    def debug(self, l=2):
        print(mdump(self.__base.model, l))

    def history(self):
        return HistoryView(self.__base)

    def show(self):
        return self.__base.component()
