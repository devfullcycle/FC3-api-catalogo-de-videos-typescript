import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Transport } from '@nestjs/microservices';
import { SchemaRegistryDeserializer } from '../nest-modules/kafka-module/schema-registry-deserializer';
import { SchemaRegistryClient } from '@confluentinc/schemaregistry';

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
  await app.listen();
}
bootstrap();
