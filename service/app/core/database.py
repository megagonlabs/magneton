# neo4j
import neo4j, copy, logging, traceback, json
from time import sleep, time
import app.core.utils.json as json_utils
import json


def _safe_neo4j_attribute_value(val):
    if val is None:
        return '"none"'
    elif type(val) is str:
        return '"' + val + '"'
    else:
        return str(val)


class Database:

    def __init__(self, server_url, user, pwd, num_tries=5, try_delay=20):
        self.server_url = server_url

        # Create logger
        self.logger = logging.getLogger('neo4j_connection')
        self.logger.setLevel(logging.DEBUG)

        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter('%(asctime)-15s %(levelname)-8s %(message)s'))
        if not len(self.logger.handlers):
            self.logger.addHandler(handler)

        # Initialize connection
        self.server_url = server_url
        self.user = user
        self.pwd = pwd
        self._initialize_connection(num_tries=num_tries, try_delay=try_delay)

    def _initialize_connection(self, num_tries=5, try_delay=2):
        last_exception = None

        for i in range(num_tries):
            try:
                self.neo4j_db = neo4j.GraphDatabase.driver(self.server_url,
                                                           auth=(self.user,
                                                                 self.pwd),
                                                           encrypted=False)
            except Exception as exception:
                self.logger.error(
                    'Connection to neo4j failed: {}'.format(exception))
                traceback.print_exc()
                last_exception = exception
                self.logger.error('Will try again...')
                sleep(try_delay)
                self.logger.error(
                    'Failed to connect to to neo4j client. Trying again ({}/{})'
                    .format(i + 1, num_tries))
                continue
            else:
                break
        else:
            self.logger.error('Failed to connect to to neo4j. Giving up!!!')
            raise last_exception

    def close(self):
        if self.neo4j_db is not None:
            print('Closing neo4j server')
            self.neo4j_db.close()

    def query(self, query, parameters=None, db=None):
        assert self.neo4j_db is not None, "Driver not initialized!"
        session = None
        response = None
        try:
            session = self.neo4j_db.session(
                database=db) if db is not None else self.neo4j_db.session()
            response = list(session.run(query, parameters))
        except Exception as e:
            print("Query failed:", e)
        finally:
            if session is not None:
                session.close()
        return response

    def create_index_on_node_property(self, label, attribute):
        # TODO: IF NOT EXISTS not supported in community edition
        self.query(
            'CREATE CONSTRAINT IF NOT EXISTS ON (n:{}) ASSERT n.{} IS UNIQUE'.
            format(label, attribute))

    def bulk_create_nodes(self, label, on_attribute, rows, batch_size):
        # Function to handle the updating the Neo4j database in batch mode.
        total = 0
        batch = 0
        start = time()
        result = None
        # print('start loading nodes {}'.format(label))

        query = ' UNWIND $rows AS row MERGE (n:' + label + '{' + on_attribute + ':row.' + on_attribute + '}) ON CREATE SET n += row SET n._created_on = datetime() SET n._modified_on = datetime() RETURN count(*) as total '

        while batch * batch_size < len(rows):
            res = self.query(query,
                             parameters={
                                 'rows':
                                 rows[batch * batch_size:(batch + 1) *
                                      batch_size]
                             })
            total += res[0]['total']
            batch += 1
        print('completed loading {} {} nodes in {} seconds'.format(
            total, label,
            time() - start))
        return query

    def bulk_create_relations(self, name, source_label, source_attr,
                              target_label, target_attr, rows, batch_size):
        # Function to handle the updating the Neo4j database in batch mode.
        total = 0
        batch = 0
        start = time()
        result = None
        print('start loading relation {}'.format(name))

        query = ' UNWIND $rows as row MATCH (from:' + source_label + ' {' + source_attr + ': row.from}) MATCH (to:' + target_label + ' {' + target_attr + ': row.to}) MERGE (from)-[rel:' + name + ']->(to) SET rel += row.properties SET rel._created_on = datetime() SET rel._modified_on = datetime() RETURN count(*) as total '
        while batch * batch_size < len(rows):
            res = self.query(query,
                             parameters={
                                 'rows':
                                 rows[batch * batch_size:(batch + 1) *
                                      batch_size]
                             })
            total += res[0]['total']
            batch += 1
        print('completed loading {} {} relation in {} seconds'.format(
            total, name,
            time() - start))
        return query

    def get_node_attribute_values(self, label, attribute):
        query = ' MATCH (n:' + label + ') RETURN n.' + attribute + ' as ' + attribute + ' '
        results = self.run_query(query)

        return results

    def get_node_attribute_values_no_relation(self, label, match_attribute,
                                              source_relation,
                                              extraction_label,
                                              extraction_relation,
                                              extractor_label, extractor):
        query = ' MATCH (n:' + label + ') WHERE NOT (n)<-[:' + source_relation + ']-(:' + extraction_label + ')-[:' + extraction_relation + ']->(:' + extractor_label + ' {uuid:"' + extractor[
            'uuid'] + '"}) RETURN n.' + match_attribute + ' as ' + match_attribute + ' '
        results = self.run_query(query)

        return results

    def get_nodes_by_condition(self, label, attribute, rows):
        query = ' UNWIND $rows as row MERGE (n:' + label + ' {' + attribute + ': row.' + attribute + '}) RETURN n '
        records = self.query(query, parameters={'rows': rows})

        results = []
        for record in records:
            items = record.items()
            result = {}
            for item in items:
                key = item[0]
                value = item[1]

                result[key] = self._toJSON(value)
            results.append(result)

        return results

    def get_filtered_group_by_sentiment(self, entity_node, entity_value,
                                        constaint_node,
                                        constraint_extraction_value,
                                        source_node, source_extraction_value):
        results = self.run_query((
            'MATCH (o:OPINION)<-[:HAS_OPINION]-(e:EXTRACTION {title:\'sampo_extraction\'})-[ef:EXTRACTED_FROM]->(r:REVIEW)-[oc:ON_COMPANY]-(c:COMPANY {name:\''
            + entity_value + '\'})'
        ) + (
            'MATCH (a:ASPECT)<-[:HAS_ASPECT]-(e:EXTRACTION {title:\'sampo_extraction\'})-[ef:EXTRACTED_FROM]->(r:REVIEW)-[oc:ON_COMPANY]-(c:COMPANY {name:\''
            + entity_value + '\'})') + ('Return a, o'))

        return results
        get_filtered_sentiment

    def get_filtered_sentiment(self, entity_node, entity_value, source_node,
                               source_extraction_value):
        results = self.run_query((
            'MATCH (o:OPINION)<-[:HAS_OPINION]-(e:EXTRACTION {title:\'sampo_extraction\'})-[ef:EXTRACTED_FROM]->(r:REVIEW)-[oc:ON_COMPANY]-(c:COMPANY {name:\''
            + entity_value + '\'})') + ('Return o'))

        return results

    def get_report(self):
        results = self.run_query((
            'MATCH (m:MODIFIER)<-[:HAS_MODIFIER]-(e:EXTRACTION {title:\'sampo_extraction\'})-[ef:EXTRACTED_FROM]->(r:REVIEW)-[oc:ON_COMPANY]-(c:COMPANY)'
        ) + (
            'MATCH (a:ASPECT)<-[:HAS_ASPECT]-(e:EXTRACTION {title:\'sampo_extraction\'})-[ef:EXTRACTED_FROM]->(r:REVIEW)-[oc:ON_COMPANY]-(c:COMPANY)'
        ) + (
            'Return c.id as item_id, r.review_id as review_id, a.title as aspect, m.title as modifier'
        ))

        return results

    def _read_transaction(self, *args, **kwargs):
        try:
            with self.neo4j_db.session() as session:
                result = session.read_transaction(*args, **kwargs)
            return result
        except BrokenPipeError as exception:
            try:
                self.logger.error(
                    'Connection to neo4j failed: {}'.format(exception))
                self.logger.error('Retring...')
                self._initialize_connection()
                with self.neo4j_db.session() as session:
                    result = session.read_transaction(*args, **kwargs)
                return result
            except Exception:
                return None

    def _write_transaction(self, *args, **kwargs):
        try:
            with self.neo4j_db.session() as session:
                result = session.write_transaction(*args, **kwargs)
            return result
        except BrokenPipeError as ex:
            try:
                self.logger.error('Connection to neo4j failed: {}'.format(ex))
                self.logger.error('Retring...')
                self._initialize_connection()
                with self.neo4j_db.session() as session:
                    result = session.write_transaction(*args, **kwargs)
                return result
            except Exception:
                return None

    ### helper functions
    def create_node(self,
                    type_,
                    attributes,
                    flatten=True,
                    flattenList=True,
                    agent_uuid=None):
        if flatten:
            attributes = json_utils.flatten_json(attributes,
                                                 flattenList=flattenList)

        node = self._write_transaction(self._create_node, type_, attributes,
                                       agent_uuid)

        if node is None:
            return None
        return self._node_toJSON(node)

    def _create_node(self, tx, t, d, agent_uuid=None):
        result = tx.run(' CREATE (n: ' + t + ') ' + ' '.join([
            'SET n.' + str(key) + ' = ' + (_safe_neo4j_attribute_value(d[key]))
            for key in list(d.keys())
        ]) + ' ' + ' SET n._created_on = datetime() ' +
                        ' SET n._modified_on = datetime() ' +
                        ('' if agent_uuid is None else
                         (' SET n._created_by = "' + agent_uuid + '"' +
                          ' SET n._modified_by = "' + agent_uuid + '" ')) +
                        ' RETURN n ')

        records = result.records()
        nodes = []
        for record in records:
            node = record.items()[0][1]
            return node
        return None

    def delete_node(self, uuid):
        self._write_transaction(self._delete_node, uuid)

    def _delete_node(self, tx, uuid):
        result = tx.run(' MATCH (n {uuid: "' + uuid + '"}) ' +
                        ' DETACH DELETE n ')
        return

    def set_node_attributes(self,
                            uuid,
                            attributes,
                            flatten=True,
                            flattenList=True,
                            agent_uuid=None):
        if flatten:
            attributes = json_utils.flatten_json(attributes,
                                                 flattenList=flattenList)
        node = self._write_transaction(self._set_node_attributes, uuid,
                                       attributes, agent_uuid)

        if node is None:
            return None
        return self._node_toJSON(node)

    def _set_node_attributes(self, tx, uuid, d, agent_uuid=None):
        result = tx.run(' MATCH (n {uuid:"' + uuid + '"}) ' + ' '.join([
            'SET n.' + str(key) + ' = ' + (_safe_neo4j_attribute_value(d[key]))
            for key in list(d.keys())
        ]) + ' ' + ' SET n._modified_on = datetime() ' +
                        ('' if agent_uuid is None else
                         (' SET n._modified_by = "' + agent_uuid + '" ')) +
                        ' RETURN n')
        records = result.records()
        nodes = []
        for record in records:
            node = record.items()[0][1]
            return node
        return None

    def set_node_attribute(self, uuid, attribute, value, agent_uuid=None):
        d = {}
        d[attribute] = value
        return self.set_node_attributes(uuid, d, agent_uuid)

    def set_node_state(self, uuid, state, agent_uuid=None):
        return self.set_node_attribute(uuid, 'state', state, agent_uuid)

    def has_node(self, uuid):
        return self.get_node(uuid) is not None

    def get_node(self, uuid):
        node = self._read_transaction(self._get_node, uuid)

        if node is None:
            return None
        return self._node_toJSON(node)

    def _get_node(self, tx, uuid):
        result = tx.run(' MATCH (n {uuid: "' + uuid + '"}) ' + ' RETURN n')
        records = result.records()
        nodes = []
        for record in records:
            node = record.items()[0][1]
            return node
        return None

    def has_node_type(self, uuid, type):
        attributes = {}
        attributes['uuid'] = uuid
        nodes = self.get_nodes_by_label_attributes(attributes,
                                                   label=type,
                                                   single=True)
        return len(nodes) > 0

    def has_node_type_creator(self, uuid, type, agent_uuid):
        attributes = {}
        attributes['uuid'] = uuid
        attributes['_created_by'] = agent_uuid
        nodes = self.get_nodes_by_label_attributes(attributes, label=type)
        return len(nodes) > 0

    def has_node_type_attributes(self, uuid, type, attributes):
        attributes['uuid'] = uuid
        nodes = self.get_nodes_by_label_attributes(attributes, label=type)
        return len(nodes) > 0

    def get_nodes_by_type(self,
                          type,
                          skip=None,
                          limit=None,
                          order_by=None,
                          order_dir='ASC'):
        attributes = {}
        nodes = self.get_nodes_by_label_attributes(attributes,
                                                   label=type,
                                                   skip=skip,
                                                   limit=limit,
                                                   order_by=order_by,
                                                   order_dir=order_dir)
        return nodes

    def get_nodes_by_type_name(self,
                               type,
                               name,
                               single=False,
                               skip=None,
                               limit=None):
        attributes = {}
        attributes['name'] = name
        nodes = self.get_nodes_by_label_attributes(attributes,
                                                   label=type,
                                                   single=single,
                                                   skip=skip,
                                                   limit=limit)
        return nodes

    def get_nodes_by_type_attribute_value(self,
                                          type,
                                          attribute,
                                          value,
                                          single=False,
                                          skip=None,
                                          limit=None):
        attributes = {}
        attributes[attribute] = value
        nodes = self.get_nodes_by_label_attributes(attributes,
                                                   label=type,
                                                   single=single,
                                                   skip=skip,
                                                   limit=limit)
        return nodes

    def get_count_by_type_attribute_value(self,
                                          type,
                                          attribute,
                                          value,
                                          single=False,
                                          skip=None,
                                          limit=None):
        attributes = {}
        attributes[attribute] = value
        nodes = self.get_nodes_by_label_attributes(attributes,
                                                   label=type,
                                                   single=single,
                                                   skip=skip,
                                                   limit=limit)
        return len(nodes)

    def get_nodes_by_type_creator(self,
                                  type,
                                  agent_uuid,
                                  single=False,
                                  skip=None,
                                  limit=None):
        attributes = {}
        attributes['_created_by'] = agent_uuid
        nodes = self.get_nodes_by_label_attributes(attributes,
                                                   label=type,
                                                   single=single,
                                                   skip=skip,
                                                   limit=limit)
        return nodes

    def get_nodes_by_label_attributes(self,
                                      attributes,
                                      label=None,
                                      single=False,
                                      skip=None,
                                      limit=None,
                                      order_by=None,
                                      order_dir='ASC'):
        nodes = self._read_transaction(self._get_node_by_label_attributes,
                                       attributes, label, skip, limit,
                                       order_by, order_dir)

        if single:
            if len(nodes) > 0:
                node = nodes[0]
                return self._node_toJSON(node)
            else:
                return None
        else:
            results = []
            for node in nodes:
                results.append(self._node_toJSON(node))
            return results

    def _get_node_by_label_attributes(self, tx, d, label, skip, limit,
                                      order_by, order_dir):
        result = tx.run((' MATCH (n {' if label is None else ('MATCH (n: ' +
                                                              label + ' {')) +
                        ', '.join([
                            str(key) + ':' +
                            (_safe_neo4j_attribute_value(d[key]))
                            for key in list(d.keys())
                        ]) + ' }) ' + ' RETURN n ' +
                        ('' if order_by is None else ' ORDER BY ' + 'n.' +
                         str(order_by) + ' ' +
                         ('' if order_dir == 'ASC' else 'DESC' + ' ')) +
                        ('' if skip is None else ' SKIP ' + str(skip) + ' ') +
                        ('' if limit is None else ' LIMIT ' + str(limit) +
                         ' '))

        records = result.records()
        nodes = []
        for record in records:
            node = record.items()[0][1]
            nodes.append(node)
        return nodes

    def create_relation(self,
                        relation,
                        attributes,
                        from_uuid,
                        to_uuid,
                        flatten=True,
                        flattenList=True,
                        agent_uuid=None):
        if flatten:
            attributes = json_utils.flatten_json(attributes,
                                                 flattenList=flattenList)

        rel = self._write_transaction(self._create_relation, relation,
                                      attributes, from_uuid, to_uuid,
                                      agent_uuid)

        if rel is None:
            return None
        return self._rel_toJSON(rel)

    def _create_relation(self,
                         tx,
                         relation,
                         d,
                         from_uuid,
                         to_uuid,
                         agent_uuid=None):
        result = tx.run(' MATCH (from {uuid: "' + from_uuid + '"})' + ', ' +
                        '(to {uuid: "' + to_uuid + '"}) ' +
                        ' CREATE (from) - [r: ' + relation + '] -> (to) ' +
                        ' '.join([
                            'SET r.' + str(key) + ' = ' +
                            (_safe_neo4j_attribute_value(d[key]))
                            for key in list(d.keys())
                        ]) + ' ' + ' SET r._created_on = datetime() ' +
                        ' SET r._modified_on = datetime() ' +
                        ('' if agent_uuid is None else
                         (' SET r._created_by = "' + agent_uuid + '"' +
                          ' SET r._modified_by = "' + agent_uuid + '" ')) +
                        ' RETURN r ')
        records = result.records()
        rels = []
        for record in records:
            rel = record.items()[0][1]
            return rel
        return None

    def delete_relation(self, relation, from_uuid, to_uuid):
        self._write_transaction(self._delete_relation, relation, from_uuid,
                                to_uuid)

    def _delete_relation(self, tx, relation, from_uuid, to_uuid):
        result = tx.run(' MATCH (from {uuid: "' + from_uuid + '"})' + ', ' +
                        '(to {uuid: "' + to_uuid + '"}) ' + ', ' +
                        ' (from) - [r: ' + relation + '] -> (to) ' +
                        ' DELETE r ')
        return

    def has_relation_between(self, from_uuid, to_uuid, relation=None):
        relations = self.get_relations_between(from_uuid,
                                               to_uuid,
                                               relation=relation)
        return len(relations) > 0

    def get_relations_between(self, from_uuid, to_uuid, relation=None):
        rels = self._read_transaction(self._get_relations_between, from_uuid,
                                      to_uuid, relation)

        results = []
        for rel in rels:
            results.append(self._rel_toJSON(rel))
        return results

    def _get_relations_between(self, tx, from_uuid, to_uuid, relation):
        result = tx.run(' MATCH (from {uuid: "' + from_uuid + '"})' + ', ' +
                        '(to {uuid: "' + to_uuid + '"}) ' + ', ' +
                        ' (from) - ' +
                        (' [r] ' if relation is None else (' [r: ' + relation +
                                                           '] ')) +
                        '-> (to) ' + ' RETURN r')

        records = result.records()
        rels = []
        for record in records:
            rel = record.items()[0][1]
            rels.append(rel)
        return rels

    def set_relation_attributes(self,
                                relation,
                                attributes,
                                from_uuid,
                                to_uuid,
                                flatten=True,
                                flattenList=True,
                                agent_uuid=None):
        if flatten:
            attributes = json_utils.flatten_json(attributes,
                                                 flattenList=flattenList)
        rel = self._write_transaction(self._set_relation_attributes, relation,
                                      attributes, from_uuid, to_uuid,
                                      agent_uuid)

        if rel is None:
            return None
        return self._rel_toJSON(rel)

    def _set_relation_attributes(self,
                                 tx,
                                 relation,
                                 d,
                                 from_uuid,
                                 to_uuid,
                                 agent_uuid=None):
        result = tx.run(' MATCH (from {uuid: "' + from_uuid + '"})' + ', ' +
                        '(to {uuid: "' + to_uuid + '"}) ' + ', ' +
                        ' (from) - [r: ' + relation + '] -> (to) ' + ' '.join([
                            'SET r.' + str(key) + ' = ' +
                            (_safe_neo4j_attribute_value(d[key]))
                            for key in list(d.keys())
                        ]) + ' ' + ' SET r._modified_on = datetime() ' +
                        ('' if agent_uuid is None else
                         (' SET r._modified_by = "' + agent_uuid + '" ')) +
                        ' RETURN r')
        records = result.records()
        rels = []
        for record in records:
            rel = record.items()[0][1]
            return rel
        return None

    def get_nodes_by_relation(self,
                              uuid,
                              relation=None,
                              type=None,
                              single=False,
                              skip=None,
                              limit=None):
        nodes = self._read_transaction(self._get_nodes_by_relation, uuid,
                                       relation, type, skip, limit)

        if single:
            if len(nodes) > 0:
                node = nodes[0]
                return self._node_toJSON(node)
            else:
                return None
        else:
            results = []
            for node in nodes:
                results.append(self._node_toJSON(node))
            return results

    def _get_nodes_by_relation(self, tx, uuid, relation, t, skip, limit):
        result = tx.run(
            ' MATCH (n {uuid: "' + uuid + '"}), ' +
            (' (x), ' if t is None else ' (x: ' + t + '), ') + ' (n) - ' +
            (' [r] ' if relation is None else (' [r: ' + relation + '] ')) +
            ' - (x) ' + ' RETURN x ' +
            ('' if skip is None else ' SKIP ' + str(skip) + ' ') +
            ('' if limit is None else ' LIMIT ' + str(limit) + ' '))

        records = result.records()
        nodes = []
        for record in records:
            node = record.items()[0][1]
            nodes.append(node)
        return nodes

    def count_nodes_by_relation(self, uuid, relation=None, type=None):
        result = self._read_transaction(self._count_nodes_by_relation, uuid,
                                        relation, type)

        return result

    def _count_nodes_by_relation(self, tx, uuid, relation, t):
        result = tx.run(' MATCH (n {uuid: "' + uuid + '"}), ' +
                        (' (x), ' if t is None else ' (x: ' + t + '), ') +
                        ' (n) - ' +
                        (' [r] ' if relation is None else (' [r: ' + relation +
                                                           '] ')) + ' - (x) ' +
                        ' RETURN COUNT(x) ')

        records = result.records()
        for record in records:
            items = record.items()

            result = {}
            for item in items:
                key = item[0]
                value = item[1]

                return value

        return 0

    def get_node_types(self):
        result = self.run_query(
            ' MATCH (n) RETURN distinct labels(n) as nodeType')

        return result

    def count_nodes_by_type(self, type):
        result = self._read_transaction(self._count_nodes_by_type, type)

        return result

    def _count_nodes_by_type(self, tx, t):
        result = tx.run(' MATCH (n: ' + t + ' ) ' +
                        ' RETURN COUNT(n) as nodeCount')
        records = result.records()
        for record in records:
            items = record.items()

            result = {}
            for item in items:
                key = item[0]
                value = item[1]

                return value

        return 0

    def get_type_node(self, nodeType):
        query = (' MATCH (n: ' + nodeType +' {title:"' + nodeType +  '"})' +
                        ' RETURN n as node')
        return self.run_query(query, json_path_query=None, single=True)

    def get_nodes_by_relation_and_type(self, source_label, source_filter, dest_label,
                                       dest_filter, relation, return_type, count_type):
        result = self._read_transaction(self._get_nodes_by_relation_and_type,
                                        source_label, source_filter, dest_label,
                                        dest_filter, relation, return_type, count_type)

        return result

    def _get_nodes_by_relation_and_type(self, tx, source_label, source_filter, dest_label,
                                        dest_filter, relation, return_type, count_type):
        source_construct = '(src)'
        dest_construct = '(dest)'
        if source_label is not None and source_filter is not None:
            source_construct = '(src: ' + source_label + ' {' + ', '.join([ str(key) + ':' + ( _safe_neo4j_attribute_value(source_filter[key]) ) for key in list(source_filter.keys())]) + '})'
        elif source_label is not None and source_filter is None:
            source_construct = '(src: ' + source_label + ')'
        elif source_label is None and source_filter is None:
            source_construct = source_construct
        else:
            print("no source specified!!!")

        if dest_label is not None and dest_filter is not None:
            dest_construct = '(dest: ' + dest_label + ' {' + ', '.join([ str(key) + ':' + ( _safe_neo4j_attribute_value(dest_filter[key]) ) for key in list(dest_filter.keys())]) + '})'
        elif dest_label is not None and dest_filter is None:
            dest_construct = '(src: ' + dest_label + ')'
        elif dest_label is None and dest_filter is None:
            dest_construct = dest_construct
        else:
            print("no destination specified!!!")

        return_stmt = ' RETURN src' if return_type == 'source' else ' RETURN dest'
        if count_type is not None:
            return_stmt += ', count(src) as node_count' if count_type == 'source' else ', count(dest) as node_count'

        query = ' MATCH ' + source_construct + '-[:' + relation + ']-' + dest_construct + return_stmt
        print(query)
        return self.run_query(query)

    def get_node_degree_distribution(self, label, _type, attribute=None, attribute_value=None):
        if attribute is None:
            node = '(n: ' + label + ')'
        else:
            node = '(n: ' + label + ' {' + attribute + ':"' + attribute_value + '"})'
        if _type == 'in':
            query = 'MATCH ' + node + '<-[r]-() RETURN type(r) as relation, count(r) as count'
        else:
            query = 'MATCH ' + node + '-[r]->() RETURN type(r) as relation, count(r) as count'
        return self.run_query(query)

    def get_per_relation_count(self):
        query = 'MATCH ()-[r]->() RETURN type(r) as relation, count(r) as count'
        return self.run_query(query)

    def run_query(self, query, json_path_query=None, single=False):
        results = self._read_transaction(self._run_query, query)

        return results if json_path_query is None else json_utils.json_query(
            results, json_path_query, single=single)

    def run_query_kh(self, query):
        results = self._read_transaction(self._run_query_kh, query)

        return results

    def _run_query(self, tx, query):
        resultset = tx.run(query)
        records = resultset.records()
        results = []
        for record in records:
            items = record.items()
            result = {}
            for item in items:
                key = item[0]
                value = item[1]

                result[key] = self._toJSON(value)
            results.append(result)

        return results

    def _run_query_kh(self, tx, query):
        resultset = tx.run(query)

        records = resultset.records()

        return json.dumps([r.data() for r in records])

    def _toJSON(self, value):
        if type(value) in [bool, int, float, str, list]:
            return value
        elif isinstance(value, neo4j.types.graph.Node):
            return self._node_toJSON(value)
        elif isinstance(value, neo4j.types.graph.Relationship):
            return self._rel_toJSON(value)
        else:
            return str(value)

    def _properties_toJSON(self, props):
        properties = copy.copy(props)
        for property in properties:
            value = properties[property]
            if type(value) in [bool, int, float, str, list]:
                continue
            else:
                properties[property] = str(value)
        return properties

    def _node_toJSON(self, node):
        node_json = self._properties_toJSON(node._properties)

        node_labels = list(node._labels)

        if len(node_labels) > 0:
            node_json['type'] = node_labels[0]

        return json_utils.unflatten_json(node_json, unflattenList=True)

    def _rel_toJSON(self, rel):
        rel_json = self._properties_toJSON(rel._properties)

        from_node = rel.start_node
        to_node = rel.end_node

        rel_json['from'] = self._node_toJSON(from_node)
        rel_json['to'] = self._node_toJSON(to_node)

        rel_json['type'] = rel.type

        return json_utils.unflatten_json(rel_json, unflattenList=True)
