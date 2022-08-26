from asyncio import get_running_loop
from typing import Coroutine


def run_coroutine(coro: Coroutine):
    loop = get_running_loop()
    loop.create_task(coro)
