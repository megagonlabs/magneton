import uuid, traceback, json
import pandas as pd
from .database import Database
from collections import defaultdict
import math
import random

class Graph:

    def __init__(self, uri, username, password):
        try:
            neo4j_user = username
            neo4j_pwd = password
            self.neo4j_conn = Database(uri, neo4j_user, neo4j_pwd)
        except Exception:
            raise Exception('Failed to connect to database.')

    def stop(self):
        self.neo4j_conn.close()

    def get_node_attributes(self, node, row=None, column_index=None):
        if "attributes" not in node.keys():
            attributes = {}
            for p in node['properties']:
                attributes[p['name']] = row[column_index[p['column_id']]]
            return attributes
        return node["attributes"]

# get existing node

    def get_node(self, attributes, label):
        try:
            node = self.neo4j_conn.get_nodes_by_label_attributes(
                attributes, label, True)
            return node
        except Exception as exception:
            print('Error getting node {}'.format(attributes))
            print('Exceptaion details: {}'.format(exception))
            traceback.print_exc()

    def get_stat_by_node_label(self):
        exclude_labels = []
        results = self.neo4j_conn.get_node_types()
        nodeTypeCount = {}
        metadata = {}
        for result in results:
            nodeType = result['nodeType'][0]
            if nodeType not in exclude_labels:
                countData = self.neo4j_conn.count_nodes_by_type(nodeType)
                nodeTypeCount[nodeType] = countData[0]['nodeCount']
                metadata[nodeType] = {
                    'node_label': nodeType,
                    'title': nodeType,
                    'uuid':countData[0]['n']['uuid']
                }
        return nodeTypeCount, metadata

    def get_stat_by_node_granularity(self, nodeType=None):
        nodeGranularityCount = {}
        node_property = 'type'
        values = ['class', 'instance']

        for value in values:
            if nodeType != 'all':
                nodeGranularityCount[
                    value] = self.neo4j_conn.get_count_by_type_attribute_value(
                        nodeType, node_property, value)
            else:
                nodeGranularityCount[
                    value] = self.neo4j_conn.get_count_by_type_attribute_value(
                            None, node_property, value)
        return nodeGranularityCount

    def get_children_stat_by_node_type(self, node):
        if node['node_type'] == 'all':
            return self.get_stat_by_node_label()

        source_label = node['node_type']
        source_filter = {}
        source_filter['type'] = 'class'
        source_filter[node['node_property']] = node['node_property_value']

        dest_label = node['node_type']
        dest_filter = {}
        dest_filter['type'] = 'instance'

        relation = 'specialization'

        return_node_type = 'source'
        count_node_type = 'dest'

        results = self.neo4j_conn.get_nodes_by_relation_and_type(
            source_label, source_filter, dest_label, dest_filter, 
            relation, return_node_type, count_node_type)

        compiled_results = {}

        key = 'src' if return_node_type == 'source' else 'dest'

        for result in results:
            compiled_results[result[key]['title']] = result['node_count'] + 1
        return dict(sorted(compiled_results.items(), key=lambda item: item[1]))

    def get_children_stat_by_node_type_v1(self, node):
        if node['node_type'] == 'all':
            return self.get_stat_by_node_label()

        source_label = node['node_type']
        source_filter = {}
        #source_filter['type'] = 'class'
        source_filter[node['node_property']] = node['node_property_value']

        dest_label = node['node_type']
        dest_filter = {}
        #dest_filter['type'] = 'instance'

        relation = 'specialization'

        return_node_type = 'dest'
        count_node_type = 'dest'

        # get the immediate children of a node
        immediate_children = self.neo4j_conn.get_nodes_by_relation_and_type(
            source_label, source_filter, dest_label, dest_filter, 
            relation, return_node_type, count_node_type)

        compiled_results = {}
        full_results = {}

        key1 = 'src' if return_node_type == 'source' else 'dest'

        # for each immediate children, get their children count
        for child in immediate_children:
            source_filter = {}
            source_filter[node['node_property']] = child[key1][node['node_property']]
            return_node_type = 'source'
            count_node_type = 'dest'
            results = self.neo4j_conn.get_nodes_by_relation_and_type(
                source_label, source_filter, dest_label, dest_filter, 
                relation, return_node_type, count_node_type)
            key2 = 'src' if return_node_type == 'source' else 'dest'

            for result in results:
                compiled_results[result[key2][node['node_property']]] = result['node_count'] + 1
                full_results[result[key2][node['node_property']]] = {
                    'node_label': source_label,
                    node['node_property']: result[key2][node['node_property']],
                    'uuid':result[key2]['uuid']
                }
        compiled_results = dict(sorted(compiled_results.items(), key=lambda item: item[1]))
        return compiled_results, full_results

    def relation_count(self):
        results = self.neo4j_conn.get_per_relation_count()

        relation_dist = {}

        for result in results:
            relation_dist[result['relation']] = result['count']
        return dict(sorted(relation_dist.items(), key=lambda item: item[1]))

    def get_node_degree_distributions(self, nodeType, node_property=None, node_property_value=None):
        results_in = self.neo4j_conn.get_node_degree_distribution(nodeType, 'in',
            node_property, node_property_value)
        results_out = self.neo4j_conn.get_node_degree_distribution(nodeType, 'out',
            node_property, node_property_value)
        relation_dist = {}

        temp_dict = {}
        for result in results_in:
            temp_dict[result['relation']] = result['count']

        in_ls = sorted(temp_dict.items(), key=lambda item: item[1])

        temp_dict = {}
        for result in results_out:
            temp_dict[result['relation']] = result['count']

        out_ls = sorted(temp_dict.items(), key=lambda item: item[1])

        for k,v in in_ls:
            relation_dist[k] = {'count':v, 'type':'in'}
        for k,v in out_ls:
            relation_dist[k] = {'count':v, 'type':'out'}
        return relation_dist

    def get_node_degree_distributions_v1(self, nodeType, node_property=None, node_property_value=None):
        results_in = self.neo4j_conn.get_node_degree_distribution(nodeType, 'in',
            node_property, node_property_value)
        results_out = self.neo4j_conn.get_node_degree_distribution(nodeType, 'out',
            node_property, node_property_value)
        relation_dist = {}
        relation_dist['in'] = []
        relation_dist['out'] = []

        temp_dict = {}
        for result in results_in:
            temp_dict[result['relation']] = result['count']

        in_ls = sorted(temp_dict.items(), key=lambda item: item[1])

        temp_dict = {}
        for result in results_out:
            temp_dict[result['relation']] = result['count']

        out_ls = sorted(temp_dict.items(), key=lambda item: item[1])

        for k,v in in_ls:
            relation_dist['in'].append({'label':k, 'count':v})
        for k,v in out_ls:
            relation_dist['out'].append({'label':k, 'count':v})
        return relation_dist

    def is_skippable(self, res, exclude_labels, include_labels):
        label_a = res['key']
        if include_labels is not None and label_a not in include_labels:
            return True
        if label_a in exclude_labels:
            return True
        if res['value']["type"] == 'relationship':
            return True
        return False

    def get_graph_edge_list(self,
                            include_labels=None):
        query = ('call apoc.meta.schema() ' + 'YIELD value ' +
                 'UNWIND keys(value) AS key ' +
                 'RETURN key, value[key] AS value')
        results = self.neo4j_conn.run_query_kh(query)
        relation_dict = {}
        result_list = json.loads(results)
        exclude_labels = []
        
        for res in result_list:
            if self.is_skippable(res, exclude_labels, include_labels):
                continue
            label_a = res['key']
            relationships = res['value']['relationships']
            for relation, properties in relationships.items():
                direction = properties['direction']
                labels = properties['labels']
                for label_b in labels:
                    if label_b in exclude_labels:
                        continue
                    if include_labels and label_b not in include_labels:
                        continue
                    if 'out' in direction:
                        key = (label_a, label_b, relation)
                        if key not in relation_dict:
                            relation_dict[key] = 1
                    else:
                        key = (label_b, label_a, relation)
                        if key not in relation_dict:
                            relation_dict[key] = 1
        edge_list = []
        for key, value in relation_dict.items():
            source, target, _type = key
            weight = value
            edge_list.append({
                "source": source,
                "target": target,
                "weight": value,
                "label": _type,
                "emphasis": "yes"
            })
        return edge_list

    def get_graph_edge_list_v1(self,
                            include_labels=None):
        query = ('call apoc.meta.schema() ' + 'YIELD value ' +
                 'UNWIND keys(value) AS key ' +
                 'RETURN key, value[key] AS value')
        results = self.neo4j_conn.run_query_kh(query)
        relation_dict = {}
        result_list = json.loads(results)
        exclude_labels = []
        
        for res in result_list:
            if self.is_skippable(res, exclude_labels, include_labels):
                continue
            label_a = res['key']
            relationships = res['value']['relationships']
            for relation, properties in relationships.items():
                direction = properties['direction']
                labels = properties['labels']
                for label_b in labels:
                    if label_b in exclude_labels:
                        continue
                    if include_labels and label_b not in include_labels:
                        continue
                    if 'out' in direction:
                        key = (label_a, label_b, relation)
                        if key not in relation_dict:
                            source_node = {'node_label': label_a,
                                           'node_property': 'title', 
                                           'node_property_value': label_a}
                            target_node = {'node_label': label_b,
                                           'node_property': 'title', 
                                           'node_property_value': label_b}
                            relation_dict[key] = {
                                                    'source':source_node,
                                                    'target':target_node
                                                }
                    else:
                        key = (label_b, label_a, relation)
                        if key not in relation_dict:
                            target_node = {'node_label': label_a,
                                           'node_property': 'title', 
                                           'node_property_value': label_a}
                            source_node = {'node_label': label_b,
                                           'node_property': 'title', 
                                           'node_property_value': label_b}
                            relation_dict[key] = {
                                                    'source':source_node,
                                                    'target':target_node
                                                }
        edge_list = []
        for key, value in relation_dict.items():
            source, target, _type = key
            edge_list.append({
                "source": value['source'],
                "target": value['target'],
                "weight": 1,
                "label": _type,
                "emphasis": "yes"
            })
        return edge_list

    def get_node_neighborhood_graph_summary(self, node):
        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.path.spanningTree(n, {' +
                 'relationshipFilter: "< | >",' +
                 'minLevel: 1,' +
                 'maxLevel: 1 }) ' +
                 'YIELD path ' + 
                 'WITH apoc.path.elements(path) AS elements ' +
                 'UNWIND range(0, size(elements)-2) AS index ' +
                 'WITH elements, index ' +
                 'WHERE index %2 = 0 ' +
                 'RETURN elements[index] AS source, ' +
                 'type(elements[index+1]) AS relation, ' + 
                 'elements[index+2] AS target'
                 )
        result_list = self.neo4j_conn.run_query(query)
        neighborhood_edge_list = []
        relation_dict = {}
        for res in result_list:
            try:
                relation_label = res['relation']
                source_node = {'node_label': res['source']['type'],
                                'node_property': node_property, 
                                'node_property_value': res['source'][node_property]}
                target_node = {'node_label': res['target']['type'],
                               'node_property': node_property, 
                               'node_property_value': res['target'][node_property]}

                neighborhood_edge_list.append({
                    "source": source_node,
                    "target": target_node,
                    "weight": 1,
                    "label": relation_label,
                    "emphasis": "yes"
                })
            except:
                print(res)
            
        relation_dist = self.get_node_degree_distributions_v1(node_label, 
            node_property, node_property_value)

        return {'schema':neighborhood_edge_list, 'relation_dist': relation_dist}

    def get_sampled_node_neighborhood_graph_summary(self, node, n_sample=25):
        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.path.spanningTree(n, {' +
                 'relationshipFilter: "< | >",' +
                 'minLevel: 1,' +
                 'maxLevel: 1 }) ' +
                 'YIELD path ' + 
                 'WITH apoc.path.elements(path) AS elements ' +
                 'UNWIND range(0, size(elements)-2) AS index ' +
                 'WITH elements, index ' +
                 'WHERE index %2 = 0 ' +
                 'RETURN elements[index] AS source, ' +
                 'type(elements[index+1]) AS relation, ' + 
                 'elements[index+2] AS target'
                 )
        result_list = self.neo4j_conn.run_query(query)
        neighborhood_edge_list = []
        neighborhood_edge_dict = defaultdict(list)
        relation_dict = {}
        for res in result_list:
            try:
                relation_label = res['relation']
                source_node = {'node_label': res['source']['type'],
                                'node_property': node_property, 
                                'node_property_value': res['source'][node_property]}
                target_node = {'node_label': res['target']['type'],
                               'node_property': node_property, 
                               'node_property_value': res['target'][node_property]}
                neighborhood_edge_dict[relation_label].append((source_node, target_node))
            except:
                print(res)
            
        relation_dist = self.get_node_degree_distributions_v1(node_label, 
            node_property, node_property_value)

        n_sample_drawn = math.ceil(n_sample / len(neighborhood_edge_dict.keys()))

        print(n_sample, n_sample_drawn)
        for key, value in neighborhood_edge_dict.items():
            edge_list = value
            n = min(n_sample_drawn, len(edge_list))
            random.shuffle(edge_list)
            edge_list = edge_list[0:n]

            for edge in edge_list:
                source_node, target_node = edge
                neighborhood_edge_list.append({
                            "source": source_node,
                            "target": target_node,
                            "weight": 1,
                            "label": key,
                            "emphasis": "yes"
                        })

        print(len(neighborhood_edge_list))
        print(neighborhood_edge_list)

        return {'schema':neighborhood_edge_list, 'relation_dist': relation_dist}

    def get_node_neighborhood_schema(self, node):
        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.path.spanningTree(n, {' +
                 'relationshipFilter: "< | >",' +
                 'minLevel: 1,' +
                 'maxLevel: 1 }) ' +
                 'YIELD path ' + 
                 'WITH apoc.path.elements(path) AS elements ' +
                 'UNWIND range(0, size(elements)-2) AS index ' +
                 'WITH elements, index ' +
                 'WHERE index %2 = 0 ' +
                 'RETURN labels(elements[index]) AS source, ' +
                 'type(elements[index+1]) AS relation, ' + 
                 'labels(elements[index+2]) AS target')
        result_list = self.neo4j_conn.run_query(query)

        neighborhood_edge_list = []
        for res in result_list:
            source_labels = res['source']
            target_labels = res['target']
            relation_label = res['relation']

            for source in source_labels:
                for target in target_labels:
                    neighborhood_edge_list.append({
                        "source": source,
                        "target": target,
                        "weight": 1,
                        "label": relation_label,
                        "emphasis": "yes"
                    })
            
        return neighborhood_edge_list

    def get_node_neighborhood_summary(self, node):
        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.path.spanningTree(n, {' +
                 'relationshipFilter: "< | >",' +
                 'minLevel: 1,' +
                 'maxLevel: 1 }) ' +
                 'YIELD path ' + 
                 'WITH apoc.path.elements(path) AS elements ' +
                 'UNWIND range(0, size(elements)-2) AS index ' +
                 'WITH elements, index ' +
                 'WHERE index %2 = 0 ' +
                 'RETURN elements[index] AS source, ' +
                 'labels(elements[index]) AS source_labels, ' + 
                 'type(elements[index+1]) AS relation, ' + 
                 'elements[index+2] AS target,' +
                 'labels(elements[index+2]) AS target_labels'
                 )
        result_list = self.neo4j_conn.run_query(query)

        neighborhood_edge_list = []
        relation_dict = {}
        for res in result_list:
            source_labels = res['source_labels']
            source_name = res['source']
            target_labels = res['target_labels']
            target_name = res['target']
            relation_label = res['relation']

            for source in source_labels:
                for target in target_labels:
                    key = (source, target, relation_label)
                    if key not in relation_dict:
                        relation_dict[key] = 1
        for key, value in relation_dict.items():
            source, target, _type = key
            weight = value
            neighborhood_edge_list.append({
                "source": source,
                "target": target,
                "weight": value,
                "label": _type,
                "emphasis": "yes"
            })

        deephasized_edge_set = self.get_residual_edge_emphasis(relation_dict)

        for edge in deephasized_edge_set:
            source, target, _type = edge
            weight = 1
            neighborhood_edge_list.append({
                "source": source,
                "target": target,
                "weight": weight,
                "label": _type,
                "emphasis": "no"
            })

        relation_dist = self.get_node_degree_distributions(node_label, 
            node_property, node_property_value)

        return {'schema':neighborhood_edge_list, 'relation_dist': relation_dist}

    def get_residual_edge_emphasis(self, relation_dict):
        edge_set = set(relation_dict.keys())

        graph_edge_list = self.get_graph_edge_list()
        graph_edge_set = set()
        for edge in graph_edge_list:
            graph_edge_set.add((edge['source'], edge['target'], edge['label']))

        deephasized_edge_set = graph_edge_set.difference(edge_set)

        return deephasized_edge_set

    def get_relation_neighborhood_schema(self, node, relation):
        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']
        
        relationship_name = relation['type']
        direction = relation['direction']

        if direction == 'in':
            relation_param = "<" + relationship_name
        else:
            relation_param = relationship_name + ">"

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.neighbors.athop(n, "' + relation_param + '", 1) ' +
                 'YIELD node ' +
                 'RETURN node')
        #print(query)
        result_list = self.neo4j_conn.run_query(query)

        edge_list = []
        for res in result_list:
            if direction == 'in':
                source = res['node'][node_property] 
                target = node_property_value
            else:
                target = res['node'][node_property]
                source = node_property_value

            edge_list.append({
                "source": source,
                "target": target,
                "weight": 1,
                "label": relationship_name
            })
        return edge_list

    def get_relation_neighborhood_summary(self, node, relation):
        relationship_name = relation['type']
        if node is None:
            edge_list = []
            graph_edge_list = self.get_graph_edge_list()
            for edge in graph_edge_list:
                if relationship_name == edge['label']:
                    edge_list.append(edge)
                else:
                    edge['emphasis'] = 'no'
                    edge_list.append(edge)

            node_dict = defaultdict(set)
            query = ('MATCH (a)-[r:' + relationship_name + ']->(b)'+
                ' RETURN a.title as node_a, labels(a) as labels_a,'+
                ' b.title as node_b, labels(b) as labels_b')
            result_list = self.neo4j_conn.run_query(query)

            for res in result_list:
                labels_a = res['labels_a']
                labels_b = res['labels_b']
                for label in labels_a:
                    node_dict[label].add(res['node_a'])
                for label in labels_b:
                    node_dict[label].add(res['node_b'])
            node_dist = {}

            for key, value in node_dict.items():
                node_dist[key] = len(value)

            return {'schema':edge_list, 'node_dist': node_dist}

        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']
        
        direction = relation['direction']

        if direction == 'in':
            relation_param = "<" + relationship_name
        else:
            relation_param = relationship_name + ">"

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.neighbors.athop(n, "' + relation_param + '", 1) ' +
                 'YIELD node ' +
                 'RETURN node, labels(node) as node_labels')
        result_list = self.neo4j_conn.run_query(query)

        edge_list = []
        relation_dict = {}
        node_dist = defaultdict(int)
        for res in result_list:
            if direction == 'in':
                for label in res['node_labels']:
                    source = label 
                    target = node_label
                    key = (source, target, relationship_name)
                    if key not in relation_dict:
                        relation_dict[key] = 1
                    node_dist[res['node'][node_property]] += 1
            else:
                for label in res['node_labels']:
                    source = node_label 
                    target = label
                    key = (source, target, relationship_name)
                    if key not in relation_dict:
                        relation_dict[key] = 1
                    node_dist[res['node'][node_property]] += 1

        for key, value in relation_dict.items():
            source, target, _type = key
            weight = value
            edge_list.append({
                "source": source,
                "target": target,
                "weight": value,
                "label": _type,
                "emphasis": "yes"
            })

        deephasized_edge_set = self.get_residual_edge_emphasis(relation_dict)

        for edge in deephasized_edge_set:
            source, target, _type = edge
            weight = 1
            edge_list.append({
                "source": source,
                "target": target,
                "weight": weight,
                "label": _type,
                "emphasis": "no"
            })

        return {'schema':edge_list, 'node_dist': node_dist}

    def get_relation_neighborhood_graph_summary(self, node, relation):
        relationship_name = relation['type']
        if node is None:
            edge_list = []
            
            node_dict = defaultdict(set)
            query = ('MATCH (source)-[r:' + relationship_name + ']->(target)'+
                ' RETURN source,'+
                ' target')
            result_list = self.neo4j_conn.run_query(query)

            for res in result_list:
                source_node = {'node_label': res['source']['type'],
                                'node_property': 'title', 
                                'node_property_value': res['source']['title']}
                target_node = {'node_label': res['target']['type'],
                               'node_property': 'title', 
                               'node_property_value': res['target']['title']}
                weight = 1
                node_dict[source_node['node_label']].add(source_node['node_property_value'])
                node_dict[target_node['node_label']].add(target_node['node_property_value'])
                edge_list.append({
                    "source": source_node,
                    "target": target_node,
                    "weight": weight,
                    "label": relationship_name,
                    "emphasis": "yes"
                })
            node_dist = {}

            for key, value in node_dict.items():
                node_dist[key] = len(value)

            return {'schema':edge_list, 'node_dist': node_dist}

        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']
        
        direction = relation['direction']

        if direction == 'in':
            relation_param = "<" + relationship_name
        else:
            relation_param = relationship_name + ">"

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.neighbors.athop(n, "' + relation_param + '", 1) ' +
                 'YIELD node ' +
                 'RETURN node')
        result_list = self.neo4j_conn.run_query(query)

        edge_list = []
        relation_dict = {}
        
        for res in result_list:
            if direction == 'in':
                source_node = {'node_label': res['node']['type'],
                                'node_property': node_property, 
                                'node_property_value': res['node'][node_property]}
                target_node = node
                
                source = res['node'][node_property] 
                target = node_property_value
                key = (source, target, relationship_name)
                if key not in relation_dict:
                    relation_dict[key] = {
                                            'source':source_node,
                                            'target':target_node
                                        }
            else:
                source_node = node 
                target_node = {'node_label': res['node']['type'],
                                'node_property': node_property, 
                                'node_property_value': res['node'][node_property]}
                target = res['node'][node_property] 
                source = node_property_value
                key = (source, target, relationship_name)
                if key not in relation_dict:
                    relation_dict[key] = {
                                            'source':source_node,
                                            'target':target_node
                                        }

        for key, value in relation_dict.items():
            source, target, _type = key
            edge_list.append({
                "source": value['source'],
                "target": value['target'],
                "weight": 1,
                "label": _type,
                "emphasis": "yes"
            })

        return {'schema':edge_list, 'node_dist': {}}

    def get_sampled_relation_neighborhood_graph_summary(self, node, relation, n_sample=25):
        relationship_name = relation['type']
        if node is None:
            edge_list = []
            node_dict = defaultdict(set)
            query = ('MATCH (source)-[r:' + relationship_name + ']->(target)'+
                ' RETURN source,'+
                ' target')
            result_list = self.neo4j_conn.run_query(query)

            for res in result_list:
                source_node = {'node_label': res['source']['type'],
                                'node_property': 'title', 
                                'node_property_value': res['source']['title']}
                target_node = {'node_label': res['target']['type'],
                               'node_property': 'title', 
                               'node_property_value': res['target']['title']}
                weight = 1
                node_dict[source_node['node_label']].add(source_node['node_property_value'])
                node_dict[target_node['node_label']].add(target_node['node_property_value'])
                edge_list.append({
                    "source": source_node,
                    "target": target_node,
                    "weight": weight,
                    "label": relationship_name,
                    "emphasis": "yes"
                })
            node_dist = {}

            for key, value in node_dict.items():
                node_dist[key] = len(value)
            n_sample_drawn = min(n_sample, len(edge_list))
            random.shuffle(edge_list)
            sampled_edge_list = edge_list[0:n_sample_drawn]
            return {'schema':sampled_edge_list, 'node_dist': node_dist}

        node_label = node['node_label']
        node_property = node['node_property']
        node_property_value = node['node_property_value']
        
        direction = relation['direction']

        if direction == 'in':
            relation_param = "<" + relationship_name
        else:
            relation_param = relationship_name + ">"

        query = ('MATCH (n:' + node_label + ' {' + node_property + ':"' + 
                  node_property_value + '"}) ' +
                 'CALL apoc.neighbors.athop(n, "' + relation_param + '", 1) ' +
                 'YIELD node ' +
                 'RETURN node')
        result_list = self.neo4j_conn.run_query(query)

        edge_list = []
        relation_dict = defaultdict(list)
        
        for res in result_list:
            if direction == 'in':
                source_node = {'node_label': res['node']['type'],
                                'node_property': node_property, 
                                'node_property_value': res['node'][node_property]}
                target_node = node
                
                edge_list.append((source_node, target_node))
            else:
                source_node = node 
                target_node = {'node_label': res['node']['type'],
                                'node_property': node_property, 
                                'node_property_value': res['node'][node_property]}
                edge_list.append((source_node, target_node))

        for key, value in relation_dict.items():
            source, target, _type = key
            edge_list.append({
                "source": value['source'],
                "target": value['target'],
                "weight": 1,
                "label": _type,
                "emphasis": "yes"
            })
        n_sample_drawn = min(n_sample, len(edge_list))
        random.shuffle(edge_list)
        sampled_edge_list = []
        for i in range(n):
            source_node, target_node = edge_list[i]
            sampled_edge_list.append({
                "source": source_node,
                "target": target_node,
                "weight": 1,
                "label": relationship_name,
                "emphasis": "yes"
            })
        return {'schema':sampled_edge_list, 'node_dist': {}}