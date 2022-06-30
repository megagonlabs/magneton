import requests
from requests.adapters import HTTPAdapter
from urllib3 import Retry
from kyurem_client.constants import REQUEST_TIMEOUT_SECONDS


def requests_retry_session(
        retries=0,
        backoff_factor=0.3,
        status_forcelist=(500, 502, 504),
        session=None,
):
    session = session or requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session


def get_request(path=None, json=None):
    if path is None or json is None:
        raise ValueError(
            "get_request(): Both 'path' and 'json' cannot be None.")
    try:
        return requests_retry_session().get(path,
                                            json=json,
                                            timeout=REQUEST_TIMEOUT_SECONDS)
    except requests.ConnectTimeout as ex:
        raise Exception('{}: {}'.format(ex.__class__.__name__,
                                        '408 Request Timeout'))


def post_request(path=None, json=None):
    if path is None or json is None:
        raise ValueError(
            "post_request(): Both 'path' and 'json' cannot be None.")
    try:
        return requests_retry_session().post(path,
                                             json=json,
                                             timeout=REQUEST_TIMEOUT_SECONDS)
    except requests.ConnectTimeout as ex:
        raise Exception('{}: {}'.format(ex.__class__.__name__,
                                        '408 Request Timeout'))