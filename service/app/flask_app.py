from flask import Flask, g, make_response, request
from flask_cors import CORS
import os
from app.core.explorer import Explorer

app = Flask(__name__)
APP_ENVIRONMENT = os.getenv('FLASK_ENV', 'production')
app.config['ENV'] = APP_ENVIRONMENT
CORS(app)

database_username = os.getenv('NEO4J_USERNAME', None)
database_password = os.getenv('NEO4J_PASSWORD', None)
if database_username is None or len(database_username.strip()):
    raise ValueError('"database_username" can not be None or empty.')
elif database_password is None or len(database_password.strip()):
    raise ValueError('"database_password" can not be None or empty.')

explorer = Explorer(database_username, database_password)


@app.before_request
def jwt_verification():
    pass


@app.before_request
def check_profile():
    g.explorer = explorer
    database_name = request.json.get('database_name', None)
    if database_name is None or len(database_name.strip()):
        return make_response('Bad request: "database_name" is missing.', 400)
    g.profile = explorer.get_profile(database_name)


from app.routes import distribution