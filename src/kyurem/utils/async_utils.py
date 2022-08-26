from asyncio import get_running_loop, run_coroutine_threadsafe
from inspect import isawaitable
from typing import Awaitable, Coroutine, TypeVar, Union


T = TypeVar


async def resolve(x: Union[Awaitable[T], T]) -> Awaitable[T]:
    if isawaitable(x):
        return await x
    else:
        return x


def run_coroutine(coro: Coroutine):
    loop = get_running_loop()
    loop.create_task(coro)
