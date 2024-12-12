import { DeleteCategoryUseCase } from '../delete-category.use-case';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { CategoryElasticSearchRepository } from '../../../../infra/db/elastic-search/category-elastic-search';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';

describe('DeleteCategoryUseCase Integration Tests', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new DeleteCategoryUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.id })).rejects.toThrow(
      new NotFoundError(categoryId.id, Category),
    );
  });

  it('should throw an error when there is only one category not deleted in related and a only category valid is being deleted', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    await esHelper.esClient.create({
      index: esHelper.indexName,
      id: '1',
      body: {
        categories: [
          {
            category_id: category.category_id.id,
            category_name: 'test',
            is_active: true,
            deleted_at: null,
            is_deleted: false,
          },
        ],
      },
      refresh: true,
    });
    await expect(() =>
      useCase.execute({ id: category.category_id.id }),
    ).rejects.toThrow('At least one category must be present in related.');
  });

  it('should delete a category', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    await useCase.execute({ id: category.category_id.id });
    const result = await repository.findById(category.category_id);
    expect(result?.deleted_at).not.toBeNull();
  });
});
