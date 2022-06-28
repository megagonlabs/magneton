# kyurem-client
## To use in Python Notebook
```python
# To use library modules
from kyurem_client import ...
```
## For development
- Under root folder
  - (Optional) create a new conda enviroment: `conda create --name kyurem_env python=3.8`
  - Run `pip install -e .` 
- Under **/js** folder
  - Run `npm install`
  - Run `npm run watch`: this automatically rebundles JS components for you; then restart the notebook to test
- Periodically delete JS files created by kyurem-ui under `/Users/[username]/Library/Application Support/idom-jupyter/`
  - run `whoami` to get username from the terminal (macOS)


## Acknowledgements
The project was initially set-up using the [juptyter-widget cookiecutter](https://github.com/rit-git/react-jupyter-cookiecutter). The service app was initially set up by Rafael Li Chen.