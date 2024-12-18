import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  ElasticsearchContainer,
  StartedElasticsearchContainer,
} from '@testcontainers/elasticsearch';
import crypto from 'crypto';
import { esMapping } from '../db/elastic-search/es-mapping';
import debug from 'debug';
import {
  CustomKafkaContainer,
  CustomStartedKafkaContainer,
} from './containers/custom-kafka-container';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { HttpWaitStrategy } from 'testcontainers/build/wait-strategies/http-wait-strategy';

global.fail = (message) => {
  throw new Error(message);
};

export async function tryStartContainer<T>(fn: () => Promise<T>): Promise<T> {
  do {
    try {
      return await fn();
    } catch (e) {
      if (!e.message.includes('port is already allocated')) {
        throw e;
      }
    }
  } while (true);
}

const esDebug = debug('eshelper');

type SetupElasticSearchHelper = {
  deleteIndex: boolean;
};

export function setupElasticsearch(
  options: SetupElasticSearchHelper = { deleteIndex: true },
) {
  let _esClient: ElasticsearchService;
  let _startedContainer: StartedElasticsearchContainer;
  let _indexName: string;

  beforeAll(async () => {
    _startedContainer = await tryStartContainer(async () => {
      return new ElasticsearchContainer('elasticsearch:7.17.7')
        .withReuse()
        .withTmpFs({
          '/usr/share/elasticsearch/data': 'rw',
        })
        .withExposedPorts({
          container: 9200,
          host: 9300,
        })
        .start();
    });
  }, 120000);

  beforeEach(async () => {
    _indexName = 'test_es_' + crypto.randomInt(0, 1000000);
    esDebug('Creating index %s', _indexName);
    _esClient = new ElasticsearchService({
      node: _startedContainer.getHttpUrl(),
    });
    await _esClient.indices.create({
      index: _indexName,
      body: {
        mappings: esMapping,
        settings: {
          analysis: {
            analyzer: {
              ngram_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'ngram_filter', 'asciifolding'],
              },
            },
            filter: {
              ngram_filter: {
                type: 'ngram',
                min_gram: 3,
                max_gram: 4,
              },
            },
          },
        },
      },
    });
  });

  afterEach(async () => {
    if (!options.deleteIndex) {
      return;
    }
    await _esClient?.indices?.delete({ index: _indexName });
  });

  return {
    get esClient() {
      return _esClient;
    },
    get indexName() {
      return _indexName;
    },
    get container() {
      return _startedContainer;
    },
    get esUrl() {
      return _startedContainer.getHttpUrl();
    },
  };
}

type SetupKafkaHelper = {
  schemaRegistry?: boolean;
  connect?: boolean;
  topics?: string[];
};

export function setupKafka(
  options: SetupKafkaHelper = { schemaRegistry: false, topics: [] },
) {
  let _kafkaContainer: CustomStartedKafkaContainer;
  let _schemaRegistryContainer: StartedTestContainer | null = null;
  let _kafkaConnectContainer: StartedTestContainer | null = null;

  beforeAll(async () => {
    _kafkaContainer = await tryStartContainer(async () => {
      return await new CustomKafkaContainer('confluentinc/cp-kafka:7.5.2')
        .withReuse()
        .withExposedPorts({
          container: 9092,
          host: 9093,
        })
        .start();
    });
    if (options.schemaRegistry) {
      _schemaRegistryContainer = await tryStartContainer(async () => {
        return await new GenericContainer(
          'confluentinc/cp-schema-registry:7.5.2',
        )
          .withReuse()
          .withEnvironment({
            SCHEMA_REGISTRY_HOST_NAME: 'schema-registry',
            SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(9093)}`,
            SCHEMA_REGISTRY_LISTENERS: 'http://0.0.0.0:8081',
          })
          .withExposedPorts({
            container: 8081,
            host: 8082,
          })
          .start();
      });
    }

    if (options.connect && !options.schemaRegistry) {
      throw new Error('Cannot start connect without schema registry');
    }

    if (options.connect) {
      _kafkaConnectContainer = await tryStartContainer(async () => {
        return await new GenericContainer(
          'cnfldemos/cp-server-connect-datagen:0.6.2-7.5.0',
        )
          .withReuse()
          .withExposedPorts({
            container: 8083,
            host: 8084,
          })
          .withEnvironment({
            CONNECT_BOOTSTRAP_SERVERS: `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(
              9093,
            )}`,
            CONNECT_REST_ADVERTISED_HOST_NAME: 'connect',
            CONNECT_GROUP_ID: 'compose-connect-group',
            CONNECT_CONFIG_STORAGE_TOPIC: 'docker-connect-configs',
            CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR: '1',
            CONNECT_OFFSET_FLUSH_INTERVAL_MS: '10000',
            CONNECT_OFFSET_STORAGE_TOPIC: 'docker-connect-offsets',
            CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR: '1',
            CONNECT_STATUS_STORAGE_TOPIC: 'docker-connect-status',
            CONNECT_STATUS_STORAGE_REPLICATION_FACTOR: '1',
            CONNECT_KEY_CONVERTER:
              'org.apache.kafka.connect.storage.StringConverter',
            CONNECT_VALUE_CONVERTER: 'io.confluent.connect.avro.AvroConverter',
            CONNECT_VALUE_CONVERTER_SCHEMA_REGISTRY_URL: `http://${_schemaRegistryContainer!.getHost()}:${_schemaRegistryContainer!.getMappedPort(
              8081,
            )}`,
            CLASSPATH:
              '/usr/share/java/monitoring-interceptors/monitoring-interceptors-7.5.2.jar',
            CONNECT_PRODUCER_INTERCEPTOR_CLASSES:
              'io.confluent.monitoring.clients.interceptor.MonitoringProducerInterceptor',
            CONNECT_CONSUMER_INTERCEPTOR_CLASSES:
              'io.confluent.monitoring.clients.interceptor.MonitoringConsumerInterceptor',
            CONNECT_PLUGIN_PATH:
              '/usr/share/java,/usr/share/confluent-hub-components',
            CONNECT_LOG4J_LOGGERS:
              'org.apache.zookeeper=ERROR,org.I0Itec.zkclient=ERROR,org.reflections=ERROR',
          })
          .withCommand([
            'bash',
            '-c',
            'confluent-hub install --no-prompt debezium/debezium-connector-mysql:2.2.1 && /etc/confluent/docker/run && sleep infinity',
          ])
          .withWaitStrategy(
            new HttpWaitStrategy('/connectors', 8083, {}).withStartupTimeout(
              120000,
            ),
          )
          .start();
      });
    }
  }, 40000);

  beforeEach(async () => {
    if (options.topics?.length) {
      await Promise.all(
        options.topics.map((topic) => _kafkaContainer.createTopic(topic)),
      );
    }
  });

  afterEach(async () => {
    if (options.topics?.length) {
      await Promise.all(
        options.topics.map((topic) => _kafkaContainer.deleteTopic(topic)),
      );
    }
  });

  return {
    get kafkaContainer() {
      return _kafkaContainer;
    },
    get kafkaContainerHost() {
      return `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(9093)}`;
    },
    get schemaRegistryContainer() {
      return _schemaRegistryContainer;
    },
    get schemaRegistryUrl() {
      return `http://${_schemaRegistryContainer?.getHost()}:${_schemaRegistryContainer?.getMappedPort(8081)}`;
    },
    get kafkaConnectContainer() {
      return _kafkaConnectContainer;
    },
  };
}
