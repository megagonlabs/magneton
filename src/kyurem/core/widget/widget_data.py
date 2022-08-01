from abc import ABC, abstractstaticmethod
from collections import defaultdict
from typing import Callable, Sequence
from shortuuid import uuid


class WidgetData(ABC):
    Dict: "_Dict"
    Object: "_Object"
    Tuple: "_Tuple"

    def __init__(self, container):
        self._container = container

        self.__observers = {}
        self.__subcollections = {}
        self.__subcollection_listeners = {}

    #############
    # ABC Hacks #
    #############

    _is_widget_data = None

    @classmethod
    def __subclasshook__(cls, subclass):
        if any(
            "_is_widget_data" in baseclass.__dict__ for baseclass in subclass.__mro__
        ):
            return True
        return NotImplemented

    ####################
    # Public Interface #
    ####################

    @abstractstaticmethod
    def export(target: "WidgetData"):
        if type(target) is WidgetData:
            raise Exception("method not implemented")

        return type(target).export(target)

    @staticmethod
    def observe(target: "WidgetData", listener: Callable):
        observer_id = uuid()
        target.__observers[observer_id] = listener
        return observer_id

    @staticmethod
    def unobserve(target: "WidgetData", observer_id: str):
        del target.__observers[observer_id]
        return type(target).unobserve(target, observer_id)

    @staticmethod
    def create_from(value, prefer_object=False) -> "WidgetData":
        if isinstance(value, WidgetData):
            return value

        elif isinstance(value, dict):
            if prefer_object:
                return WidgetData.Object(value)
            else:
                return WidgetData.Dict(value)

        else:
            raise TypeError(
                f"Cannot create WidgetData from argument of type {type(value)}"
            )

    ######################
    # Internal Interface #
    ######################

    def _notify(self):
        for listener in self.__observers.values():
            listener()

    def _watch(self, key, value):
        self._unwatch(key)
        if isinstance(value, WidgetData):
            self.__subcollections[key] = value
            self.__subcollection_listeners[key] = WidgetData.observe(
                value, self._notify
            )

    def _unwatch(self, key):
        if key in self.__subcollection_listeners:
            subcollection = self.__subcollections[key]
            WidgetData.unobserve(subcollection, self.__subcollection_listeners[key])
            del self.__subcollections[key]
            del self.__subcollection_listeners[key]

    @staticmethod
    def _check_type(value):
        return (
            isinstance(value, (WidgetData, list, tuple, int, float, str, bool))
            or callable(value)
            or value == None
        )

    @staticmethod
    def _coerce(value, prefer_object=False):
        if WidgetData._check_type(value):
            return value
        else:
            return WidgetData.create_from(value, prefer_object=prefer_object)

    ############
    # Mutators #
    ############

    def __setitem__(self, key, value):
        # Convert value to a valid data type if it isn't already
        value = WidgetData._coerce(value)

        # Save data and notify
        self._container.__setitem__(key, value)
        self._notify()

        # Set up listeners if incoming value is WidgetData
        self._watch(key, value)

    def __delitem__(self, key):
        # Unwatch whatever value was there
        self._unwatch(key)

        # Apply and notify
        self._container.__delitem__(key)
        self._notify()

    #########
    # Views #
    #########
    def __len__(self, *args, **kwargs):
        return self._container.__len__(*args, **kwargs)

    def __length_hint__(self, *args, **kwargs):
        return self._container.__length_hint__(*args, **kwargs)

    def __getitem__(self, *args, **kwargs):
        return self._container.__getitem__(*args, **kwargs)

    def __missing__(self, *args, **kwargs):
        return self._container.__missing__(*args, **kwargs)

    def __iter__(self, *args, **kwargs):
        return self._container.__iter__(*args, **kwargs)

    def __reversed__(self, *args, **kwargs):
        return self._container.__reversed__(*args, **kwargs)

    def __contains__(self, *args, **kwargs):
        return self._container.__contains__(*args, **kwargs)

    def __add__(self, *args, **kwargs):
        return self._container.__add__(*args, **kwargs)

    def __radd__(self, *args, **kwargs):
        return self._container.__radd__(*args, **kwargs)

    def __iadd__(self, *args, **kwargs):
        return self._container.__iadd__(*args, **kwargs)

    def __mul__(self, *args, **kwargs):
        return self._container.__mul__(*args, **kwargs)

    def __rmul__(self, *args, **kwargs):
        return self._container.__rmul__(*args, **kwargs)

    def __imul__(self, *args, **kwargs):
        return self._container.__imul__(*args, **kwargs)

    def __repr__(self, *args, **kwargs):
        return self._container.__repr__(*args, **kwargs)


