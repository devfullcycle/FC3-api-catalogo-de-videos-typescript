import { DeleteGenreUseCase } from '../delete-genre.use-case';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Genre, GenreId } from '../../../../domain/genre.aggregate';
import { GenreElasticSearchRepository } from '../../../../infra/db/elastic-search/genre-elastic-search';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';

describe('DeleteGenreUseCase Integration Tests', () => {
  let useCase: DeleteGenreUseCase;
  let repository: GenreElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new GenreElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new DeleteGenreUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const genreId = new GenreId();
    await expect(() => useCase.execute(genreId.id)).rejects.toThrow(
      new NotFoundError(genreId.id, Genre),
    );
  });

  it('should delete a genre', async () => {
    const genre = Genre.fake().aGenre().build();
    await repository.insert(genre);
    await useCase.execute(genre.genre_id.id);
    const noEntity = await repository
      .ignoreSoftDeleted()
      .findById(genre.genre_id);
    expect(noEntity).toBeNull();
  });
});
