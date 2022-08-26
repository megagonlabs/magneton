import json

from kyurem.utils.async_utils import run_coroutine, resolve
from ..core.widget import WidgetBase, WidgetModel


class ReducerWidget(WidgetBase):
    def __init__(self, component_name, state, actions, capture=set(), props={}):
        model = WidgetModel.dotdict()
        model.state = state
        model.actions = {}
        for name in actions:

            def capture_name(name):
                async def dispatcher(*args, **kwargs):
                    await self.__dispatch(name, *args, **kwargs)

                return dispatcher

            model.actions[name] = capture_name(name)

        super().__init__(component_name, props, model)
        self.__actions = actions
        self.__capture = capture
        self.model = model

        self.history = []

    def dispatch(self, name, *args, **kwargs):
        run_coroutine(self.__dispatch(name, *args, **kwargs))

    async def __dispatch(self, name, *args, **kwargs):
        # Execute specified action
        result = self.__actions[name](self.model.state, *args, **kwargs)

        # Await if result is a coroutine
        await resolve(result)

        # Record action if specified in capture
        if name in self.__capture:
            self.push_state({"name": name, "args": args, "kwargs": kwargs})

    def push_state(self, action=None):
        self.history.append(
            {
                "action": action,
                "state": json.loads(
                    json.dumps(self.model.state, default=WidgetModel.unproxy)
                ),
            }
        )
