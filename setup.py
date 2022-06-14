from setuptools import setup, find_packages
from pathlib import Path

version = Path("./kyurem_ui/version").read_text().strip()
package = {
    "name": "kyurem_ui",
    "version": version,
    "description": "A Jupyter Widget Library for KH-alignment",
    "url": "https://github.com/rit-git/kyurem-ui",
    "author": "Sajjadur Rahman",
    "author_email": "sajjadur@megagon.ai",
    "license": "unlicense",
    "packages": find_packages(exclude=["dev"]),
    "install_requires": [
        "idom==0.38.1", 
        "idom-jupyter==0.7.6"
    ],
    "include_package_data": True,
    "zip_safe": False
}
setup(**package)