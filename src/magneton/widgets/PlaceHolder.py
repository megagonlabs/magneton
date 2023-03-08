from asyncio import sleep
from typing import Callable, Literal, Mapping
from ..core.widget.HistoryView import HistoryView
from ..core.widget.StateView import StateView
from ..core.widget.StatefulWidgetBase import StatefulWidgetBase
from ..core.widget import WidgetModel
from ..utils.mdump import mdump


class PlaceHolder:
    def __init__(
        self,
        component_name="PlaceHolder",
    ):
        # Initialize base widget
        base: StatefulWidgetBase = StatefulWidgetBase(component_name)

        # Initialize state
        base.state = {"data": {}}

        # Initialize transient state
        # Note: transient state is not saved in history
        base.model.t_state = {"is_loading": False}

        # Initialize actions
        ### init actions and shared actions here

        # Initialize internals
        self.__base = base

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