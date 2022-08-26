from kyurem.utils.async_utils import run_coroutine
from ..core.widget import WidgetModel
from .WidgetWithHistory import WidgetWithHistory


class Explorer:
    def __init__(self, actions, schema):

        # Initialize Model
        model = WidgetModel.dotdict()

        model.state = {}
        model.state.data = {}
        model.state.data.schema = schema

        model.actions = {}
        model.actions.focus = self.focus
        model.actions.back = self.back

        # Initialize Widget
        widget = WidgetWithHistory("Explorer", model=model)

        # Internals
        self.__widget = widget
        self.__actions = actions

        # Initialize Data
        run_coroutine(self.init())

    def __update_data(self, data):
        # Update data in state
        WidgetModel.dict(self.state.data).update(data)

    async def init(self):
        widget = self.__widget
        state = self.__widget.state
        actions = self.__actions

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

    async def focus(self, node, panel):
        widget = self.__widget
        state = self.__widget.state
        actions = self.__actions

        # Update interaction state
        state.focus_node = node
        state.focus_panel = panel

        # Set state to loading and render
        # before fetching data
        state.is_loading = True
        await widget.flush()

        # Fetch/update data
        data = actions["focus"](state, node, panel)
        self.__update_data(data)

        # Render component with new data
        state.is_loading = False
        await widget.flush()

        # Record action+state for provenance
        widget.push_state(action={"name": "focus", "node": node, "panel": panel})

    async def back(self):
        widget = self.__widget

        widget.state.is_loading = True
        await widget.flush()

        if len(widget.history) > 1:
            widget.pop_state()

        widget.state.is_loading = False
        await widget.flush()

    @property
    def history(self):
        # Create accessor for convenient debugging
        return self.__widget.history

    @property
    def state(self):
        # Create accessor for convenient debugging
        return self.__widget.state

    def show(self):
        return self.__widget.component()
