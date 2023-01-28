# Check the version of runtime dependencies
import pkg_resources
from packaging import version

assert version.parse(
    pkg_resources.get_distribution("notebook").version
) < version.parse("7")
assert version.parse(
    pkg_resources.get_distribution("ipywidgets").version
) < version.parse("8")

# Set up package
from pathlib import Path

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
print("magneton_client: " + VERSION)

# Export widgets
from .widgets.BarViewer import BarViewer
from .widgets.LinkedViews import LinkedViews
from .service import Service