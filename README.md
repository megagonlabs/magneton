# kyurem-ui
## To use in Python Notebook
```python
# To use library modules
from kyurem_ui import Widget
Widget().show()
```
## For development
- Under **kyurem-ui** folder
  - Run `pip install -e .`
- Under **kyurem-ui/js** folder
  - Run `npm install`
  - Run `npm run watch`: this automatically rebundles JS components for you; then restart the notebook to test
- Periodically delete JS files created by kyurem-ui under `/Users/[username]/Library/Application Support/idom-jupyter/`
  - run `whoami` to get username from the terminal (macOS)