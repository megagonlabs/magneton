from asyncio import get_running_loop, iscoroutinefunction
from inspect import isgenerator
from typing import (
    Callable,
    Coroutine,
    Generator,
    Generic,
    List,
    Literal,
    Mapping,
    TypeVar,
    Union,
)


from ..core.widget import WidgetModel, WidgetBase
from ..utils.emitter import Emitter
from ..utils.deepcopy import deepcopy


State = TypeVar("State", bound=Mapping)
Actions = TypeVar("Actions", bound=Mapping[str, Callable])


class StatefulWidgetBase(WidgetBase, Generic[State, Actions]):
    def __init__(self, component_name: str, props: Mapping = {}, model: Mapping = None):
        # Initialize model
        model = WidgetModel.dotdict(model)
        if "actions" not in model:
            model.actions = {}
        if "state" not in model:
            model.state = {}

        # Initialize widget
        super().__init__(component_name, props, model)

        # Initialize internals
        self.model = model
        self.history: List[State] = []
        self.__current_index = 0
        self.__emitter: Emitter[Literal["pop_state", "push_state"]] = Emitter()

    def define_action(
        self,
        action: Callable[
            ...,
            Union[None, Generator, Coroutine],
        ],
        name: str = None,
        recorded: bool = False,
    ):
        if name is None:
            name = action.__name__

        async def wrapper(*args, **kwargs):
            retval = action(*args, **kwargs)

            if iscoroutinefunction(action):
                retval = await retval

            if isgenerator(retval):
                # Wait for component to render every time the generator yields
                for _ in retval:
                    await self.flush()

            # Render any state changes
            self.flush()

            if recorded:
                # Add state to history if this is a recorded action
                self.push_state(action={"name": name, "args": args, "kwargs": kwargs})

        self.actions[name] = wrapper

        def as_task(*args, **kwargs):
            loop = get_running_loop()
            return loop.create_task(wrapper(*args, **kwargs))

        return as_task

    @property
    def state(self) -> State:
        return self.model.state

    @state.setter
    def state(self, value):
        self.model.state = value

    @property
    def actions(self) -> Actions:
        return self.model.actions

    @property
    def current_index(self):
        return self.__current_index

    def push_state(self, **kwargs):
        # Truncate history to active state index
        self.history = self.history[: self.__current_index + 1]

        # Append
        self.history.append(
            {
                **kwargs,
                "state": deepcopy(self.state, replacer=WidgetModel.unproxy),
            }
        )

        # Update active state index
        self.__current_index = len(self.history) - 1

        # Notify listeners
        self.__emitter.emit("push_state")

    def pop_state(self, i: int = None):
        # If index is not specified, decrement
        if i is None:
            i = self.__current_index - 1

        # Copy state from history
        self.state = deepcopy(self.history[i]["state"], replacer=WidgetModel.unproxy)
        self.__current_index = i

        # Notify listeners
        self.__emitter.emit("pop_state")

    def on_push_state(
        self,
        listener: Callable[[], None],
    ):
        self.__emitter.on("push_state", listener)

    def off_push_state(
        self,
        listener: Callable[[], None],
    ):
        self.__emitter.off("push_state", listener)

    def on_pop_state(
        self,
        listener: Callable[[], None],
    ):
        self.__emitter.on("pop_state", listener)

    def off_pop_state(
        self,
        listener: Callable[[], None],
    ):
        self.__emitter.on("pop_state", listener)
