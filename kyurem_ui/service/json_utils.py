import json

import jsonpath_ng as jp
from jsonmerge import merge

### json utility functions
## jsonpath get
def json_query(json_object, json_path_query, single=True, default=None):

    jpq = jp.parse(json_path_query)
    match_values = [ m.value for m in jpq.find(json_object) ]

    r = match_values
    if single:
        r =  match_values[0] if match_values else None

    if r == None:
        if default == None:
            return r
        else:
            return default
    else:
        return r

def json_query_set(json_object, attribute, value, context='$'):
    jpq = jp.parse(context)
    matches = jpq.find(json_object)
    for match in matches:
        if match.context is None:
            json_object[attribute] = value
        else:
            if type(match.value) is not dict:
                raise Exception('context must be a dict')
            if type(match.path) is jp.Index:
                match.context.value[match.path.index][attribute] = value
            else:
                for field in match.path.fields:
                    match.context.value[field][attribute] = value


def json_query_add(json_object, attribute, value, context='$', single=True):
    json_query_update(json_object, attribute, lambda match : value, context=context, add=True, single=single)

def json_query_update(json_object, attribute, update_function, context='$', add=False, single=True):
    json_path_query = context + '.' + attribute
    jpq = jp.parse(json_path_query)
    matches = jpq.find(json_object)
    for match in matches:
        if type(match.path) is jp.Index:
            if add:
                match.context.value[match.path.index] = _add(match.context.value[match.path.index], update_function(match), single=single)
            else:
                match.context.value[match.path.index] = update_function(match)
        else:
            for field in match.path.fields:
                if add:
                    match.context.value[field] = _add(match.context.value[field], update_function(match), single=single)
                else:
                    match.context.value[field] = update_function(match)

def _add(target, value, single=True):
    t = target
    if type(target) is list:
        if type(value) is list:
            if single:
                return t + [value]
            else:
                return t + value
        else:
            if single:
                return t + [value]
            else:
                return t + [value]
                #raise Exception("{} is not a list".format(value))
    else:
        if type(value) is list:
            if single:
                for v in value:
                    t = t + v
                return t
                #raise Exception("{} cannot be added to {}".format(value, target))
            else:
                for v in value:
                    t = t + v
                return t
        else:
            if single:
                return t + value
            else:
                return t + value
                #raise Exception("{} is not a list".format(value))

def merge_json(original_json, update_json):
    return merge(original_json, update_json)

def union_jsonarray_by_attribute(json_array_a, json_array_b, attr):
    m = {}
    for o in json_array_a:
        m[o[attr]] = o
    for o in json_array_b:
        m[o[attr]] = o

    return list(m.values())

## flatten json
def flatten_json(json_object, separator='___', num_marker='$$$', flattenList=False):
    result = {}

    def _flatten_recursively(x, prefix=''):
        if type(x) is dict:
            for a in x:
                _flatten_recursively(x[a], prefix + a + separator)
        elif type(x) is list:
            if flattenList:
                i = 0
                for a in x:
                    _flatten_recursively(a, prefix + num_marker + str(i) + num_marker + separator)
                    i += 1
            else:
                result[prefix[:-len(separator)]] = x
        else:
            result[prefix[:-len(separator)]] = x

    _flatten_recursively(json_object)
    return result


def unflatten_json(json_object, separator='___', num_marker='$$$', unflattenList=False):
    result = {}
    for a in json_object:
        v = json_object[a]
        al = a.split(separator)
        r = result
        prev_r = None
        prev_ali = None
        for i in range(0,len(al)):
            ali = al[i]
            alix = _is_list_index(ali, num_marker)
            is_index = type(alix) == int

            if is_index:
                if unflattenList:
                    if type(r) is dict:
                        if prev_r is None:
                            result = []
                            r = []
                        else:
                            prev_r[prev_ali] = []
                            r = prev_r[prev_ali]
            if i == len(al) - 1:
                if is_index:
                    if unflattenList:
                        if alix >= len(r):
                            r = r + [None] * (alix - len(r) + 1)
                            prev_r[prev_ali] = r
                            if prev_r is None:
                                result = r

                r[alix] = v
            else:
                if is_index:
                    if unflattenList:
                        if alix < len(r):
                            if r[alix] == None:
                                r[alix] = {}
                        else:
                            r = r + [None] * (alix - len(r) + 1)
                            r[alix]= {}
                            if prev_r is None:
                                result = r
                            else:
                                prev_r[prev_ali] = r
                    else:
                        if alix not in r:
                            r[alix] = {}
                else:
                    if alix not in r:
                        r[alix] = {}
                prev_r = r
                prev_ali = alix
                r = r[alix]
    return result

def _is_list_index(s, num_marker='$$$'):
    try:
        if s[0:len(num_marker)] != num_marker or s[len(s)-len(num_marker):] != num_marker:
            return s
        else:
            s = s[len(num_marker):len(s)-len(num_marker)]
        x = int(s)
        if x >= 0:
            return x
        else:
            return s
    except ValueError:
        return s
