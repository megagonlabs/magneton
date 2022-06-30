import sys
import base64
import json
from kyurem_client.helpers import get_request, post_request
from kyurem_client.constants import SERVICE_ENDPOINTS


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

    def get_relation_distribution(self):
        path = self.get_service_endpoint('get_relation_distribution')
        payload = self.get_base_payload()
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result

    def get_node_granularity_distribution(self, node_type):
        path = self.get_service_endpoint('get_node_granularity_distribution').format(
            nodetype=node_type)
        payload = self.get_base_payload()
        response = get_request(path, json=payload)
        if response.status_code == 200:
            parsed_result = response.json()
        else:
            raise Exception(response.text)
        return parsed_result