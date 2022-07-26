from typing import Any, Callable, Dict, Mapping, TypedDict, Union
import idom
from idom import component, use_effect, use_memo, use_state
from shortuuid import uuid
from .widget_model import MutationEvent, WidgetModel
from ..idom_loader import load_component


class WidgetBase:
    def __init__(
        self,
        component_name: str,
        props: Any = {},
        model: Union[WidgetModel, Mapping, None] = None,
    ):
        self.__component = load_component(component_name)
        self.__props = props

        self.__client_ids = set()
        self.__setters: Dict[str, Callable] = {}
        self.__message_queues: Dict[str, Dict[str, _Message]] = {}

        if isinstance(model, WidgetModel) or model is None:
            self.__model = model
        else:
            self.__model = WidgetModel(model)

    # Helper functions for 2-way communication with component
    def __recv_message(self, type, payload, client_id):
        """
        Handles messages sent from the component.

        Do not call this function directly. This function is automatically
        called when a "message" event is sent from the component.
        """

        if type == "message_ack":
            message_id = payload
            del self.__message_queues[client_id][message_id]

        elif type == "update_model":
            key = payload["key"]
            value = payload["value"]

            self.__model.set(key, value, client_id=client_id)

        elif type == "call_func":
            key = payload["key"]
            return_id = payload["returnId"]
            args = payload["args"]

            func = self.__model.get(key)
            self.__send_message(return_id, _call_no_throw(func, args))

        else:
            print(f"Warning: Received message of unknown type '{type}'")

    def __send_message(self, type, payload):
        """
        Send a message to the component.
        """
        # Add messages to queue/trigger a re-render
        message_id = uuid()
        for client_id in self.__client_ids:
            message_queue = self.__message_queues[client_id]

            message_queue[message_id] = {
                "type": type,
                "payload": payload,
                "id": message_id,
            }

            self.__flush_messages(client_id)

    def __flush_messages(self, client_id):
        message_queue = self.__message_queues[client_id]
        set_messages = self.__setters[client_id]

        set_messages(list(message_queue.values()))

    @component
    def show(self):
        client_id = use_memo(uuid, dependencies=[])

        # Communicate with the component by passing
        # messages to props. This is translated into
        # events on the front-end (js) side in widget-wrapper.tsx
        messages, set_messages = use_state([])

        # Initialize class members
        def cleanup():
            self.__client_ids.remove(client_id)
            del self.__setters[client_id]
            del self.__message_queues[client_id]

        def init():
            self.__client_ids.add(client_id)
            self.__setters[client_id] = set_messages
            self.__message_queues[client_id] = {}
            return cleanup

        use_effect(init, dependencies=[])

        # Synchronize model with component
        model, set_model = use_state(
            lambda: self.__model.serialize() if self.__model is not None else None
        )

        def observe_model():
            def cb(ev: MutationEvent):
                if ev.initiator != client_id:
                    self.__flush_messages(client_id)
                    set_model(ev.target.serialize())

            if self.__model is not None:
                observer_id = self.__model.observe(cb)
                return lambda: self.__model.unobserve(observer_id)

        use_effect(observe_model, dependencies=[])

        return self.__component(
            {
                "wrapperProps": {
                    "clientId": client_id,
                    "messages": messages,
                    "model": model,
                },
                "componentProps": self.__props,
            },
            event_handlers={
                "message": idom.core.events.EventHandler(
                    lambda data: self.__recv_message(data[0], data[1], data[2]),
                    target="message",
                )
            },
        )


def _call_no_throw(func, args):
    """
    Call given function, but catch any errors and return as tuple
    """
    try:
        value = func(*args)
        error = None
    except Exception as e:
        value = None
        error = e.args
    return value, error


class _Message(TypedDict):
    type: str
    payload: Any
    id: str
