import { IUseCase } from '../../../../shared/application/use-case-interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/category.repository';
import { SaveCategoryInput } from './save-category.input';

export class SaveCategoryUseCase
  implements IUseCase<SaveCategoryInput, SaveCategoryOutput>
{
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(input: SaveCategoryInput): Promise<SaveCategoryOutput> {
    const categoryId = new CategoryId(input.category_id);
    const category = await this.categoryRepo.findById(categoryId);

    return category
      ? this.updateCategory(input, category)
      : this.createCategory(input);
  }

  private async createCategory(input: SaveCategoryInput) {
    const entity = Category.create({
      ...input,
      category_id: new CategoryId(input.category_id),
    });
    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }
    await this.categoryRepo.insert(entity);
    return { id: entity.category_id.id, created: true }; //CQS
  }

  private async updateCategory(input: SaveCategoryInput, category: Category) {
    if (input.is_active === false) {
      const hasOnlyOneActivateInRelated =
        await this.categoryRepo.hasOnlyOneActivateInRelated(
          category.category_id,
        );
      if (hasOnlyOneActivateInRelated) {
        throw new EntityValidationError([
          {
            is_active: ['At least one category must be active in related.'],
          },
        ]);
      }
    }

    category.changeName(input.name);
    category.changeDescription(input.description);

    input.is_active === true ? category.activate() : category.deactivate();

    category.changeCreatedAt(input.created_at);

    if (category.notification.hasErrors()) {
      throw new EntityValidationError(category.notification.toJSON());
    }

    await this.categoryRepo.update(category);

    return { id: category.category_id.id, created: false };
  }
}

export type SaveCategoryOutput = { id: string; created: boolean };
