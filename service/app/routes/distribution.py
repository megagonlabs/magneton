from flask import jsonify, make_response, g, request
from app.flask_app import app


@app.get('/distributions/<type>')
def get_distribution(type: str):
    if type == 'node':
        result = g.profile.get_node_distribution()
        return make_response(jsonify(result), 200)
    if type == 'relation':
        result = g.profile.get_relation_distribution()
        return make_response(jsonify(result), 200)

@app.get('/granularity_distributions/<nodetype>')
def get_node_granularity_distributions(nodetype: str):
    result = g.profile.get_node_granularity_distributions(nodetype)
    return make_response(jsonify(result), 200)

@app.get('/children_distributions')
def get_node_children_node_distributions():
    node = request.json.get('node', None)
    if node is None:
        return make_response('Bad request: \'node schemas\' is missing', 400)
    result = g.profile.get_children_node_distributions(node)
    return make_response(jsonify(result), 200)

@app.get('/degree_distributions/<nodetype>')
def get_node_degree_distributions(nodetype: str):
    result = g.profile.get_node_degree_distributions_v1(nodetype)
    return make_response(jsonify(result), 200)