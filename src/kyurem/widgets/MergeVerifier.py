from kyurem.utils.async_utils import run_coroutine
from kyurem.widgets.HistoryView import HistoryView
from ..core.widget import WidgetModel
from .WidgetWithHistory import WidgetWithHistory


class MergeVerifier:
    def __init__(self, actions, mergedata, component_name="MergeVerifier"):

        # Initialize Model
        model = WidgetModel.dotdict()

        model.state = {}
        model.state.data = {}
        model.state.data.mergedata = mergedata

        model.actions = {}
        model.actions.focus = self.focus
        model.actions.back = self.back

        # Initialize Widget
        widget = WidgetWithHistory(component_name, model=model)

        # Internals
        self._model = model
        self._widget = widget
        self._actions = actions

        # Initialize Data
        run_coroutine(self.init())

    def __update_data(self, data):
        # Update data in state
        WidgetModel.dict(self.state.data).update(data)

    async def init(self):
        widget = self._widget
        state = self._widget.state
        actions = self._actions

        # Set state to loading and render
        # before fetching data
        state.is_loading = True
        await widget.flush()

        # Fetch/update data
        data = actions["init"](state)
        self.__update_data(data)

        # Render component with new data
        state.is_loading = False
        await widget.flush()

        # Record action+state for provenance
        widget.push_state(action={"name": "init"})

    async def focus(self, row, panel):
        widget = self._widget
        state = self._widget.state
        actions = self._actions

        # Update interaction state
        state.focus_row = row
        state.focus_panel = panel

        # Set state to loading and render
        # before fetching data
        state.is_loading = True
        await widget.flush()

        # Fetch/update data
        data = actions["focus"](state, row, panel)
        self.__update_data(data)

        # Render component with new data
        state.is_loading = False
        await widget.flush()

        # Record action+state for provenance
        widget.push_state(action={"name": "focus", "row": row, "panel": panel})

    async def back(self):
        widget = self._widget

        widget.state.is_loading = True
        await widget.flush()

        if len(widget.history) > 1:
            widget.pop_state()

        widget.state.is_loading = False
        await widget.flush()

    @property
    def state(self):
        # Create accessor for convenient debugging
        return self._widget.state

    def show(self):
        return self._widget.component()

    def history(self):
        return HistoryView(self._widget)
