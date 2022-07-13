import os
from pathlib import Path
import idom
from . import EPOCH, MODE, VERSION

MODULE_NAME = f"kyurem_client@{VERSION}{EPOCH}"
DEV_BUNDLE_PATH = Path(__file__).parent / "bundle.js"
PROD_BUNDLE_PATH = Path(__file__).parent / "bundle.min.js"
BUNDLE_PATH = DEV_BUNDLE_PATH if MODE == "development" else PROD_BUNDLE_PATH
FALLBACK = "⌛"


_web_module = None
_reload_num = 0


def _load_web_module():
    global _web_module, _reload_num

    # Always reload in development mode
    if MODE == "development":
        _web_module = idom.web.module_from_file(
            name=f"{MODULE_NAME}r{_reload_num}", file=BUNDLE_PATH, fallback=FALLBACK
        )
        _reload_num += 1

    # Otherwise only load once
    elif _web_module == None:
        _web_module = idom.web.module_from_file(
            name=f"{MODULE_NAME}", file=BUNDLE_PATH, fallback=FALLBACK
        )

    return _web_module


def load_component(component_name):
    web_module = _load_web_module()
    return idom.web.export(web_module, component_name)
