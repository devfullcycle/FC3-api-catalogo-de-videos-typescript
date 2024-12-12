import { InMemoryRepository } from '../../../../shared/domain/repository/in-memory.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/category.repository';

export class CategoryInMemoryRepository
  extends InMemoryRepository<Category, CategoryId>
  implements ICategoryRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasOnlyOneActivateInRelated(categoryId: CategoryId): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasOnlyOneNotDeletedInRelated(categoryId: CategoryId): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }
}
