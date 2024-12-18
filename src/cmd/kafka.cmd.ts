import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
//import { Transport } from '@nestjs/microservices';
import { SchemaRegistryDeserializer } from '../nest-modules/kafka-module/schema-registry-deserializer';
import { SchemaRegistryClient } from '@confluentinc/schemaregistry';
import { KConnectEventPatternRegister } from '../nest-modules/kafka-module/kconnect-event-pattern.register';
import { ConfluentKafkaServer } from '../nest-modules/kafka-module/confluent/confluent-kafka-server';

async function bootstrap() {
  // const app = await NestFactory.createMicroservice(AppModule, {
  //   transport: Transport.KAFKA,
  //   options: {
  //     client: {
  //       brokers: ['kafka:29092'],
  //     },
  //     consumer: {
  //       groupId: 'categories-consumer' + Math.random(),
  //     },
  //     deserializer: new SchemaRegistryDeserializer(
  //       new SchemaRegistryClient({ baseURLs: ['http://schema-registry:8081'] }),
  //     ),
  //   },
  // });

  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new ConfluentKafkaServer({
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

  await app.get(KConnectEventPatternRegister).registerKConnectTopicDecorator();

  await app.listen();
}
bootstrap();
