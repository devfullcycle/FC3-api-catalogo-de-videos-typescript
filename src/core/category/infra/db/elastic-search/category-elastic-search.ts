import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { LoadEntityError } from '../../../../shared/domain/validators/validation.error';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/category.repository';
import {
  GetGetResult,
  QueryDslQueryContainer,
} from '@elastic/elasticsearch/api/types';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

export const CATEGORY_DOCUMENT_TYPE_NAME = 'Category';

export type CategoryDocument = {
  category_name: string;
  category_description: string | null;
  is_active: boolean;
  created_at: Date | string;
  deleted_at: Date | string | null;
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
      deleted_at:
        document.deleted_at === null
          ? null
          : !(document.deleted_at instanceof Date)
            ? new Date(document.deleted_at!)
            : document.deleted_at,
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
      deleted_at: entity.deleted_at,
      type: CATEGORY_DOCUMENT_TYPE_NAME,
    };
  }
}

export class CategoryElasticSearchRepository implements ICategoryRepository {
  sortableFields: string[] = ['name', 'created_at'];
  sortableFieldsMap: Record<string, string> = {
    name: 'category_name',
    created_at: 'created_at',
  };

  constructor(
    private esClient: ElasticsearchService,
    private index: string,
  ) {}

  async insert(entity: Category): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.category_id.id,
      body: CategoryElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Category[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      refresh: true,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.category_id.id } },
        CategoryElasticSearchMapper.toDocument(entity),
      ]),
    });
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  _id: id.id,
                },
              },
              {
                match: {
                  type: CATEGORY_DOCUMENT_TYPE_NAME,
                },
              },
            ],
          },
        },
      },
    });

    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];

    if (docs.length === 0) {
      return null;
    }

    const document = docs[0]._source;

    if (!document) {
      return null;
    }

    return CategoryElasticSearchMapper.toEntity(id.id, document);
  }
  async findOneBy(filter: {
    category_id?: CategoryId;
    is_active?: boolean;
  }): Promise<Category | null> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.category_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.category_id.id,
        },
      });
    }

    if (filter.is_active !== undefined) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          is_active: filter.is_active,
        },
      });
    }

    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
      },
    });

    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];

    if (docs.length === 0) {
      return null;
    }

    const document = docs[0]._source;

    if (!document) {
      return null;
    }

    return CategoryElasticSearchMapper.toEntity(
      docs[0]._id as string,
      document,
    );
  }
  async findBy(
    filter: {
      category_id?: CategoryId;
      is_active?: boolean;
    },
    order?: { field: 'name' | 'created_at'; direction: SortDirection },
  ): Promise<Category[]> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.category_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.category_id.id,
        },
      });
    }

    if (filter.is_active !== undefined) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          is_active: filter.is_active,
        },
      });
    }

    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
        sort:
          order && this.sortableFieldsMap.hasOwnProperty(order.field)
            ? { [this.sortableFieldsMap[order.field]]: order.direction }
            : undefined,
      },
    });

    return result.body.hits.hits.map((hit: any) =>
      CategoryElasticSearchMapper.toEntity(hit._id, hit._source),
    );
  }
  async findAll(): Promise<Category[]> {
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: {
          match: {
            type: CATEGORY_DOCUMENT_TYPE_NAME,
          },
        },
      },
    });

    return result.body.hits.hits.map((hit: any) =>
      CategoryElasticSearchMapper.toEntity(hit._id, hit._source),
    );
  }

  async findByIds(
    ids: CategoryId[],
  ): Promise<{ exists: Category[]; not_exists: CategoryId[] }> {
    const result = await this.esClient.search({
      body: {
        query: {
          bool: {
            must: [
              {
                ids: {
                  values: ids.map((id) => id.id),
                },
              },
              {
                match: {
                  type: CATEGORY_DOCUMENT_TYPE_NAME,
                },
              },
            ],
          },
        },
      },
    });

    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];

    return {
      exists: docs.map((doc) =>
        CategoryElasticSearchMapper.toEntity(doc._id as string, doc._source!),
      ),
      not_exists: ids.filter((id) => !docs.some((doc) => doc._id === id.id)),
    };
  }

  async existsById(
    ids: CategoryId[],
  ): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    const result = await this.esClient.search({
      index: this.index,
      _source: false as any,
      body: {
        query: {
          bool: {
            must: [
              {
                ids: {
                  values: ids.map((id) => id.id),
                },
              },
              {
                match: {
                  type: CATEGORY_DOCUMENT_TYPE_NAME,
                },
              },
            ],
          },
        },
      },
    });

    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];
    const existsCategoryIds = docs.map((m) => new CategoryId(m._id as string));
    const notExistsCategoryIds = ids.filter(
      (id) => !existsCategoryIds.some((e) => e.equals(id)),
    );
    return {
      exists: existsCategoryIds,
      not_exists: notExistsCategoryIds,
    };
  }

  async update(entity: Category): Promise<void> {
    const result = await this.esClient.updateByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            _id: entity.category_id.id,
          },
        },
        script: {
          source: `
            ctx._source.category_name = params.category_name;
            ctx._source.category_description = params.category_description;
            ctx._source.is_active = params.is_active;
            ctx._source.created_at = params.created_at;
            ctx._source.deleted_at = params.deleted_at;
          `,
          params: CategoryElasticSearchMapper.toDocument(entity),
        },
      },
      refresh: true,
    });

    if (result.body.updated == 0) {
      throw new NotFoundError(entity.category_id.id, Category);
    }
  }

  async delete(id: CategoryId): Promise<void> {
    const result = await this.esClient.deleteByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            _id: id.id,
          },
        },
      },
      refresh: true,
    });

    if (result.body.deleted == 0) {
      throw new NotFoundError(id.id, Category);
    }
  }

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }
}
