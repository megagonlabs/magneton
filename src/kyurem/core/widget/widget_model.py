from typing import Callable, Dict, Mapping, NamedTuple, Union
from shortuuid import uuid


class MutationEvent(NamedTuple):
    initiator: Union[str, None]


Callback = Callable[[MutationEvent], None]


class WidgetModelBackend:
    def __init__(self, init: Mapping = {}):
        self.__id = uuid()
        self.__dict = dict(init)
        self.__observers: Dict[str, Callback] = {}

        self.__submodel_observers = {}

    def set(self, key: str, value: any, client_id: Union[str, None] = None):
        prev_value = self.__dict[key] if key in self.__dict else None
        if isinstance(prev_value, WidgetModelClient):
            submodel = WidgetModelClient.get_backend(prev_value)
            submodel.unobserve(self.__submodel_observers[submodel])

        self.__dict[key] = value
        if isinstance(value, WidgetModelClient):
            submodel = WidgetModelClient.get_backend(value)
            observer_id = submodel.observe(
                lambda event: self.__notify(initiator=event.initiator)
            )
            self.__submodel_observers[submodel.__id] = observer_id

        self.__notify(initiator=client_id)

    def get(self, key: str):
        return self.__dict[key] if key in self.__dict else None

    def client(self, client_id: Union[str, None] = None):
        if client_id is None:
            client_id = uuid()
        return WidgetModel(self, client_id)

    def observe(
        self, callback: "Callback", observer_id: Union[str, None] = None
    ) -> str:
        if observer_id is None:
            observer_id = uuid()

        self.__observers[observer_id] = callback

        return observer_id

    def unobserve(self, observer_id: str):
        del self.__observers[observer_id]

    def __notify(self, initiator: Union[str, None]):
        for callback in self.__observers.values():
            callback(MutationEvent(initiator=initiator))

    def serialize(self):
        result = {}
        for key, value in self.__dict.items():
            if isinstance(value, WidgetModelClient):
                result[key] = WidgetModelClient.get_model(value).serialize()
            elif callable(value):
                result[key] = {"type": "function"}
            else:
                result[key] = {"type": "value", "value": value}
        return result


class WidgetModelClient:
    def __init__(self, backend: "WidgetModelBackend", client_id: str):
        self.__backend = backend
        self.__client_id = client_id

    def __setitem__(self, name, value):
        self.__backend.set(name, value, client_id=self.__client_id)

    def __setattr__(self, name, value):
        if name.startswith("_WidgetModel"):
            super().__setattr__(name, value)
        else:
            self[name] = value

    def __getitem__(self, name):
        value = self.__backend.get(name)
        if isinstance(value, WidgetModelClient):
            value = WidgetModelClient.get_backend(value).client(self.__client_id)
        return value

    def __getattr__(self, name):
        if name.startswith("_WidgetModel"):
            return super().__getattr__(name)
        else:
            return self[name]

    @staticmethod
    def get_backend(client: "WidgetModelClient"):
        return client.__backend


class WidgetModel(WidgetModelClient):
    @staticmethod
    def make_model(init: Mapping = {}):
        return WidgetModelBackend(init).client()

    @staticmethod
    def observe(model: WidgetModelClient, cb: Callback):
        return WidgetModelClient.get_backend(model).observe(cb)

    @staticmethod
    def unobserve(model: WidgetModelClient, observer_id):
        return WidgetModelClient.get_backend(model).unobserve(observer_id)

    @staticmethod
    def serialize(model: WidgetModelClient):
        return WidgetModelClient.get_backend(model).serialize()


def is_widget_model(model):
    return isinstance(model, WidgetModelClient)
