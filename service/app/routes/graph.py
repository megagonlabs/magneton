from flask import jsonify, make_response, g, request
from app.flask_app import app

@app.get('/edge_list')
def get_edge_list():
    result = g.profile.get_kh_edge_list()
    return make_response(jsonify(result), 200)

@app.get('/node_neighborhood')
def get_node_neighborhood():
    node = request.json.get('node', None)
    if node is None:
        return make_response('Bad request: \'schemas\' is missing', 400)
    result = g.profile.get_node_neighborhood(node)
    return make_response(jsonify(result), 200)

@app.get('/relation_neighborhood')
def get_relation_neighborhood():
    node = request.json.get('node', None)
    relation = request.json.get('relation', None)
    if relation is None:
        return make_response('Bad request: \'schemas\' is missing', 400)
    result = g.profile.get_relation_neighborhood(node, relation)
    return make_response(jsonify(result), 200)