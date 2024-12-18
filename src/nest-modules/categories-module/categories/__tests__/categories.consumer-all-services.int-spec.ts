import { StartedKafkaContainer } from '@testcontainers/kafka';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { StartedTestContainer } from 'testcontainers';
import mysql from 'mysql2/promise';
import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'crypto';
import { INestMicroservice } from '@nestjs/common';
import {
  setupElasticsearch,
  setupKafka,
} from '../../../../core/shared/infra/testing/global-helpers';
import { ConfigModule } from '../../../config-module/config-module';
import { overrideConfiguration } from '../../../config-module/configuration';
import { CategoryId } from '../../../../core/category/domain/category.aggregate';
import { sleep } from '../../../../core/shared/domain/utilts';
import { ICategoryRepository } from '../../../../core/category/domain/category.repository';
import { CATEGORY_PROVIDERS } from '../../categories.providers';
import { ElasticSearchModule } from '../../../elastic-search-module/elastic-search-module';
import { CategoriesModule } from '../../categories.module';
import { KafkaModule } from '../../../kafka-module/kafka.module';
import { KConnectEventPatternRegister } from '../../../kafka-module/kconnect-event-pattern.register';
import { Transport } from '@nestjs/microservices';
import { SchemaRegistryDeserializer } from '../../../kafka-module/schema-registry-deserializer';
import { SchemaRegistryClient } from '@confluentinc/schemaregistry';

