from abc import ABC
import json
from typing import Callable, Sequence, Union
from shortuuid import uuid


class Observable:
    def __init__(self):
        self.__observers = {}

    def observe(self, cb: Callable) -> str:
        observer_id = uuid()
        self.__observers[observer_id] = cb
        return observer_id

    def unobserve(self, observer_id: str):
        del self.__observers[observer_id]

    def notify(self, tag):
        for cb in self.__observers.values():
            cb(tag)

    # TODO: watch/unwatch


class WidgetModel(ABC):
    _is_widget_model = None

    @staticmethod
    def has_instance(obj):
        subclass = type(obj)
        return any(
            "_is_widget_model" in baseclass.__dict__ for baseclass in subclass.__mro__
        )

    @staticmethod
    def proxy(target, tag=None, source: "WidgetModel" = None, dotdict=False):
        observable = None
        if source is not None:
            observable = source.__observable
            if tag is None:
                tag = source.__tag

        # Known mutable/container types
        if WidgetModel.has_instance(target):
            if observable is None:
                observable = target.__observable
            return type(target)(target, tag, observable)
        if isinstance(target, dict):
            if dotdict:
                return DotDictProxy(target, tag, observable)
            else:
                return DictProxy(target, tag, observable)
        if isinstance(target, list):
            return ListProxy(target, tag, observable)
        if isinstance(target, tuple):
            return TupleProxy(target, tag, observable)

        # Known immutable/primitive types
        if (
            isinstance(target, (int, float, str, bool))
            or target is None
            or callable(target)
        ):
            return target

        # Unknown types
        print(
            f"Warning: Possibly mutable type {type(target)} not recognized. Some changes might not be tracked."
        )
        return target

    @staticmethod
    def export(target: "WidgetModel"):
        def default(value):
            if callable(value):
                return {"__callable__": True}
            if WidgetModel.has_instance(value):
                return WidgetModel.export(value)

            raise TypeError(f"cannot export data of type {type(value)}")

        return json.loads(json.dumps(WidgetModel.unproxy(target), default=default))

    @staticmethod
    def observe(target: "WidgetModel", cb: Callable):
        return target.__observable.observe(cb)

    @staticmethod
    def unobserve(target: "WidgetModel", observer_id: str):
        target.__observable.unobserve(observer_id)

    @staticmethod
    def set(target: "WidgetModel", path: Sequence[Union[str, int]], value, tag):
        d = WidgetModel.proxy(target, tag=tag)
        d = WidgetModel.get(d, path[:-1])
        d[path[-1]] = value

    @staticmethod
    def get(target: "WidgetModel", path: Sequence[Union[str, int]]):
        d = target
        for k in path:
            d = d[k]
        return d

    @staticmethod
    def unproxy(target):
        if WidgetModel.has_instance(target):
            return target.__target
        else:
            return target

    @staticmethod
    def notify(target: "WidgetModel", tag=None):
        if tag is None:
            tag = target.__tag
        target.__observable.notify(target.__tag)

    def __init__(self, target={}, tag=None, observable: Observable = None):
        if observable is None:
            observable = Observable()

        self.__target = target
        self.__tag = tag
        self.__observable = observable

    ##############################
    # Proxied Collection Methods #
    ##############################

    def __setitem__(self, key, value):
        self.__target.__setitem__(key, value)
        self.__observable.notify(self.__tag)

    def __delitem__(self, key):
        self.__target.__delitem__(key)
        self.__observable.notify(self.__tag)

    def __getitem__(self, *args, **kwargs):
        value = self.__target.__getitem__(*args, **kwargs)
        return WidgetModel.proxy(value, source=self)

    def __iter__(self, *args, **kwargs):
        for x in self.__target.__iter__(*args, **kwargs):
            yield WidgetModel.proxy(x, source=self)

    def __reversed__(self, *args, **kwargs):
        for x in self.__target.__reversed__(*args, **kwargs):
            yield WidgetModel.proxy(x, source=self)

    def __len__(self, *args, **kwargs):
        return self.__target.__len__(*args, **kwargs)

    def __length_hint__(self, *args, **kwargs):
        return self.__target.__length_hint__(*args, **kwargs)

    def __missing__(self, *args, **kwargs):
        return self.__target.__missing__(*args, **kwargs)

    def __contains__(self, *args, **kwargs):
        return self.__target.__contains__(*args, **kwargs)

    def __add__(self, *args, **kwargs):
        return self.__target.__add__(*args, **kwargs)

    def __radd__(self, *args, **kwargs):
        return self.__target.__radd__(*args, **kwargs)

    def __iadd__(self, *args, **kwargs):
        return self.__target.__iadd__(*args, **kwargs)

    def __mul__(self, *args, **kwargs):
        return self.__target.__mul__(*args, **kwargs)

    def __rmul__(self, *args, **kwargs):
        return self.__target.__rmul__(*args, **kwargs)

    def __imul__(self, *args, **kwargs):
        return self.__target.__imul__(*args, **kwargs)

    def __repr__(self, *args, **kwargs):
        return self.__target.__repr__(*args, **kwargs)


class DictProxy(WidgetModel):
    pass


class DotDictProxy(WidgetModel):
    __initialized = False

    def __init__(self, *args, **kwargs):
        self.__initialized = False
        super().__init__(*args, **kwargs)
        self.__initialized = True

    def __setattr__(self, key, value):
        if not self.__initialized:
            super().__setattr__(key, value)
        else:
            self[key] = value

    def __getattr__(self, key):
        return self[key]

    def __getitem__(self, key):
        target = WidgetModel.unproxy(self)
        return WidgetModel.proxy(target[key], source=self, dotdict=True)


class ListProxy(WidgetModel):
    pass


class TupleProxy(WidgetModel):
    pass
