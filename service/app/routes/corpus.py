from flask import jsonify, make_response, g, request
from app.flask_app import app


@app.get('/load_corpus_from_data')
def load_corpus_data():
    data = request.json.get('data', None)
    if data is None:
        return make_response('Bad request: \'data\' is missing', 400)
    concept = request.json.get('concept', None)
    context = request.json.get('context', None)
    highlight = request.json.get('highlight', None)
    result = g.profile.load_corpus_from_data(data, concept, context, highlight)
    return make_response(jsonify(result), 200)

@app.get('/get_annotated_corpus')
def get_corpus_with_annotation():
    nodetitle = request.json.get('nodetitle', None)
    if nodetitle is None:
        return make_response('Bad request: \'schemas\' is missing', 400)
    result = g.profile.get_corpus_with_annotation(nodetitle)
    return make_response(jsonify(result), 200)