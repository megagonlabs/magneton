from magneton.widgets.StatefulWidgetBase import StatefulWidgetBase


class HistoryView:
    def __init__(self, target: StatefulWidgetBase):
        # Initialize base widget
        base = StatefulWidgetBase("HistoryView")

        # Listen/sync when history changes
        # TODO: Remove listeners when appropriate
        # to avoid possible memory leaks
        target.on_pop_state(self.__sync)
        target.on_push_state(self.__sync)

        # Register actions
        base.define_action(self.restore_state)

        # Initialize internals
        self.__base = base
        self.__target = target

        # Sync model with target
        self.__sync()

    def __sync(self):
        """
        Synchronize model with target, i.e. copy history and current index
        """
        base, target = self.__base, self.__target
        base.state.history = target.history
        base.state.active_index = target.current_index

    def restore_state(self, i: int):
        self.__target.pop_state(i)

    def show(self):
        return self.__base.component()
