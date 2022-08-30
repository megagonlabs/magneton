from kyurem.utils.async_utils import run_coroutine
from kyurem.widgets.Explorer import Explorer


class ExplorerESE(Explorer):
    def __init__(self, actions, schema):
        super().__init__(actions, schema, component_name="ExplorerESE")