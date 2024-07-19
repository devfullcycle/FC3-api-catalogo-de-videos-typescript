import { ListAllCategoriesUseCase } from '../list-all-categories.use-case';
import { CategoryElasticSearchRepository } from '../../../../infra/db/elastic-search/category-elastic-search';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';
import { Category } from '../../../../domain/category.aggregate';

describe('ListAllCategoriesUseCase Integration Tests', () => {
  let useCase: ListAllCategoriesUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new ListAllCategoriesUseCase(repository);
  });

  it('should list all categories', async () => {
    const category1 = Category.fake().aCategory().build();
    const category2 = Category.fake().aCategory().build();
    await repository.insert(category1);
    await repository.insert(category2);
    const output = await useCase.execute();
    expect(output).toHaveLength(2);
    expect(output).toContainEqual({
      id: category1.category_id.id,
      name: category1.name,
      description: category1.description,
      is_active: category1.is_active,
      created_at: category1.created_at,
      deleted_at: null,
    });
    expect(output).toContainEqual({
      id: category2.category_id.id,
      name: category2.name,
      description: category2.description,
      is_active: category2.is_active,
      created_at: category2.created_at,
      deleted_at: null,
    });

    category1.markAsDeleted();
    await repository.update(category1);

    const output2 = await useCase.execute();
    expect(output2).toHaveLength(1);
    expect(output2).toContainEqual({
      id: category2.category_id.id,
      name: category2.name,
      description: category2.description,
      is_active: category2.is_active,
      created_at: category2.created_at,
      deleted_at: null,
    });
  });
});
