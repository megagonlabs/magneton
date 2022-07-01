import uuid, traceback, json
import pandas as pd
from .database import Database


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

    def get_stat_by_node_label(self, skip_metadata=True):
        exclude_labels = []
        if skip_metadata:
            exclude_labels = self.get_metatadata_nodes()
        results = self.neo4j_conn.get_node_types()
        nodeTypeCount = {}
        for result in results:
            nodeType = result['nodeType'][0]
            if nodeType not in exclude_labels:
                nodeTypeCount[nodeType] = self.neo4j_conn.count_nodes_by_type(
                    nodeType)
        return nodeTypeCount

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

    def get_children_stat_by_node_type(self, node_type):
        source_label = node_type
        source_filter = 'type'
        source_filter_value = 'class'

        dest_label = node_type
        dest_filter = 'type'
        dest_filter_value = 'instance'

        relation = 'specialization'

        return_node_type = 'source'
        count_node_type = 'dest'

        results = self.neo4j_conn.get_nodes_by_relation_and_type(
            source_label, source_filter, source_filter_value, dest_label,
            dest_filter, dest_filter_value, relation, return_node_type,
            count_node_type)

        compiled_results = {}

        key = 'src' if return_node_type == 'source' else 'dest'

        for result in results:
            compiled_results[result[key]['title']] = result['node_count'] + 1
        return dict(sorted(compiled_results.items(), key=lambda item: item[1]))

    def relation_count(self):
        results = self.neo4j_conn.get_per_relation_count()

        relation_dist = {}

        for result in results:
            relation_dist[result['relation']] = result['count']
        return dict(sorted(relation_dist.items(), key=lambda item: item[1]))

    def get_metatadata_nodes(self):
        #TODO: add a property to nodes "data_plane: {'meta_data','value_data'}"
        spec_path = '../../data/read_taxo.json'
        f = open(spec_path)
        json_spec = json.load(f)
        meta_nodes = json_spec['metadata']['nodes']
        meta_nodes_labels = [node['label'] for node in meta_nodes]
        return meta_nodes_labels

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
                            exclude_metagraph=False,
                            include_labels=None):
        query = ('call apoc.meta.schema() ' + 'YIELD value ' +
                 'UNWIND keys(value) AS key ' +
                 'RETURN key, value[key] AS value')
        results = self.neo4j_conn.run_query_kh(query)
        relation_dict = {}
        result_list = json.loads(results)
        exclude_labels = []
        if exclude_metagraph:
            exclude_labels = self.get_metatadata_nodes()
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
                "label": _type
            })
        return pd.DataFrame(edge_list)