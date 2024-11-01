import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';
import { Genre, GenreId } from '../../../../domain/genre.aggregate';
import { GenreElasticSearchRepository } from '../../../../infra/db/elastic-search/genre-elastic-search';
import { GetGenreUseCase } from '../get-genre.use-case';

describe('GetGenreUseCase Integration Tests', () => {
  let useCase: GetGenreUseCase;
  let repository: GenreElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new GenreElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new GetGenreUseCase(repository);
  });

  it('should throws error when aggregate not found', async () => {
    const genreId = new GenreId();
    await expect(() => useCase.execute({ id: genreId.id })).rejects.toThrow(
      new NotFoundError(genreId.id, Genre),
    );

    const genre = Genre.fake().aGenre().build();
    genre.markAsDeleted();
    await repository.insert(genre);

    await expect(() =>
      useCase.execute({ id: genre.genre_id.id }),
    ).rejects.toThrow(new NotFoundError(genre.genre_id.id, Genre));
  });

  it('should return a genre', async () => {
    const genre = Genre.fake().aGenre().build();
    await repository.insert(genre);
    const output = await useCase.execute({ id: genre.genre_id.id });
    expect(output).toStrictEqual({
      id: genre.genre_id.id,
      name: genre.name,
      categories: Array.from(genre.categories.values()).map((category) => {
        return {
          id: category.category_id.id,
          name: category.name,
          is_active: category.is_active,
          deleted_at: category.deleted_at,
        };
      }),
      is_active: genre.is_active,
      created_at: genre.created_at,
    });
  });
});
