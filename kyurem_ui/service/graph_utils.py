import configparser
import uuid
import traceback
import os
import json
import pandas as pd
# neo4j connection
from .neo4j_connection import NEO4J_Connection

class GRAPH_Utils:
    def __init__(self, neo4j_server_url):
        root_dir = os.getcwd()
        ini_path = os.path.join(root_dir,"app.ini")
        config = configparser.ConfigParser()
        config.read(ini_path)
        print(ini_path)
        try:
            #neo4j_server_url = config['NEO4J']['SERVER']
            neo4j_user = config['NEO4J']['USER']
            neo4j_pwd = config['NEO4J']['PWD']
            
            print('Connecting to neo4j server on {} with user {}...'.format(neo4j_server_url, neo4j_user))
            self.neo4j_conn = NEO4J_Connection(neo4j_server_url, neo4j_user, neo4j_pwd)
            print('Connected to neo4j server'.format(neo4j_server_url, neo4j_user))
        except Exception as exception:
            print('Connection to neo4j failed: {}'.format(exception))
            traceback.print_exc()

    def stop(self):
    	self.neo4j_conn.close()

    def get_UUID(self):
    	return uuid.uuid4().hex
    
    def get_df_UUID(self, key, a_dict):
    	if a_dict:
    		return a_dict[key]
    	uuid = self.get_UUID()
    	return uuid

    def get_node_attributes(self, node, row=None, column_index=None):
    	if "attributes" not in node.keys():
    		attributes = {}
    		for p in node['properties']:
    		    attributes[p['name']] = row[column_index[p['column_id']]]
    		return attributes
    	return node["attributes"]

    def generate_node_spec(self, node, row=None, column_index=None):
    	new_node = {}
    	new_node['label'] = node['label']
    	new_node['attributes'] = self.get_node_attributes(node, row, column_index)
    	new_node['attributes']['uuid'] = self.get_UUID()
    	return new_node

    def bulk_generate_relation_spec(self, relation, row):
    	spec = {}
    	if relation is not None and 'attributes' in relation:
    		for attribute in relation['attributes']:
    		    if 'is_dataset_column' in attribute and attribute['is_dataset_column']:
    		        spec[attribute['name']] = row[attribute['column_id']]
    		    elif 'is_extractor_attribute' in attribute and attribute['is_extractor_attribute']:
    		        for key, value in extractor_spec['attributes'].items():
    		            spec['extractor_{}'.format(key)] = value
    		    else:
    		        spec[attribute['key']] = attribute['value']
    	elif relation is None and row is None:
    		##TODO: handle and rewrite case
    		spec = {}
    	elif relation is None and 'properties' in row:
    		##TODO: add relation properties
    		spec = {}
    	return spec

    def add_metadata_node(self, node, additional_attributes=None):
    	attributes = self.get_node_attributes(node)
    	if additional_attributes:
    		attributes.update(additional_attributes)

    	existing_node = self.get_node(attributes, node['label'])
    	if existing_node is None:
    		transformed_node = self.generate_node_spec(node) 
    		self.add_node(transformed_node)
    		return transformed_node['attributes']['uuid']
    	else:
    		return existing_node['uuid']

	# Add a node
    def add_node(self, spec):
	    try:
	        self.neo4j_conn.create_node(spec['label'], spec['attributes'],False)
	    except Exception as exception:
	        print('Error creating node {}'.format(spec['label']))
	        print('Exceptaion details: {}'.format(exception))
	        traceback.print_exc()

	# Add relation between src and target node given uuids
    def add_relation(self, name, attribute, src_uuid, target_uuid):
	    try:
	        # Create a relation
	        if not self.neo4j_conn.has_relation_between(src_uuid, target_uuid, name):
	            # Also refer topic instance from answer span
	            self.neo4j_conn.create_relation(name, attribute, src_uuid, target_uuid)
	            # print(span)
	    except Exception as exception:
	        print('Error creating {} relation'.format(name))
	        print('Exceptaion details: {}'.format(exception))
	        traceback.print_exc()

	# get existing node
    def get_node(self, attributes, label):
	    try:
	        node = self.neo4j_conn.get_nodes_by_label_attributes(attributes, label, True)
	        return node
	    except Exception as exception:
	        print('Error getting node {}'.format(attributes))
	        print('Exceptaion details: {}'.format(exception))
	        traceback.print_exc()

	# create node index on attribute
    def create_index(self, label, attribute):
	    try:
	        self.neo4j_conn.create_index_on_node_property(label, attribute)
	    except Exception as exception:
	        print('Error creating index on node [{}] with property [{}]'.format(label, attribute))
	        print('Exceptaion details: {}'.format(exception))
	        traceback.print_exc()

	# bulk insert nodes
    def bulk_insert_nodes(self, label, on_attribute, rows, batch_size = 10000):
	    try:
	        self.neo4j_conn.bulk_create_nodes(label, on_attribute, rows, batch_size)
	    except Exception as exception:
	        print('Error bulk creating node {}'.format(label))
	        print('Exception details: {}'.format(exception))
	        traceback.print_exc()

    def bulk_insert_relations(self, name, source_label, source_attr, target_label, target_attr, rows, batch_size = 10000):
    	try:
    		self.neo4j_conn.bulk_create_relations(name, source_label, source_attr, target_label, target_attr, rows, batch_size)
    	except Exception as exception:
	        print('Error bulk creating relation {}'.format(name))
	        print('Exception details: {}'.format(exception))
	        traceback.print_exc()

    def ingest_metadata(self, metadata):
	    metadata_uuids = {} 
	    extractor_spec = {}
	    extraction_spec = {}
	    data_source_spec = {}
	    for node in metadata['nodes']:
	    	if node['label'] == 'DATASOURCE':
	    		data_source_spec = node
	    	if node['label'] == 'EXTRACTOR':
	    		extractor_spec = node
	    	if node['label'] == 'EXTRACTION':
	    		extraction_spec = node
	    		continue
	    	metadata_uuids[node['label']] = self.add_metadata_node(node)

	    addtional_extraction_attribute = {
	    									"source" : data_source_spec["attributes"]["name"], 
	    									"type" : data_source_spec["attributes"]["type"]}
	    metadata_uuids[extraction_spec['label']] = self.add_metadata_node(extraction_spec, addtional_extraction_attribute)
	    extraction_spec['attributes']['uuid'] = metadata_uuids[extraction_spec['label']]
	    for relation in metadata['relations']:
	        self.add_relation(relation['name'], self.bulk_generate_relation_spec(relation, None), metadata_uuids[relation['source']], metadata_uuids[relation['target']])
	    return (metadata_uuids, extraction_spec)
	
    def create_uuid_index(self, node, node_df, node_index_attr, renamed_cols):
        attribute = '' 
        if len(node['index']['column_ids']) != 1: #case 1: create uuid per row
	        attribute = 'uuid'
	        node_df['{}_uuid'.format(node['label'])] = [self.get_UUID() for _ in range(len(node_df.index))]
	        node_index_attr[node['label']] = {'column_id': '{}_uuid'.format(node['label'])}
        else:
	        attribute = node['index']['column_ids'][0]
	        node_index_attr[node['label']] = {'column_id': attribute}
	        unique_values = node_df[attribute].unique().tolist()
	        a_dict = {}
	        for uv in unique_values:
	            a_dict[uv] = self.get_UUID()
	        node_df['{}_uuid'.format(node['label'])] = node_df.apply (lambda row: self.get_df_UUID(row[attribute], a_dict), axis=1)

        if node['create_index']:
	        node_index_attr[node['label']]['renamed_col'] = renamed_cols[node_index_attr[node['label']]['column_id']]
	        self.create_index(node['label'], node_index_attr[node['label']]['renamed_col'])
        else:
	        node_index_attr[node['label']]['renamed_col'] = ''
        return (node_df, node_index_attr)

    def bulk_create_metadata_relations(self, args, node, node_df, node_index_attr, metadata_uuids, extraction_spec):
	    extraction_relation_df = node_df[[node_index_attr[node['label']]['renamed_col']]].copy()
	    extraction_relation_df['to'] = node_df.apply (lambda row: extraction_spec['attributes']['uuid'], axis=1)
	    extraction_relation_df.columns = ['from', 'to']
	    # TODO: allow properties with these metadata releations
	    extraction_relation_df['properties'] = [{"confidence" : 1} for _ in range(len(node_df.index))]
	    
	    self.bulk_insert_relations('HAS_EXTRACTION_TYPE', node['label'], node_index_attr[node['label']]['renamed_col'], extraction_spec['label'], 'uuid', extraction_relation_df.to_dict('records'), args.batch_size)
    
    def get_stat_by_node_label(self, skip_metadata=True):
        exclude_labels = []
        if skip_metadata:
            exclude_labels = self.get_metatadata_nodes()
        results = self.neo4j_conn.get_node_types()
        nodeTypeCount = {}
        for result in results:
            nodeType = result['nodeType'][0]
            if nodeType not in exclude_labels:
                nodeTypeCount[nodeType] = self.neo4j_conn.count_nodes_by_type(nodeType)
        return nodeTypeCount
    
    def get_stat_by_node_granularity(self, skip_list, by_label=True):
    	results = self.neo4j_conn.get_node_types()
    	nodeGranularityCount = {} 
    	node_property = 'type'
    	values = ['class', 'instance']
    	if not by_label:
    		for value in values:
    			nodeGranularityCount[value] = self.neo4j_conn.get_count_by_type_attribute_value(None, node_property, value)
    		return nodeGranularityCount

    	for result in results:
    		nodeType = result['nodeType'][0]
    		if nodeType not in skip_list:
    			nodeGranularityCount[nodeType] = {}
    			for value in values:
    				nodeGranularityCount[nodeType][value] = self.neo4j_conn.get_count_by_type_attribute_value(nodeType, node_property, value)
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

    	results = self.neo4j_conn.get_nodes_by_relation_and_type(source_label, source_filter, source_filter_value,dest_label, dest_filter, dest_filter_value, relation, return_node_type, count_node_type)

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
    
    def create_undirected_graph(self, graph_name, nodes, relation, relation_weight):
        relation_str = ('{'+
                        'similarity:{'+
                                'type: "' +relation+ '",'+
                                'orientation: "UNDIRECTED",'+
                                'properties:["' + relation_weight + '"]'+
                        '}}')

        query = 'CALL gds.graph.create("{}",{},{})'.format(graph_name, nodes, relation_str)
        return self.neo4j_conn.run_query_kh(query)

    def find_communities(self, graph_name, similarity_relation_types, sim_relation_property_name, node_name_property):
        query = ('CALL gds.louvain.stream("'+ graph_name +'",' + 
                 '{' +
                 'relationshipWeightProperty: "'+ sim_relation_property_name +'",' +
                 'relationshipTypes: ["'+ similarity_relation_types +'"]' +
                 '}) YIELD nodeId, communityId RETURN communityId, ' +
                 'collect(gds.util.asNode(nodeId).' + node_name_property +') as members')
        result = self.neo4j_conn.run_query_kh(query)
        result_list = json.loads(result)
        result_df = pd.DataFrame(result_list)
        #result_df['len'] = result_df['members'].str.len()
        #result_df = result_df.sort_values(by='len', ascending=False).drop(columns='len')
        return result_df

    def get_graph_edge_list(self, exclude_metagraph = False, include_labels = None):
        query = ('call apoc.meta.schema() ' + 
                 'YIELD value ' +
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
            edge_list.append({"source": source, "target": target, "weight": value, "label": _type})
        return pd.DataFrame(edge_list)