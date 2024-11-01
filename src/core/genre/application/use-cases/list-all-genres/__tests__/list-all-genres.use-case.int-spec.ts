import { ListAllGenresUseCase } from '../list-all-genres.use-case';
import { GenreElasticSearchRepository } from '../../../../infra/db/elastic-search/genre-elastic-search';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';
import { Genre } from '../../../../domain/genre.aggregate';

describe('ListAllGenresUseCase Integration Tests', () => {
  let useCase: ListAllGenresUseCase;
  let repository: GenreElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new GenreElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new ListAllGenresUseCase(repository);
  });

  it('should list all genres', async () => {
    const genre1 = Genre.fake().aGenre().build();
    const genre2 = Genre.fake().aGenre().build();
    await repository.insert(genre1);
    await repository.insert(genre2);
    const output = await useCase.execute();
    expect(output).toHaveLength(2);
    expect(output).toContainEqual({
      id: genre1.genre_id.id,
      name: genre1.name,
      categories: Array.from(genre1.categories.values()).map((category) => {
        return {
          id: category.category_id.id,
          name: category.name,
          is_active: category.is_active,
          deleted_at: category.deleted_at,
        };
      }),
      is_active: genre1.is_active,
      created_at: genre1.created_at,
    });
    expect(output).toContainEqual({
      id: genre2.genre_id.id,
      name: genre2.name,
      categories: Array.from(genre2.categories.values()).map((category) => {
        return {
          id: category.category_id.id,
          name: category.name,
          is_active: category.is_active,
          deleted_at: category.deleted_at,
        };
      }),
      is_active: genre2.is_active,
      created_at: genre2.created_at,
    });

    genre1.markAsDeleted();
    await repository.update(genre1);

    const output2 = await useCase.execute();
    expect(output2).toHaveLength(1);
    expect(output2).toContainEqual({
      id: genre2.genre_id.id,
      name: genre2.name,
      categories: Array.from(genre2.categories.values()).map((category) => {
        return {
          id: category.category_id.id,
          name: category.name,
          is_active: category.is_active,
          deleted_at: category.deleted_at,
        };
      }),
      is_active: genre2.is_active,
      created_at: genre2.created_at,
    });
  });
});
