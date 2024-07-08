import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { LoadEntityError } from '../../../../shared/domain/validators/validation.error';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/category.repository';

export const CATEGORY_DOCUMENT_TYPE_NAME = 'Category';

export type CategoryDocument = {
  category_name: string;
  category_description: string | null;
  is_active: boolean;
  created_at: Date | string;
  type: typeof CATEGORY_DOCUMENT_TYPE_NAME;
};

export class CategoryElasticSearchMapper {
  static toEntity(id: string, document: CategoryDocument): Category {
    if (document.type !== CATEGORY_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }

    const category = new Category({
      category_id: new CategoryId(id),
      name: document.category_name,
      description: document.category_description,
      is_active: document.is_active,
      created_at: !(document.created_at instanceof Date)
        ? new Date(document.created_at)
        : document.created_at,
    });

    category.validate();
    if (category.notification.hasErrors()) {
      throw new LoadEntityError(category.notification.toJSON());
    }
    return category;
  }

  static toDocument(entity: Category): CategoryDocument {
    return {
      category_name: entity.name,
      category_description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
      type: CATEGORY_DOCUMENT_TYPE_NAME,
    };
  }
}

export class CategoryElasticSearchRepository implements ICategoryRepository {
  sortableFields: string[];

  constructor(
    private esClient: ElasticsearchService,
    private index: string,
  ) {}

  insert(entity: Category): Promise<void> {
    throw new Error('Method not implemented.');
  }
  bulkInsert(entities: Category[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findById(id: CategoryId): Promise<Category | null> {
    throw new Error('Method not implemented.');
  }
  findOneBy(filter: Partial<Category>): Promise<Category | null> {
    throw new Error('Method not implemented.');
  }
  findBy(
    filter: Partial<Category>,
    order?: { field: string; direction: SortDirection },
  ): Promise<Category[]> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<Category[]> {
    throw new Error('Method not implemented.');
  }
  findByIds(
    ids: CategoryId[],
  ): Promise<{ exists: Category[]; not_exists: CategoryId[] }> {
    throw new Error('Method not implemented.');
  }
  existsById(
    ids: CategoryId[],
  ): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    throw new Error('Method not implemented.');
  }
  update(entity: Category): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(id: CategoryId): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getEntity(): new (...args: any[]) => Category {
    throw new Error('Method not implemented.');
  }
}
