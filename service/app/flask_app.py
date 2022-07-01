from flask import Flask, g, make_response, request
from flask_cors import CORS
import os, json, boto3, base64
from app.core.explorer import Explorer
from app.constants import KNOWLEDGE_HUB_CLUSTER_REGION, SERVER_ERROR_500_RESPONSE
import app.core.utils.boto3 as boto3_utils

app = Flask(__name__)
APP_ENVIRONMENT = os.getenv('FLASK_ENV', 'production')
if os.path.exists('neo4j_cred.json') or os.path.exists('aws_cred.json'):
    APP_ENVIRONMENT = 'development'
app.config['ENV'] = APP_ENVIRONMENT
CORS(app)

database_username = os.getenv('NEO4J_USERNAME', None)
database_password = os.getenv('NEO4J_PASSWORD', None)
knowledge_hub_cluster_ARN = os.getenv('cluster_ARN', "")
if os.path.exists('neo4j_cred.json'):
    neo4j_cred_file = open('neo4j_cred.json')
    neo4j_cred_json = json.load(neo4j_cred_file)
    neo4j_cred_file.close()
    database_username = neo4j_cred_json['username']
    database_password = neo4j_cred_json['password']
    knowledge_hub_cluster_ARN = neo4j_cred_json['cluster_ARN']
if database_username is None or len(database_username.strip()) == 0:
    raise ValueError('"database_username" can not be None or empty.')
elif database_password is None or len(database_password.strip()) == 0:
    raise ValueError('"database_password" can not be None or empty.')
aws_cred_json = ''
if os.path.exists('aws_cred.json'):
    aws_cred_file = open('aws_cred.json')
    aws_cred_json = json.load(aws_cred_file)
    aws_cred_file.close()
else:
    aws_cred_json = json.loads(base64.b64decode(os.getenv('AWS_ENV_CRED', '')))
aws = boto3.Session(aws_access_key_id=aws_cred_json['access_key_id'],
                    aws_secret_access_key=aws_cred_json['secret_access_key'],
                    region_name=KNOWLEDGE_HUB_CLUSTER_REGION)
ecs = aws.client('ecs', region_name=KNOWLEDGE_HUB_CLUSTER_REGION)
explorer = Explorer(database_username, database_password)


@app.before_request
def jwt_verification():
    pass


@app.before_request
def check_profile():
    global explorer, ecs
    database_name = request.json.get('database_name', None)
    if database_name is None or len(database_name.strip()) == 0:
        return make_response(
            'Bad request: "database_name" can not be None or empty.', 400)
    # get database URI by searching on AWS cluster with the name parameter
    if explorer.has_profile(database_name=database_name):
        g.profile = explorer.get_profile(database_name)
    else:
        database_uri = ''
        try:
            service_name = boto3_utils.get_ecs_service_name_with_tag(
                ecs=ecs,
                cluster=knowledge_hub_cluster_ARN,
                tag={'KB_DB_NAME': database_name})
            database_uri = boto3_utils.get_task_ip(
                ecs=ecs,
                cluster=knowledge_hub_cluster_ARN,
                service_name=service_name,
                env=APP_ENVIRONMENT,
                aws=aws)
        except Exception as ex:
            return SERVER_ERROR_500_RESPONSE(app.config.get('ENV'), ex)
        if database_uri is None or len(database_uri.strip()) == 0:
            return make_response(
                'Bad request: \"{}\" does not exist.'.format(database_name))
        g.profile = explorer.get_profile(database_name,
                                         database_uri=database_uri)


from app.routes import distribution
from app.routes import graph