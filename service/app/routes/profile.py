import json
from flask import jsonify, make_response, g, request
from app.flask_app import app
from app.constants import DATABASE_503_RESPONSE

@app.route('/profile', methods=['GET'])
def set_profile():
    neo4j_server_url = request.json.get('neo4j_server_url', None)
    if neo4j_server_url is None:
        return make_response('Bad request: \'neo4j server url\' is missing', 400)
    result = g.explorer.set_profile(neo4j_server_url)
    result_type = type(result)
    if result_type is list:
        return make_response(jsonify(result), 400)
    elif result_type is dict:
        return make_response(jsonify(result), 200)
    elif result_type is bool:
        return DATABASE_503_RESPONSE