import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['kafka:29092'],
      },
    },
  });
  await app.listen();
}
bootstrap();
