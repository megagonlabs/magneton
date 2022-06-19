from flask import Flask, g
from flask_cors import CORS
import os
from app.core.explorer import Explorer

import configparser

app = Flask(__name__)
APP_ENVIRONMENT = os.getenv('FLASK_ENV', 'production')
app.config['ENV'] = APP_ENVIRONMENT
CORS(app)

config = configparser.ConfigParser()
config.read('app.ini')
database_username = config['NEO4J']['USER']
database_password = config['NEO4J']['PWD']

explorer = Explorer(database_username, database_password)

from app.routes import distribution, profile