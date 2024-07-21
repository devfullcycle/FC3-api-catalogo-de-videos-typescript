import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { CategoryElasticSearchRepository } from '../../../../infra/db/elastic-search/category-elastic-search';
import { GetCategoryUseCase } from '../get-category.use-case';

describe('GetCategoryUseCase Integration Tests', () => {
  let useCase: GetCategoryUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new GetCategoryUseCase(repository);
  });

  it('should throws error when aggregate not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.id })).rejects.toThrow(
      new NotFoundError(categoryId.id, Category),
    );

    const category = Category.fake().aCategory().build();
    category.markAsDeleted();
    await repository.insert(category);

    await expect(() =>
      useCase.execute({ id: category.category_id.id }),
    ).rejects.toThrow(new NotFoundError(category.category_id.id, Category));
  });

  it('should return a category', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    const output = await useCase.execute({ id: category.category_id.id });
    expect(output).toStrictEqual({
      id: category.category_id.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
      deleted_at: null,
    });
  });
});
