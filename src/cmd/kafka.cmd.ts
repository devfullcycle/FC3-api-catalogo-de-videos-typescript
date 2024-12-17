import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Transport } from '@nestjs/microservices';
import { SchemaRegistryDeserializer } from '../nest-modules/kafka-module/schema-registry-deserializer';
import { SchemaRegistryClient } from '@confluentinc/schemaregistry';
import { KConnectEventPatternRegister } from '../nest-modules/kafka-module/kconnect-event-pattern.register';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['kafka:29092'],
      },
      consumer: {
        groupId: 'categories-consumer' + Math.random(),
      },
      deserializer: new SchemaRegistryDeserializer(
        new SchemaRegistryClient({ baseURLs: ['http://schema-registry:8081'] }),
      ),
    },
  });

  await app.get(KConnectEventPatternRegister).registerKConnectTopicDecorator();

  await app.listen();
}
bootstrap();
