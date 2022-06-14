from pathlib import Path
import idom
from idom.web.module import NAME_SOURCE, WebModule
import idom_jupyter
from idom.config import IDOM_DEBUG_MODE, IDOM_WED_MODULES_DIR
from idom.web.utils import resolve_module_exports_from_file, module_name_suffix

EPOCH = ""
BUNDLE_JS = "bundle.min.js"
try:
    from .dev.development import EPOCH_DEV
    EPOCH = "." + str(EPOCH_DEV)
    BUNDLE_JS = "bundle.js"
except ImportError or ModuleNotFoundError:
    pass
_BUNDLE_PATH = Path(__file__).parent / BUNDLE_JS
_VERSION_PATH = Path(__file__).parent / 'version'
version = Path(_VERSION_PATH).read_text().strip()
name = f"kyurem_ui@{version}{EPOCH}"
print("kyurem_ui: " + version)
file = _BUNDLE_PATH
fallback = "..."
_WEB_MODULE = None


def _web_module_path(name: str) -> Path:
    name += module_name_suffix(name)
    path = IDOM_WED_MODULES_DIR.current.joinpath(*name.split("/"))
    return path.with_suffix(path.suffix)


try:
    _WEB_MODULE = idom.web.module_from_file(name=name,
                                            file=file,
                                            fallback=fallback)
except FileExistsError:
    source_file = Path(file)
    target_file = _web_module_path(name)
    _WEB_MODULE = WebModule(
        source=name + module_name_suffix(name),
        source_type=NAME_SOURCE,
        default_fallback=fallback,
        file=target_file,
        export_names=(resolve_module_exports_from_file(source_file, 5)
                      if IDOM_DEBUG_MODE.current else None),
    )

from .Widget import Widget