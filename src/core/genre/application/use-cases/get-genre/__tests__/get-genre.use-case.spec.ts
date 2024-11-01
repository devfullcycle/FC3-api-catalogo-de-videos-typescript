import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Genre, GenreId } from '../../../../domain/genre.aggregate';
import { GenreInMemoryRepository } from '../../../../infra/db/in-memory/genre-in-memory.repository';
import { GetGenreUseCase } from '../get-genre.use-case';

describe('GetGenreUseCase Unit Tests', () => {
  let useCase: GetGenreUseCase;
  let repository: GenreInMemoryRepository;

  beforeEach(() => {
    repository = new GenreInMemoryRepository();
    useCase = new GetGenreUseCase(repository);
  });

  it('should throws error when aggregate not found', async () => {
    const genreId = new GenreId();
    await expect(() => useCase.execute({ id: genreId.id })).rejects.toThrow(
      new NotFoundError(genreId.id, Genre),
    );
  });

  it('should return a genre', async () => {
    const genre = Genre.fake().aGenre().build();
    await repository.insert(genre);

    const genreOutput = await useCase.execute({
      id: genre.genre_id.id,
    });

    expect(genreOutput).toEqual({
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
