import {
  Controller,
  Inject,
  Logger,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { CDCPayloadDto } from '../../kafka-module/cdc.dto';
import { SaveCategoryUseCase } from '../../../core/category/application/use-cases/save-category/save-category.use-case';
import { DeleteCategoryUseCase } from '../../../core/category/application/use-cases/delete-category/delete-category.use-case';
import { SaveCategoryInput } from '../../../core/category/application/use-cases/save-category/save-category.input';
import { TombstoneEventInterceptor } from '../../kafka-module/tombstone-event.interceptor';
import { KConnectEventPattern } from '../../kafka-module/kconnect-event-pattern.decorator';

@Controller()
export class CategoriesConsumer {
  private logger = new Logger(CategoriesConsumer.name);

  @Inject(SaveCategoryUseCase)
  private saveUseCase: SaveCategoryUseCase;

  @Inject(DeleteCategoryUseCase)
  private deleteUseCase: DeleteCategoryUseCase;

  @UseInterceptors(TombstoneEventInterceptor)
  @KConnectEventPattern('categories')
  async handle(@Payload(new ValidationPipe()) message: CDCPayloadDto) {
    switch (message.op) {
      case 'r':
        this.logger.log(
          `[INFO] [${CategoriesConsumer.name}] - Discarding read operation`,
        );
        break;
      case 'c':
      case 'u':
        this.logger.log(
          `[INFO] [${CategoriesConsumer.name}] - Processing operation ${message.op} - ${JSON.stringify(message.after)}`,
        );
        const inputBeforeValidate = {
          category_id: message.after?.category_id,
          name: message.after?.name,
          description: message.after?.description,
          is_active: message.after?.is_active,
          created_at: message.after?.created_at,
        };
        const input = await new ValidationPipe({
          errorHttpStatusCode: 422,
          transform: true,
        }).transform(inputBeforeValidate, {
          type: 'body',
          metatype: SaveCategoryInput,
        });

        await this.saveUseCase.execute(input);
        break;
      case 'd':
        this.logger.log(
          `[INFO] [${CategoriesConsumer.name}] - Processing operation ${message.op} - ${JSON.stringify(message.before)}`,
        );
        await this.deleteUseCase.execute({ id: message.before?.category_id });
        break;
    }
  }
}
