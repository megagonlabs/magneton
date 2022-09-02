from asyncio import sleep
from typing import Callable, Literal, Mapping
from kyurem.widgets.HistoryView import HistoryView
from kyurem.widgets.StatefulWidgetBase import StatefulWidgetBase
from ..core.widget import WidgetModel
from ..utils.mdump import mdump



class MergeVerifier:
    def __init__(
        self, 
        fetchers: Mapping[Literal["init", "focus"], Callable], 
        mergedata, 
        decision_list,
        component_name="MergeVerifier"
    ):
        # Initialize base widget
        base: StatefulWidgetBase = StatefulWidgetBase(component_name)

        # Initialize state
        base.state = {"data": {
                                "mergedata": mergedata, 
                                "decision_list": decision_list
                                }}

        # Initialize actions
        self.init = base.define_action(self.init, recorded=True)
        self.focus = base.define_action(self.focus, recorded=True)
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

    def focus(self, row, panel):
        model, fetchers = self.__base.model, self.__fetchers

        # Set interaction state
        model.state.focus_row = row
        model.state.focus_panel = panel
        yield  # Allow component to render

        # Fetch/update data
        data = fetchers["focus"](row, panel)
        WidgetModel.unproxy(model.state.data).update(data)

    def back(self):
        base = self.__base

        if len(base.history) > 1:
            base.pop_state()

    def debug(self, l=2):
        print(mdump(self.__base.model, l))

    def export_decisions(self):
        model = self.__base.model
        return WidgetModel.unproxy(model.state.data.mergedata)

    def history(self):
        return HistoryView(self.__base)

    def show(self):
        return self.__base.component()
