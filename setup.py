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
        "idom-jupyter==0.7.6",
        "jsonmerge==1.7.0",
        "jsonpath==0.82",
        "jsonpath-rw==1.4.0",
        "jsonpath_ng==1.5.1",
        "jsonschema==3.2.0",
        "neo4j==1.7.2",
        "neobolt==1.7.9",
        "neotime==1.7.4",
        "pandas==1.1.2"
    ],
    "include_package_data": True,
    "zip_safe": False
}
setup(**package)