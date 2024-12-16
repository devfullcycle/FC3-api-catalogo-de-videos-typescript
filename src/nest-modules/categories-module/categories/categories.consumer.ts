import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class CategoriesConsumer {
  @EventPattern('mysql.micro_videos.categories')
  handle(@Payload() message, @Ctx() context: KafkaContext) {
    console.log(message, context, message.toString());
  }
}
