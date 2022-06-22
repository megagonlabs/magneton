from flask import jsonify, make_response, g
from app.flask_app import app


@app.get('/distributions/<type>')
def get_distribution(type: str):
    if type == 'node':
        result = g.profile.get_node_distribution()
        return make_response(jsonify(result), 200)