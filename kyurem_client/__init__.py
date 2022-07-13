from pathlib import Path
import idom_jupyter

EPOCH = ""
MODE = "production"
try:
    from .dev.development import EPOCH_DEV

    EPOCH = "." + str(EPOCH_DEV)

    # TODO: find a better way to switch between prod/dev mode. Maybe environment
    # variable? But where?
    MODE = "development"
except ImportError or ModuleNotFoundError:
    pass

_VERSION_PATH = Path(__file__).parent / "version"
VERSION = Path(_VERSION_PATH).read_text().strip()
print("kyurem_client: " + VERSION)

from .widgets.Distribution import Distribution
from .widgets.DualDistribution import DualDistribution
from .widgets.LinkedDistribution import LinkedDistribution
from .widgets.SummaryView import SummaryView
from .widgets.Schema import Schema
from .service import Service
