from .StatefulWidgetBase import StatefulWidgetBase


class StateView:
    def __init__(self, target: StatefulWidgetBase):
        # Initialize base widget
        base = StatefulWidgetBase("StateView")

        target.on_pop_state(self.__sync)
        target.on_push_state(self.__sync)

        # Register actions
        #base.define_action(self.restore_state)

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
        base.state = target.state

    def show(self):
        return self.__base.component()
