from typing import Callable, Dict, Mapping, NamedTuple, Union
from shortuuid import uuid


class WidgetModel:
    def __init__(self, init: Mapping = {}):
        self.__dict = dict(init)
        self.__observers: Dict[str, Callback] = {}

    def set(self, key: str, value: any, client_id: Union[str, None] = None):
        self.__dict[key] = value
        self.__notify(initiator=client_id)

    def get(self, key: str):
        return self.__dict[key]

    def client(self, client_id: Union[str, None] = None):
        if client_id is None:
            client_id = uuid()
        return WidgetModel.Client(self, client_id)

    def observe(self, callback: "Callback", observer_id: Union[str, None] = None):
        if observer_id is None:
            observer_id = uuid()

        self.__observers[observer_id] = callback

        return observer_id

    def unobserve(self, observer_id: str):
        del self.__observers[observer_id]

    def __notify(self, initiator: Union[str, None]):
        for callback in self.__observers.values():
            callback(MutationEvent(initiator=initiator, target=self))

    def serialize(self):
        result = {}
        for key, value in self.__dict.items():
            if callable(value):
                result[key] = {"type": "function"}
            else:
                result[key] = {"type": "value", "value": value}
        return result

    class Client:
        def __init__(self, widget_model: "WidgetModel", client_id: str):
            self.__widget_model = widget_model
            self.__client_id = client_id

        def __setattr__(self, name, value):
            if name.startswith("_Client"):
                super().__setattr__(name, value)
            else:
                self.__widget_model.set(name, value, client_id=self.__client_id)

        def __getattr__(self, name):
            if name.startswith("_Client"):
                return super().__getattr__(name)
            else:
                return self.__widget_model.get(name)


class MutationEvent(NamedTuple):
    initiator: Union[str, None]
    target: WidgetModel


Callback = Callable[[MutationEvent], None]
