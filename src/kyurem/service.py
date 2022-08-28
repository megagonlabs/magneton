import sys
import base64
import json
from .helpers import get_request, post_request
from .constants import SERVICE_ENDPOINTS


class Service:

    def __init__(self, kh=None, host=None):
        if kh is None:
            raise Exception('kh name can not be None.')
        if host is None:
            self.host = 'http://127.0.0.1'
        else:
            self.host = host
        self.kh = kh

    def get_service_endpoint(self, key):
        return self.host + ':5000' + SERVICE_ENDPOINTS.get(key, '')

    def get_base_payload(self):
        return {'database_name': self.kh}

    def get_node_distribution(self):
        path = self.get_service_endpoint('get_node_distribution')
        payload = self.get_base_payload()
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_node_degree_distributions(self, nodetype):
        path = self.get_service_endpoint('get_node_degree_distribution').format(
            nodetype=nodetype)
        payload = self.get_base_payload()
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_relation_distribution(self):
        path = self.get_service_endpoint('get_relation_distribution')
        payload = self.get_base_payload()
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_node_granularity_distribution(self, node_type=None):
        if node_type is None:
            nodetype = 'all'
        else:
            nodetype = node_type
        path = self.get_service_endpoint('get_node_granularity_distribution').format(
            nodetype=nodetype)
        payload = self.get_base_payload()
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_children_node_distributions(self, node=None):
        path = self.get_service_endpoint('get_children_node_distributions')
        payload = self.get_base_payload()

        if node:
            payload['node'] = node
        else:
            payload['node'] = {'node_label':'all'}

        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_kh_edge_list(self):
        path = self.get_service_endpoint('get_edge_list')
        payload = self.get_base_payload()
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_node_neighborhood(self, node):
        path = self.get_service_endpoint('get_node_neighborhood')
        payload = self.get_base_payload()
        payload['node'] = node
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_relation_neighborhood(self, node, relation):
        path = self.get_service_endpoint('get_relation_neighborhood')
        payload = self.get_base_payload()
        payload['node'] = node
        payload['relation'] = relation
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def load_corpus_from_path(self, server_path=None, 
                              concept=None, context=None, highlight=None):
        df = pd.read_csv(server_path)
        data = df.to_dict('records')
        return self.load_corpus(data, concept, context, highlight)

    def load_corpus(self, data, concept=None, context=None, highlight=None):
        path = self.get_service_endpoint('load_corpus_from_data')
        payload = self.get_base_payload()
        payload['data'] = data
        if concept:
            payload['concept'] = concept
        if context:
            payload['context'] = context
        if highlight:
            payload['highlight'] = highlight
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_annotated_corpus(self, node=None):
        path = self.get_service_endpoint('get_annotated_corpus')
        payload = self.get_base_payload()
        if node and node['node_property'] == 'title':
            payload['nodetitle'] = node['node_property_value']
        else:
            payload['nodetitle'] = '*'
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def load_merge_data_from_path(self, server_path=None, 
                              entity=None, node_uuid=None, node_title=None):
        df = pd.read_csv(server_path)
        data = df.to_dict('records')
        return self.load_corpus(data, entity, node_uuid, node_title)

    def load_merge_data(self, data, entity=None, node_label=None, node_uuid=None, node_title=None):
        path = self.get_service_endpoint('load_merge_data')
        payload = self.get_base_payload()
        payload['data'] = data
        if entity:
            payload['entity'] = entity
        if node_label:
            payload['node_label'] = node_label
        if node_uuid:
            payload['node_uuid'] = node_uuid
        if node_title:
            payload['node_title'] = node_title
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result