from ..core.widget import WidgetModel
from .WidgetWithHistory import WidgetBase, WidgetWithHistory
from ..utils.mdump import mdump


class HistoryView:
    def __init__(self, target: WidgetWithHistory):

        # Initialize Model
        model = WidgetModel.dotdict()

        model.state = {}
        model.state.history = target.history
        model.state.active_index = target.active_index

        model.actions = {}
        model.actions.restore_state = self.restore_state

        # Initialize Widget
        widget = WidgetBase("Provenance", model=model)

        # Update state when target changes
        def cb():
            model.state.history = target.history
            model.state.active_index = target.active_index

        target.on_change(cb)

        # Internals
        self._model = model
        self._widget = widget
        self._target = target

    async def restore_state(self, i):
        self._target.restore_state(i)
        await self._target.flush()

    def show(self):
        return self._widget.component()
