import { Test, TestingModule } from '@nestjs/testing';
import {
  setupElasticsearch,
  setupKafka,
} from '../../../../core/shared/infra/testing/global-helpers';
import { BadRequestException, INestMicroservice } from '@nestjs/common';
import { KConnectEventPatternRegister } from '../../../kafka-module/kconnect-event-pattern.register';
import crypto from 'crypto';
import { ConfigModule } from '../../../config-module/config-module';
import { overrideConfiguration } from '../../../config-module/configuration';
import { KafkaModule } from '../../../kafka-module/kafka.module';
import { CategoriesModule } from '../../categories.module';
import { ElasticSearchModule } from '../../../elastic-search-module/elastic-search-module';
//import { logLevel } from 'kafkajs';
import { CDCOperation, CDCPayloadDto } from '../../../kafka-module/cdc.dto';
import {
  Category,
  CategoryId,
} from '../../../../core/category/domain/category.aggregate';
import { sleep } from '../../../../core/shared/domain/utilts';
import { CATEGORY_PROVIDERS } from '../../categories.providers';
import { ICategoryRepository } from '../../../../core/category/domain/category.repository';
import { ServerKafka, Transport } from '@nestjs/microservices';
import { TestDynamicExceptionFilter } from '../../../shared-module/testing/test-dynamic-exception.filter';
import { ConfluentKafkaServer } from '../../../kafka-module/confluent/confluent-kafka-server';

describe('CategoriesConsumer Integration Tests', () => {
  const esHelper = setupElasticsearch();
  const kafkaHelper = setupKafka();

  let _nestModule: TestingModule;
  let _microserviceInst: INestMicroservice;
  let _kafkaServer: ServerKafka;
  let _kafkaConnectPrefix;
  let _categoriesTopic;

  beforeEach(async () => {
    _kafkaConnectPrefix = 'test_prefix' + crypto.randomInt(0, 1000000);
    _categoriesTopic = KConnectEventPatternRegister.kConnectTopicName(
      _kafkaConnectPrefix,
      'categories',
    );

    await kafkaHelper.kafkaContainer.createTopic(_categoriesTopic);
    _nestModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            overrideConfiguration({
              elastic_search: {
                host: esHelper.esUrl,
                index: esHelper.indexName,
              },
              kafka: {
                connect_prefix: _kafkaConnectPrefix,
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

    _microserviceInst = _nestModule.createNestMicroservice({
      strategy: new ConfluentKafkaServer({
        server: {
          'client.id': 'test_client' + crypto.randomInt(0, 1000000),
          'bootstrap.servers': kafkaHelper.kafkaContainerHost,
          log_level: 0,
        },
        consumer: {
          groupId: 'test_group' + crypto.randomInt(0, 1000000),
          allowAutoTopicCreation: false,
          fromBeginning: true,
        },
      }),
      // transport: Transport.KAFKA,
      // options: {
      //   client: {
      //     clientId: 'test_client' + crypto.randomInt(0, 1000000),
      //     brokers: [kafkaHelper.kafkaContainerHost],
      //     connectionTimeout: 1000,
      //     logLevel: logLevel.NOTHING,
      //   },
      //   consumer: {
      //     allowAutoTopicCreation: false,
      //     groupId: 'test_group' + crypto.randomInt(0, 1000000),
      //     retry: {
      //       // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //       restartOnFailure: (e: any) => Promise.resolve(false),
      //     },
      //     maxWaitTimeInMs: 0,
      //   },
      //   subscribe: {
      //     fromBeginning: true,
      //   },
      // },
    });

    _kafkaServer = _microserviceInst['server'];
  });

  afterEach(async () => {
    await _microserviceInst.close();
    await kafkaHelper.kafkaContainer.deleteTopic(_categoriesTopic);
  });

  it('should throw an validation exception when event is invalid', async () => {
    expect.assertions(2);
    const exceptionFilterClass =
      TestDynamicExceptionFilter.createDynamicExceptionFilter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (exception, _host) => {
          const error = exception as BadRequestException;
          expect(error).toBeInstanceOf(BadRequestException);
          //@ts-expect-error - error.getResponse is a object
          const message = error.getResponse().message;
          expect(message).toEqual([
            'op should not be empty',
            'op must be one of the following values: r, c, u, d',
            'after must be an object',
            'before must be an object',
          ]);
        },
      );
    _microserviceInst.useGlobalFilters(new exceptionFilterClass());
    await _microserviceInst.listen();

    const message = {};

    await _kafkaServer['producer'].send({
      topic: _categoriesTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await sleep(2000);
  });

  test('should create a category', async () => {
    const categoryId = new CategoryId();

    const message: CDCPayloadDto = {
      op: CDCOperation.CREATE,
      before: null,
      after: {
        category_id: categoryId.id,
        name: 'name',
        description: 'description',
        is_active: true,
        created_at: '2021-01-01T00:00:00',
      },
    };

    await _microserviceInst.listen();
    await _kafkaServer['producer'].send({
      topic: _categoriesTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await sleep(2000);

    const repository = _microserviceInst.get<ICategoryRepository>(
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
    );

    const category = await repository.findById(categoryId);
    expect(category).toBeDefined();
    expect(category!.name).toEqual('name');
    expect(category!.description).toEqual('description');
    expect(category!.is_active).toEqual(true);
    expect(category!.created_at).toEqual(new Date('2021-01-01T00:00:00'));
  });

  test('should update a category', async () => {
    const category = Category.fake().aCategory().build();
    const repository = _microserviceInst.get<ICategoryRepository>(
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
    );
    await repository.insert(category);

    const message: CDCPayloadDto = {
      op: CDCOperation.UPDATE,
      before: null,
      after: {
        category_id: category.category_id.id,
        name: 'name',
        description: 'description',
        is_active: true,
        created_at: '2021-01-01T00:00:00',
      },
    };

    await _microserviceInst.listen();
    _kafkaServer['producer'].send({
      topic: _categoriesTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await sleep(2000);

    const updatedCategory = await repository.findById(category.category_id);
    expect(updatedCategory).toBeDefined();
    expect(updatedCategory!.name).toEqual('name');
    expect(updatedCategory!.description).toEqual('description');
    expect(updatedCategory!.is_active).toEqual(true);
    expect(updatedCategory!.created_at).toEqual(
      new Date('2021-01-01T00:00:00'),
    );
  });

  test('should delete a category', async () => {
    const category = Category.fake().aCategory().build();
    const repository = _microserviceInst.get<ICategoryRepository>(
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
    );
    await repository.insert(category);

    const message: CDCPayloadDto = {
      op: CDCOperation.DELETE,
      before: {
        category_id: category.category_id.id,
      },
      after: null,
    };

    await _microserviceInst.listen();
    await _kafkaServer['producer'].send({
      topic: _categoriesTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await sleep(2000);

    await expect(
      repository.ignoreSoftDeleted().findById(category.category_id),
    ).resolves.toBeNull();
  });
});
