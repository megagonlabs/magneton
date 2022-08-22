from inspect import isgenerator
import json
from ..core.widget import WidgetBase, WidgetModel


class ReducerWidget(WidgetBase):
    def __init__(self, component_name, state, actions, props={}):
        model = WidgetModel.dotdict()
        model.state = state
        model.actions = {}
        for name in actions:

            def capture_name(name):
                async def dispatcher(*args, **kwargs):
                    await self.dispatch(name, *args, **kwargs)

                return dispatcher

            model.actions[name] = capture_name(name)

        super().__init__(component_name, props, model)
        self.__actions = actions
        self.model = model

        self.history = []

    async def dispatch(self, name, *args, **kwargs):

        result = self.__actions[name](self.model.state, *args, **kwargs)
        if isgenerator(result):
            for state in result:
                self.model.state = state
                await self.flush()
        else:
            self.model.state = result
            await self.flush()

        self.history.append(
            {
                "action": {"name": name, "args": args, "kwargs": kwargs},
                "state": json.loads(
                    json.dumps(self.model.state, default=WidgetModel.unproxy)
                ),
            }
        )
