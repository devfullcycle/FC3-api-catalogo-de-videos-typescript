import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
//import { Transport } from '@nestjs/microservices';
import { SchemaRegistryDeserializer } from '../nest-modules/kafka-module/schema-registry-deserializer';
import { SchemaRegistryClient } from '@confluentinc/schemaregistry';
import { KConnectEventPatternRegister } from '../nest-modules/kafka-module/kconnect-event-pattern.register';
import { ConfluentKafkaServer } from '../nest-modules/kafka-module/confluent/confluent-kafka-server';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { KafkaConsumeErrorFilter } from '../nest-modules/kafka-module/kafka-consume-error.filter';
import { KafkaJsRetriableServer } from '../nest-modules/kafka-module/kafkajs/kafkajs-retriable-server';
import { RetryTopicNaming } from 'kafkajs-async-retry';
import { ConfluentKafkaRetriableServer } from '../nest-modules/kafka-module/confluent/confluent-kafka-retriable-server';

async function bootstrap() {
  // const kafkaConfig: KafkaOptions = {
  //   transport: Transport.KAFKA,
  //   options: {
  //     client: {
  //       brokers: ['kafka:29092'],
  //     },
  //     consumer: {
  //       //groupId: 'categories-consumer' + Math.random(),
  //       groupId: 'categories-consumer',
  //     },
  //     subscribe: {
  //       fromBeginning: true,
  //     },
  //     deserializer: new SchemaRegistryDeserializer(
  //       new SchemaRegistryClient({ baseURLs: ['http://schema-registry:8081'] }),
  //     ),
  //   },
  // };
  // const app = await NestFactory.createMicroservice(AppModule, {
  //   strategy: new KafkaJsRetriableServer({
  //     asyncRetryConfig: {
  //       maxRetries: 3,
  //       retryDelays: [1, 3, 9],
  //       //retryDelays: [5, 30, 60],
  //       maxWaitTime: 120000,
  //       retryTopicNaming: RetryTopicNaming.ATTEMPT_BASED,
  //     },
  //     client: {
  //       brokers: ['kafka:29092'],
  //     },
  //     consumer: {
  //       //groupId: 'categories-consumer' + Math.random(),
  //       groupId: 'categories-consumer',
  //     },
  //     subscribe: {
  //       fromBeginning: true,
  //     },
  //     deserializer: new SchemaRegistryDeserializer(
  //       new SchemaRegistryClient({ baseURLs: ['http://schema-registry:8081'] }),
  //     ),
  //   }),
  // });

  // const app = await NestFactory.createMicroservice(AppModule, {
  //   strategy: new ConfluentKafkaServer({
  //     server: {
  //       'bootstrap.servers': 'kafka:29092',
  //     },
  //     consumer: {
  //       allowAutoTopicCreation: true,
  //       sessionTimeout: 10000,
  //       rebalanceTimeout: 10000,
  //     },
  //     deserializer: new SchemaRegistryDeserializer(
  //       new SchemaRegistryClient({ baseURLs: ['http://schema-registry:8081'] }),
  //     ),
  //   }),
  // });

  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new ConfluentKafkaRetriableServer({
      asyncRetryConfig: {
        maxRetries: 3,
        maxWaitTime: 120000,
        retryDelays: [1, 3, 9],
        //retryDelays: [5, 30, 60],
        retryTopicNaming: RetryTopicNaming.ATTEMPT_BASED,
      },
      server: {
        'bootstrap.servers': 'kafka:29092',
      },
      consumer: {
        allowAutoTopicCreation: true,
        sessionTimeout: 10000,
        rebalanceTimeout: 10000,
      },
      deserializer: new SchemaRegistryDeserializer(
        new SchemaRegistryClient({ baseURLs: ['http://schema-registry:8081'] }),
      ),
    }),
  });

  app.useGlobalFilters(new KafkaConsumeErrorFilter());

  await app.get(KConnectEventPatternRegister).registerKConnectTopicDecorator();

  await app.listen();
}
bootstrap();
