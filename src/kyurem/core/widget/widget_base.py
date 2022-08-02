from typing import Any, Callable, Dict, Mapping, TypedDict, Union
import idom
from idom import component, use_effect, use_memo, use_state
from shortuuid import uuid
from .widget_model import WidgetModel
from ..idom_loader import load_component


class WidgetBase:
    def __init__(
        self,
        component_name: str,
        props: Any = {},
        model: Union[WidgetModel, Mapping] = {},
    ):
        self.__component = load_component(component_name)
        self.__props = props

        self.__client_ids = set()
        self.__updaters: Dict[str, Callable] = {}
        self.__message_queues: Dict[str, Dict[str, _Message]] = {}

        self.__data = WidgetModel.proxy(model)

    # Helper functions for 2-way communication with component
    def __recv_message(self, type, payload, client_id):
        """
        Handles messages sent from the component.

        Do not call this function directly. This function is automatically
        called when a "message" event is sent from the component.
        """

        if type == "message_ack":
            message_id = payload
            if message_id in self.__message_queues[client_id]:
                del self.__message_queues[client_id][message_id]

        elif type == "update_model":
            path = payload["path"]
            value = payload["value"]

            WidgetModel.set(self.__data, path, value, tag=client_id)

        elif type == "call_func":
            path = payload["path"]
            return_id = payload["returnId"]
            args = payload["args"]

            func = WidgetModel.get(self.__data, path)
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

            self.__update(client_id)

    def __update(self, client_id):
        update = self.__updaters[client_id]
        update()

    @component
    def show(self):
        client_id = use_memo(uuid, dependencies=[])

        # Used to manually trigger updates
        _, set_counter = use_state(0)

        def update():
            set_counter(lambda i: i + 1)

        # Initialize class members
        def cleanup():
            self.__client_ids.remove(client_id)
            del self.__updaters[client_id]
            del self.__message_queues[client_id]

        def init():
            self.__client_ids.add(client_id)
            self.__updaters[client_id] = update
            self.__message_queues[client_id] = {}
            return cleanup

        use_effect(init, dependencies=[])

        # Send messages to component via props
        messages = (
            list(self.__message_queues[client_id].values())
            if client_id in self.__message_queues
            else []
        )

        # Synchronize model with component
        model = WidgetModel.export(self.__data)

        # Trigger update when model changes
        def observe_model():
            def cb(tag):
                if tag != client_id:
                    update()

            observer_id = WidgetModel.observe(self.__data, cb)
            return lambda: WidgetModel.unobserve(self.__data, observer_id)

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
    return value, None if not error else str(error)


class _Message(TypedDict):
    type: str
    payload: Any
    id: str