describe.skip('CategoriesConsumer Integration Tests', () => {
  const esHelper = setupElasticsearch();
  const kafkaHelper = setupKafka({ connect: true, schemaRegistry: true });

  let _kafkaContainer: StartedKafkaContainer;
  let _mysqlContainer: StartedMySqlContainer;
  let _mysqlDbName;
  let _mysqlConnection;
  let _schemaRegistryContainer: StartedTestContainer;
  let _kafkaConnectContainer: StartedTestContainer;
  let _kConnectorName;
  let _nestModule: TestingModule;
  let _microserviceInst: INestMicroservice;

  beforeAll(
    async () => {
      _mysqlContainer = await new MySqlContainer('mysql:8.0.30-debian')
        .withReuse()
        .withCommand([
          '--default-authentication-plugin=mysql_native_password',
          '--server-id=1',
          '--log-bin=mysql-bin',
        ])
        .withTmpFs({ '/var/lib/mysql': 'rw' })
        .withRootPassword('root')
        .withExposedPorts({
          container: 3306,
          host: 3307,
        })
        .start();
      _kafkaContainer = kafkaHelper.kafkaContainer;
      _schemaRegistryContainer = kafkaHelper.schemaRegistryContainer!;
      _kafkaConnectContainer = kafkaHelper.kafkaConnectContainer!;
    },
    1000 * 60 * 5,
  );

  beforeEach(async () => {
    _mysqlDbName = 'test_db_' + crypto.randomInt(0, 1000000);

    _mysqlConnection = await mysql.createConnection({
      host: _mysqlContainer.getHost(),
      port: _mysqlContainer.getPort(),
      user: 'root',
      password: _mysqlContainer.getRootPassword(),
      multipleStatements: true,
    });
    await _mysqlConnection.query(`
    CREATE DATABASE ${_mysqlDbName};
    use ${_mysqlDbName};
    CREATE TABLE IF NOT EXISTS categories (category_id VARCHAR(36), name VARCHAR(255), description TEXT, is_active BOOLEAN, created_at DATETIME);
    `);

    _kConnectorName = 'test_kconnector_' + crypto.randomInt(0, 1000000);

    const responseKConnectCreateConfig = await fetch(
      `http://${_kafkaConnectContainer.getHost()}:${_kafkaConnectContainer.getMappedPort(
        8083,
      )}/connectors`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: _kConnectorName,
          config: {
            'connector.class': 'io.debezium.connector.mysql.MySqlConnector',
            'tasks.max': '1',
            'topic.prefix': 'mysql',
            'database.hostname': _mysqlContainer.getHost(),
            'database.port': _mysqlContainer.getPort(),
            'database.user': 'root',
            'database.password': _mysqlContainer.getRootPassword(),
            'database.server.id': '1',
            'provide.transaction.metadata': 'true',
            'database.server.name': 'mysql-server',
            'schema.history.internal.kafka.bootstrap.servers': `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(
              9093,
            )}`,
            'schema.history.internal.kafka.topic': 'mysql_history',
            'database.whitelist': _mysqlDbName,
          },
        }),
      },
    );
    if (responseKConnectCreateConfig.status !== 201) {
      throw new Error(await responseKConnectCreateConfig.text());
    }

    await sleep(2000);

    const responseKConnectCheckStatus = await fetch(
      `http://${_kafkaConnectContainer.getHost()}:${_kafkaConnectContainer.getMappedPort(
        8083,
      )}/connectors/${_kConnectorName}/status`,
    );
    if (responseKConnectCheckStatus.status !== 200) {
      throw new Error(await responseKConnectCheckStatus.text());
    }

    const data = await responseKConnectCheckStatus.json();
    if (data.tasks[0].state !== 'RUNNING') {
      throw new Error(data);
    }

    _nestModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            overrideConfiguration({
              elastic_search: {
                host: `http://${esHelper.container.getHost()}:${esHelper.container.getMappedPort(9200)}`,
                index: esHelper.indexName,
              },
              kafka: {
                connect_prefix: `mysql.${_mysqlDbName}`,
              },
            }),
          ],
        }),
        KafkaModule,
        CategoriesModule.forRoot(),
        ElasticSearchModule,
      ],
    }).compile();

    await _nestModule
      .get(KConnectEventPatternRegister)
      .registerKConnectTopicDecorator();
  });

  afterEach(async () => {
    if (_kafkaConnectContainer) {
      const responseKConnectDelete = await fetch(
        `http://${_kafkaConnectContainer.getHost()}:${_kafkaConnectContainer.getMappedPort(
          8083,
        )}/connectors/${_kConnectorName}`,
        {
          method: 'DELETE',
        },
      );
      if (responseKConnectDelete.status !== 204) {
        throw new Error(await responseKConnectDelete.text());
      }
    }
    if (_mysqlContainer && _mysqlDbName && _mysqlConnection) {
      await _mysqlConnection.query(`DROP DATABASE ${_mysqlDbName}`);
      await _mysqlConnection.end();
    }
    await _microserviceInst.close();
  });

  test('should sync a category', async () => {
    const categoryId = new CategoryId(crypto.randomUUID());

    await _mysqlConnection.query(`
    use ${_mysqlDbName};
    INSERT INTO categories (category_id, name, description, is_active, created_at) VALUES ("${categoryId}", "name", "description", true, "2021-01-01T00:00:00");
    `);

    await sleep(1000);

    _microserviceInst = _nestModule.createNestMicroservice({
      transport: Transport.KAFKA,
      options: {
        deserializer: new SchemaRegistryDeserializer(
          new SchemaRegistryClient({
            baseURLs: [
              `http://${_schemaRegistryContainer.getHost()}:${_schemaRegistryContainer.getMappedPort(8081)}`,
            ],
          }),
        ),
        client: {
          clientId: 'test_client' + crypto.randomInt(0, 1000000),
          brokers: [
            `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(9093)}`,
          ],
          connectionTimeout: 1000,
        },
        consumer: {
          allowAutoTopicCreation: false,
          groupId: _kConnectorName,
          retry: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            restartOnFailure: (e: any) => Promise.resolve(false),
          },
          maxWaitTimeInMs: 0,
        },
        subscribe: {
          fromBeginning: true,
        },
      },
    });
    await _microserviceInst.listen();

    const repository = _microserviceInst.get<ICategoryRepository>(
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
    );

    await sleep(2000);
    const category = await repository.findById(categoryId);
    expect(category).toBeDefined();
    expect(category!.name).toEqual('name');
    expect(category!.description).toEqual('description');
    expect(category!.is_active).toEqual(true);
    expect(category!.created_at).toEqual(new Date('2021-01-01T00:00:00'));
  });
});
