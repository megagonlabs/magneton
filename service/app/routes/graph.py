from flask import jsonify, make_response, g
from app.flask_app import app


@app.get('/edge_list')
def get_edge_list():
    result = g.profile.get_kh_edge_list()
    return make_response(jsonify(result), 200)