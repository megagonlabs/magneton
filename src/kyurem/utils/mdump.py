import json
from math import inf
from ..core.widget import WidgetModel
from colorama import Fore, Style


def mdump(model, depth=inf, indent_level=0):
    data = WidgetModel.unproxy(model)
    pre = "  " * indent_level

    if isinstance(data, dict) or isinstance(data, list):
        if depth == 0 and len(data) > 0:
            b, e = ("{", "}") if isinstance(data, dict) else ("[", "]")
            return f"{b} {Fore.MAGENTA}...{len(data)} items...{Style.RESET_ALL} {e}"

        if len(data) == 0:
            ws = wse = ""
        elif len(data) == 1:
            ws = wse = " "
        else:
            ws = "\n  " + pre
            wse = ",\n" + pre

        if isinstance(data, dict):
            return (
                "{"
                + ws
                + ("," + ws).join(
                    f"{Fore.LIGHTRED_EX}{json.dumps(key)}{Style.RESET_ALL}: {mdump(value, depth - 1, indent_level + 1)}"
                    for key, value in data.items()
                )
                + wse
                + "}"
            )
        else:
            return (
                "["
                + ws
                + ("," + ws).join(
                    mdump(value, depth - 1, indent_level + 1) for value in data
                )
                + wse
                + "]"
            )
    elif isinstance(data, str):
        return f"{Fore.LIGHTRED_EX}{json.dumps(data)}{Style.RESET_ALL}"
    elif isinstance(data, bool):
        return f"{Style.BRIGHT}{Fore.LIGHTGREEN_EX}{str(data)}{Style.RESET_ALL}"
    else:
        return f"{Fore.LIGHTGREEN_EX}{str(data)}{Style.RESET_ALL}"
