import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/category.repository';

export class DeleteCategoryUseCase
  implements IUseCase<DeleteCategoryInput, DeleteCategoryOutput>
{
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(input: DeleteCategoryInput): Promise<DeleteCategoryOutput> {
    const categoryId = new CategoryId(input.id);
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) {
      throw new NotFoundError(input.id, Category);
    }

    const hasOnlyOneNotDeletedInRelated =
      await this.categoryRepo.hasOnlyOneNotDeletedInRelated(
        category.category_id,
      );

    if (hasOnlyOneNotDeletedInRelated) {
      //criar um erro personalizado
      throw new Error('At least one category must be present in related.');
    }

    category.markAsDeleted();

    await this.categoryRepo.update(category);
  }
}

export type DeleteCategoryInput = {
  id: string;
};

export type DeleteCategoryOutput = void;
