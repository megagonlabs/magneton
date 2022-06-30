# kyurem-client

## For development
**Step 1**: clone the repository.

```
$ git clone https://github.com/rit-git/kyurem.git
$ cd kyurem # the root folder: $root
```

**Step 2**: create a conda environment specific to this project.

```
$ conda create --name kyurem_env python=3.8
$ conda activate kyurem_env
```

**Step 3**: Install packages in the `root` folder.

```
(kyurem_env) $ pip install -e . 
```

**Step 4**: Register the new environment as a jupyter kernel.

```
(kyurem_env) $ python -m ipykernel install --user --name=kyurem_env
```

**Step 5**: Install and bundle front-end components in a new terminal window.

```
(kyurem_env) $ cd /$root/js
(kyurem_env) $ npm install
(kyurem_env) $ npm run watch # keep this running for dev
```

**Step 6**: Run the backend service (flask app) in a separate terminal.

```
(kyurem_env) $ cd /$root/service/
(kyurem_env) $ python main.py
```

## To use in Python Notebook
Say the user wants to view node distribution in the knowledge graph.

```python
# issue a request to get node distribution of a KH
import requests
response = requests.get(
                'http://127.0.0.1:5000/distributions/node',
                json={
                 'database_name': $KB_NAME_AWS_Knowledge_Hub
                })
if response.status_code == 200:
    node_dist = response.json()
else:
    print(response.text) 
```

```python
# To use library modules
from kyurem_client import Distribution
```

```python
# display barchart
widget = Distribution(node_dist)
widget.show()
```

## Acknowledgements
The project was initially set-up using the [juptyter-widget cookiecutter](https://github.com/rit-git/react-jupyter-cookiecutter). The service app was initially set up by Rafael Li Chen.
