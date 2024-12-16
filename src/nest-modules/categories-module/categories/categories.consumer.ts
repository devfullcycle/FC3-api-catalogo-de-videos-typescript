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
    // console.log(
    //   message.toString(),
    //   context,
    //   message.forEach((byte, index) => {
    //     console.log(`Byte ${index}: 0x${byte.toString(16).padStart(2, '0')}`);
    //   }),
    // );
    console.log(message);
  }
}
