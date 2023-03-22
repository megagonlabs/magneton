🚧 WARNING: Magneton is still a work in progress and should not be used for production workloads. 🚧

# Magneton

A cookiecutter template for creating transparent, reusable, and customization widgets in computational notebooks. The template is adapted from [react-jupyter-cookiecutter](https://github.com/megagonlabs/react-jupyter-cookiecutter). Widgets embedded within computational notebooks are suitable for iterative data science workfows. However, these widgets lack robust state management capabilities and do not support user-defned customization of the interactive components. Magneton framework bridges these gaps by introducing a built-in interaction history tracker, a state-manager to maintain widget state history, and an action wrapper to enable on-demand customization of operations defined by widget developers.

![teasersecond_lbw_counter](https://user-images.githubusercontent.com/8811607/223864204-966e6b3e-c884-40e7-a3cc-52571efd5162.png)

The above figure provides a brief overview of `Magneton` features (counter clock-wise). (A) User instantiates a graph exploration widget from the notebook. (B) A multiple-coordinated view consisting of a graph schema and corresponding node (top) and relation (bottom) distribution components is displayed. (C) A customized widget displaying node distribution in alphabetic order --- (D) 
  user defines an initialization function `init()` to customize the sort order and passes it as a callback function during widget initialization. (E) User exports the widget state using the `export_data()` accessor function. 

# Getting Started

> Note: This template is not compatible with Jupyter Notebook v7. Specifically, requires `notebook<7` and `ipywidgets<8`

## First-Time Setup

### 1. Clone the repository

First, clone this repo with the following commands.

```sh
# Clone the repository from git
git clone git@github.com:rit-git/magneton.git

# cd into cloned repo
cd magneton
```

### 2a. Install dependencies (with pipenv already installed)

Next, install dependencies with the following commands.

> Recommended: use `pipenv` to simplify managing python packages and virtual environments. Read more [here](https://pipenv.pypa.io/en/latest/).

```sh
# Creates a virtual environment and installs idependencies
pipenv install --dev

# Install javascript dependencies
yarn install # or `npm install`
```

#### 2b. Install dependencies (If you are using Conda)

First, install ``pyenv``:
```sh
brew update
brew install pyenv
```

Then install ``pipenv``:
```sh
pipenv --python=$(conda run which python) --site-packages
```

Then repeat the steps in ``2a``.

### 3. (Optional) Rename your package

To rename your package, simply rename the `src/magneton` directory and replace `name = "magneton"` in `pyproject.toml`. Then, update the entry point and output of the base configuration in `webpack.config.ts` like so:

```ts
/** webpack.config.ts **/
/* ... */
const base: Configuration = {
    entry: "./src/your-package-name"
    /* ... */
    output: {
        /* ... */
        path: path.resolve(__dirname, "src/your-package-name"),
    }
    /* ... */
}
/* ... */
```

Finally, update the `NAME` constant in `src/your-package-name/core/idom_loader.py`.

## Building and Debugging

Use the following command to build the package to `dist`.

> Note that we use yarn/npm to build, which ensures that the JavaScript/TypeScript files are bundled before the python module is built from the `src` folder

```sh
# Build package for deployment
yarn build # or `npm run build`
```

To get started debugging, first run the following command to "install" your package. This creates a symlink to your source, allowing you to make changes that are reflected immediately without requiring a rebuild. Read more on how it works [here](https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs). This only needs to be done once.

```sh
# Install your package locally
pipenv run pip install -e .
```

Run the following command to re-bundle the TypeScript/JavaScript whenever there is a change.

```sh
# Watch files and bundle on change
yarn watch # or `npm run watch`
```

Finally, in a separate shell, start up a Jupyter Notebook instance with the following command and follow the instructions in the terminal to start testing your module in a notebook.

```sh
# Start Jupyter Notebook
pipenv run jupyter notebook
```

## Creating a Widget

Follow these steps to create a widget. Look at `src/widgets/PlaceHolder.py` and `src/widgets/PlaceHolder.tsx` for examples. For these steps, we will assume your widget is called `mywidget`.

### Create source files

Create a `mywidget.py` and a `mywidget.tsx` in `src/widgets` as follows. Note that these files can be placed anywhere, as long as they are exported properly: whenever a new widget is created, add `Export` references in `init.py` and `index.ts` for the respective python and typescript files. 

```
.
└── src
    └── widgets
        ├── mywidget.py
        └── mywidget.tsx
```

Checkout the implementation of the `PlaceHolder` widget for further details.

## Widget Examples

Once a widget such as the `PlaceHolder` is created, end-users can access and launch the widget as follow:

```python
from magneton import PlaceHolder

widget = PlaceHolder()
widget.show()
```

Following are some more concrete examples of widgets created with `Magneton` and their capabilities:

- Pre-defined widget: [View state-wise distribution](https://github.com/megagonlabs/magneton-examples/blob/main/notebooks/prebuilt_widget_example.ipynb)
- Customizable widgets: {[Single component](https://github.com/megagonlabs/magneton-examples/blob/main/notebooks/widget_example_custom_init.ipynb), [All components](https://github.com/rit-git/magneton-examples/blob/main/notebooks/widget_example_custom_all.ipynb)}
- Customize using GPT-3/ChatGPT-powered UDFs: {[GPT-3](https://github.com/megagonlabs/magneton-examples/blob/main/notebooks/gpt3-example.ipynb), [ChatGPT](https://github.com/rit-git/magneton-examples/blob/main/notebooks/chatGPT-example.ipynb)}

# Citation and Contact
For more details on the `Magneton` framework read our technical paper at [CHI 2023](https://doi.org/10.1145/3544549.3585807). Cite our work as follows: 
```
@inproceedings{magneton2023,
    author = {Choi, Frederick and Rahman, Sajjadur and Kim, Hannah and Zhang, Dan},
    title = {Towards Transparent, Reusable, and Customizable Data Science in Computational Notebooks},
    month = april,
    year = {2023},
    isbn = {9781450394222},
    publisher = {Association for Computing Machinery},
    address = {New York, NY, USA},
    booktitle = {Extended Abstracts of the 2023 CHI Conference on Human Factors in Computing Systems},
    url = {https://doi.org/10.1145/3544549.3585807},
    doi = {10.1145/3544549.3585807},
    articleno = {501},
    numpages = {8},
    location = {Hamburg, Germany},
    series = {CHI EA'23}
}
```

## Contact
To get help with problems using `Magneton` or replicating our results, please submit a GitHub issue.

For personal communication related to `Magneton`, please contact Sajjadur Rahman (sajjadur@megagon.ai).

# Disclosure

Embedded in, or bundled with, this product are open source software (OSS) components, datasets and other third party components identified below. The license terms respectively governing the datasets and third-party components continue to govern those portions, and you agree to those license terms, which, when applicable, specifically limit any distribution. You may receive a copy of, distribute and/or modify any open source code for the OSS component under the terms of their respective licenses. In the event of conflicts between Megagon Labs, Inc. Recruit Co., Ltd., license conditions and the Open Source Software license conditions, the Open Source Software conditions shall prevail with respect to the Open Source Software portions of the software. You agree not to, and are not permitted to, distribute actual datasets used with the OSS components listed below. You agree and are limited to distribute only links to datasets from known sources by listing them in the datasets overview table below. You are permitted to distribute derived datasets of data sets from known sources by including links to original dataset source in the datasets overview table below. You agree that any right to modify datasets originating from parties other than Megagon Labs, Inc. are governed by the respective third party’s license conditions. All OSS components and datasets are distributed WITHOUT ANY WARRANTY, without even implied warranty such as for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE, and without any liability to or claim against any Megagon Labs, Inc. entity other than as explicitly documented in this README document. You agree to cease using any part of the provided materials if you do not agree with the terms or the lack of any warranty herein. While Megagon Labs, Inc., makes commercially reasonable efforts to ensure that citations in this document are complete and accurate, errors may occur. If you see any error or omission, please help us improve this document by creating an [issue ticket]().

All dataset and code used within the product are listed below (including their copyright holders and the license conditions). For Datasets having different portions released under different licenses, please refer to the included source link specified for each of the respective datasets for identifications of dataset files released under the identified licenses.
