import { Controller, Logger, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CDCPayloadDto } from '../../kafka-module/cdc.dto';
import { SaveCategoryUseCase } from '../../../core/category/application/use-cases/save-category/save-category.use-case';
import { DeleteCategoryUseCase } from '../../../core/category/application/use-cases/delete-category/delete-category.use-case';
import { SaveCastMemberInput } from '../../../core/cast-member/application/use-cases/save-cast-member/save-cast-member.input';

@Controller()
export class CategoriesConsumer {
  private logger = new Logger(CategoriesConsumer.name);

  private saveUseCase: SaveCategoryUseCase;

  private deleteUseCase: DeleteCategoryUseCase;

  @EventPattern('mysql.micro_videos.categories')
  async handle(@Payload(new ValidationPipe()) message: CDCPayloadDto) {
    switch (message.op) {
      case 'r':
        this.logger.log(
          `[INFO] ${CategoriesConsumer.name} - Discarding read operation`,
        );
        break;
      case 'c':
      case 'u':
        const inputBeforeValidate = {
          category_id: message.after.id,
          name: message.after.name,
          description: message.after.description,
          is_active: message.after.is_active,
          created_at: message.after.created_at,
        };
        const input = await new ValidationPipe({
          errorHttpStatusCode: 422,
          transform: true,
        }).transform(inputBeforeValidate, {
          type: 'body',
          metatype: SaveCastMemberInput,
        });
        await this.saveUseCase.execute(input);
      case 'd':
        this.logger.log(
          `[INFO] ${CategoriesConsumer.name} - Processing operation ${message.op}`,
        );
        await this.deleteUseCase.execute({ id: message.before.id });
        break;
    }
  }
}
