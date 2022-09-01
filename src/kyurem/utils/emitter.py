from collections import defaultdict
from typing import Callable, TypeVar, Generic


Event = TypeVar("Event", bound=str)


class Emitter(Generic[Event]):
    def __init__(self) -> None:
        self.__listeners = defaultdict(set)

    def on(self, event: Event, listener: Callable):
        self.__listeners[event].add(listener)

    def off(self, event: Event, listener: Callable):
        self.__listeners[event].remove(listener)

    def emit(self, event: Event, *args, **kwargs):
        for listener in frozenset(self.__listeners[event]):
            listener(*args, **kwargs)
