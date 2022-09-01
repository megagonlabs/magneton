from asyncio import get_running_loop, iscoroutinefunction, sleep
from sys import stderr
from traceback import print_tb
from typing import Coroutine


def run_coroutine(coro: Coroutine, delay=0):
    loop = get_running_loop()

    async def run():
        if delay:
            await sleep(delay)

        try:
            await coro
        except Exception as e:
            print(e, file=stderr)
            print_tb(e.__traceback__)

    loop.create_task(run())
