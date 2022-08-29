from dataclasses import replace
from typing import Any, Callable


def deepcopy(x, replacer: Callable[[Any], Any] = None):
    if replacer:
        x = replacer(x)

    # Sequence Types
    if isinstance(x, list):
        return list(deepcopy(y) for y in x)
    if isinstance(x, tuple):
        return tuple(deepcopy(y) for y in x)

    # Mapping Types
    if isinstance(x, dict):
        return dict((deepcopy(k), deepcopy(v)) for k, v in x.items())

    # Set Types
    if isinstance(x, set):
        return set(deepcopy(y) for y in x)
    if isinstance(x, frozenset):
        return frozenset(deepcopy(y) for y in x)

    # Primitive Types
    if isinstance(x, (str, int, float, complex, bool)):
        return x
    if x is None:
        return x

    raise TypeError()
