from collections import defaultdict
from typing import Callable


class Emitter:
    def __init__(self) -> None:
        self.__listeners = defaultdict(set)

    def on(self, event: str, listener: Callable):
        self.__listeners[event].add(listener)

    def off(self, event: str, listener: Callable):
        self.__listeners[event].remove(listener)

    def emit(self, event: str, *args, **kwargs):
        for listener in frozenset(self.__listeners[event]):
            listener(*args, **kwargs)
