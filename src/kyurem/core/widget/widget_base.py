from collections import defaultdict
from traceback import format_tb
from typing import Any, Callable, Dict, Mapping, List, TypedDict, Union
import idom
from idom import component, use_effect, use_memo, use_state
from shortuuid import uuid
from .widget_model import WidgetModel
from ..idom_loader import load_component
from asyncio import Future, get_running_loop, iscoroutine


class WidgetBase:
    def __init__(
        self,
        component_name: str,
        props: Any = {},
        model: Union[WidgetModel, Mapping] = {},
    ):
        self.__component = load_component(component_name)
        self.__props = props

        self.__component_ids = set()
        self.__updaters: Dict[str, Callable] = {}

        self.__message_seq = 0
        self.__message_queues: Dict[str, List[_Message]] = defaultdict(list, {})

        self.__receivers = {}

        self.__render_count = 0
        self.__render_listeners = {}

        self.__model = WidgetModel.proxy(model)

    # Helper functions for 2-way communication with component
    async def __recv_message(self, data):
        """
        Handles messages sent from the component.

        Do not call this function directly. This function is automatically
        called when a "message" event is sent from the component.
        """
        type, payload, component_id = data

        if type == "message_ack":
            # Remove acknowledged messages
            message_ack = payload
            queue = self.__message_queues[component_id]
            while queue != [] and queue[0]["seq"] <= message_ack:
                queue.pop(0)

        elif type == "update_model":
            # Receive updates from component
            path = payload["path"]
            value = payload["value"]

            WidgetModel.set(self.__model, path, value, tag=component_id)

        elif type == "call_func":
            # Call and return result from function

            path = payload["path"]
            return_id = payload["returnId"]
            args = payload["args"]

            func = WidgetModel.get(self.__model, path)

            self.send_message(return_id, await _call_capture(func, args))

        # Notify any additional message receivers
        if type in self.__receivers:
            for wrapper in list(self.__receivers[type].values()):
                wrapper(type, payload, component_id)

    class MessageReceiverHandler:
        def __init__(self, stop: Callable):
            self.stop = stop

    def recv_message(self, type, cb):
        """
        Receive messages from component
        """
        rcvr_id = uuid()
        self.__receivers.setdefault(type, {})[rcvr_id] = cb

        def stop():
            if type in self.__receivers and rcvr_id in self.__receivers[type]:
                del self.__receivers[type][rcvr_id]

        return WidgetBase.MessageReceiverHandler(stop=stop)

    def send_message(self, type, payload):
        """
        Send a message to the component.
        """
        # Add messages to queue/trigger a re-render
        self.__message_seq += 1
        message_seq = self.__message_seq
        for component_id in self.__component_ids:
            queue = self.__message_queues[component_id]
            queue.append(
                {
                    "type": type,
                    "payload": payload,
                    "seq": message_seq,
                }
            )

            self.__update(component_id)

    def __update(self, component_id):
        update = self.__updaters[component_id]
        update()

    def flush(self):
        cb_id = uuid()
        component_ids = set(self.__component_ids)

        try:
            future = get_running_loop().create_future()
        except RuntimeError:
            future = Future()

        def cb(component_id):
            if component_id in component_ids:
                component_ids.remove(component_id)
            if len(component_ids) == 0:
                del self.__render_listeners[cb_id]
                future.set_result(None)

        self.__render_listeners[cb_id] = cb

        for component_id in self.__component_ids:
            self.__update(component_id)

        return future

    @component
    def component(self):
        component_id = use_memo(uuid, dependencies=[])

        # Used to manually trigger updates
        _, set_counter = use_state(0)

        def update():
            set_counter(lambda i: i + 1)

        # Initialize class members
        def cleanup():
            self.__component_ids.remove(component_id)
            del self.__updaters[component_id]
            del self.__message_queues[component_id]

        def init():
            self.__component_ids.add(component_id)
            self.__updaters[component_id] = update
            return cleanup

        use_effect(init, dependencies=[])

        # Send messages to component via props
        messages = list(self.__message_queues[component_id])

        # Synchronize model with component
        model = WidgetModel.export(self.__model)

        # Trigger update when model changes
        def observe_model():
            def cb(tag):
                if tag != component_id:
                    update()

            observer_id = WidgetModel.observe(self.__model, cb)
            return lambda: WidgetModel.unobserve(self.__model, observer_id)

        use_effect(observe_model, dependencies=[])

        # Notify render listeners
        def notify_render_listeners():
            for cb in list(self.__render_listeners.values()):
                cb(component_id)

        self.__render_count += 1
        use_effect(notify_render_listeners, [self.__render_count])

        return self.__component(
            {
                "wrapperProps": {
                    "clientId": component_id,
                    "messages": messages,
                    "model": model,
                },
                "componentProps": self.__props,
            },
            event_handlers={
                "message": idom.core.events.EventHandler(
                    self.__recv_message,
                    target="message",
                )
            },
        )


async def _call_capture(func, args):
    """
    Call given function, but catch and return any errors
    """
    error = value = None
    try:
        value = func(*args)
        if iscoroutine(value):
            value = await value
    except Exception as e:
        error = str(e) + "\n" + "".join(format_tb(e.__traceback__))

    return value, error


class _Message(TypedDict):
    type: str
    payload: Any
    seq: int
