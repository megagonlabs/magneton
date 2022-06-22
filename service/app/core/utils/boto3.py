def get_ecs_service_name_with_tag(ecs=None, cluster: str = '', tag: dict = {}):
    if ecs is None:
        raise Exception('"ecs" can not be None.')
    elif type(cluster) is not str:
        raise ValueError('"cluster" can only be str type.')
    tag_name = ''
    tag_value = ''
    for key in tag:
        tag_name = key
        tag_value = tag[tag_name]
        break
    serviceArn_list = ecs.list_services(cluster=cluster, launchType='FARGATE')
    next_token = serviceArn_list['nextToken']
    serviceArns = serviceArn_list['serviceArns']
    service_name = None
    while len(serviceArns) > 0:
        # fetch descriptions for all services in the list
        service_descriptions_list = ecs.describe_services(
            cluster=cluster, services=serviceArns,
            include=['TAGS'])['services']
        for service_info in service_descriptions_list:
            tags_list = service_info['tags']
            for tag_item in tags_list:
                if tag_item['key'] == tag_name and tag_item[
                        'value'] == tag_value:
                    service_name = service_info['serviceName']
                    break
        serviceArns = []
        # fetch more using next_token
        if next_token is not None:
            serviceArn_list = ecs.list_services(cluster=cluster,
                                                launchType='FARGATE',
                                                nextToken=next_token)
            serviceArns = serviceArn_list['serviceArns']
            if 'nextToken' in serviceArn_list:
                next_token = serviceArn_list['nextToken']
            else:
                next_token = None
    return service_name


def get_task_ip(ecs=None,
                aws=None,
                cluster: str = '',
                service_name: str = '',
                env: str = 'production'):
    if ecs is None:
        raise Exception('"ecs" can not be None.')
    elif type(cluster) is not str:
        raise ValueError('"cluster" can only be str type.')
    task_list = ecs.list_tasks(cluster=cluster,
                               serviceName=service_name,
                               desiredStatus='RUNNING',
                               launchType='FARGATE')
    task_ARNs = task_list.get('taskArns', [])
    task_description = ecs.describe_tasks(cluster=cluster, tasks=task_ARNs)
    task_description_list = task_description.get('tasks')
    task = task_description_list[0]
    container = task.get('containers')[0]
    network_interface = container.get('networkInterfaces')[0]
    private_ip = network_interface['privateIpv4Address']
    attachmentId = network_interface['attachmentId']
    # test/development environment requires public IP for the neo4j database
    if env == 'development' or env == 'test':
        attachments = task.get('attachments', [])
        networkInterfaceId = None
        for attachment in attachments:
            if attachment['id'] == attachmentId:
                for detail in attachment['details']:
                    if detail['name'] == 'networkInterfaceId':
                        networkInterfaceId = detail['value']
        if networkInterfaceId is not None:
            eni = aws.resource('ec2').NetworkInterface(networkInterfaceId)
            return eni.association_attribute['PublicIp']
    return private_ip