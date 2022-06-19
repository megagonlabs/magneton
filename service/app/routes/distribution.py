import json
from flask import jsonify, make_response, g, request
from app.flask_app import app
from app.constants import DATABASE_503_RESPONSE

@app.route('/distribution', methods=['POST'])
def get_distribution():
    _type = request.json.get('_type', None)
    neo4j_server_url = request.json.get('neo4j_server_url', None)
    if _type is None:
        return make_response('Bad request: \'_type\' is missing', 400)
    if neo4j_server_url is None:
        return make_response('Bad request: \'neo4j server url\' is missing', 400)
    result = g.explorer.get_distribution(_type, neo4j_server_url)
    result_type = type(result)
    if result_type is list:
        return make_response(jsonify(result), 400)
    elif result_type is dict:
        return make_response(jsonify(result), 200)
    elif result_type is bool:
        return DATABASE_503_RESPONSE