class _Mapping(WidgetData):
    def export(target):
        result = {}
        for key, value in target._container.items():
            if isinstance(value, WidgetData):
                result[key] = {"type": "collection", "model": WidgetData.export(value)}
            if callable(value):
                result[key] = {"type": "function"}
            else:
                result[key] = {"type": "value", "value": value}
        return result


class _Sequence(WidgetData):
    def export(target):
        result = []
        for value in target._container:
            if isinstance(value, WidgetData):
                result.append({"type": "collection", "model": WidgetData.export(value)})
            elif callable(value):
                result.append({"type": "function"})
            else:
                result.append({"type": "value", "value": value})
        return result


class _Dict(_Mapping):
    def __init__(self, *args, **kwargs):
        super().__init__(container={})

        self.update(*args, **kwargs)

    #############
    # Mutations #
    #############

    def clear(self, *args, **kwargs):
        for key in self._container:
            WidgetData._unwatch(self, key)

        self._container.clear(*args, **kwargs)
        WidgetData._notify(self)

    def pop(self, *args, **kwargs):
        self._unwatch(args[0])
        result = self._container.pop(*args, **kwargs)
        self._notify()
        return result

    def popitem(self, *args, **kwargs):
        result = self._container.popitem(*args, **kwargs)
        self._unwatch(result[0])
        self._notify()
        return result

    def setdefault(self, *args, **kwargs):
        result = self._container.setdefault(*args, **kwargs)
        WidgetData._watch(args[0], result)
        WidgetData._notify()
        return result

    def update(self, *args, **kwargs):
        # Get entries to update
        entries = []
        if len(args) > 0:
            other = args[0]
            if isinstance(other, dict):
                entries.extend(other.items())
            else:
                entries.extend(other)
        entries.extend(kwargs.items())

        # Convert values
        for i, (key, value) in enumerate(entries):
            entries[i] = (key, WidgetData._coerce(value))

        # Watch/re-watch changed values
        for key, value in entries:
            self._watch(key, value)

        # Update underlying container
        self._container.update(entries)

        # Notify observers
        self._notify()

    #########
    # Views #
    #########

    def copy(self, *args, **kwargs):
        return self._container.copy(*args, **kwargs)

    def get(self, *args, **kwargs):
        return self._container.get(*args, **kwargs)

    def items(self, *args, **kwargs):
        return self._container.items(*args, **kwargs)

    def keys(self, *args, **kwargs):
        return self._container.keys(*args, **kwargs)

    def reversed(self, *args, **kwargs):
        return self._container.reversed(*args, **kwargs)

    def values(self, *args, **kwargs):
        return self._container.values(*args, **kwargs)


class _Object(_Mapping):
    __initialized = False

    def __init__(self, mapping={}):
        super().__init__(container=defaultdict(lambda: None, {}))

        # Convert values
        entries = list(mapping.items())
        for i, (key, value) in enumerate(entries):
            entries[i] = (key, WidgetData._coerce(value))

        # Watch values
        for key, value in entries:
            self._watch(key, value)

        # Update container
        self._container.update(entries)

        self.__initialized = True

    def __setitem__(self, key: str, value):
        value = WidgetData._coerce(value, prefer_object=True)
        super().__setitem__(key, value)

    def __setattr__(self, name: str, value):
        # Disable setattr override until initialization is finished
        if not self.__initialized:
            return super().__setattr__(name, value)

        self.__setitem__(name, value)

    def __delattr__(self, name: str):
        self.__delitem__(self, name)

    def __getattr__(self, name: str):
        return super().__getitem__(name)


class _Tuple(_Sequence):
    def __init__(self, iterable: Sequence):
        container = tuple(WidgetData._coerce(x) for x in iterable)
        super().__init__(container=container)

        for i, x in enumerate(container):
            self._watch(i, x)


WidgetData.Dict = _Dict
WidgetData.Object = _Object
WidgetData.Tuple = _Tuple
