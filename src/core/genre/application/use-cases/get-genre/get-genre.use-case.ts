import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Genre, GenreId } from '../../../domain/genre.aggregate';
import { IGenreRepository } from '../../../domain/genre.repository';
import { GenreOutput, GenreOutputMapper } from '../common/genre-output';

export class GetGenreUseCase
  implements IUseCase<GetGenreInput, GetGenreOutput>
{
  constructor(private genreRepo: IGenreRepository) {}

  async execute(input: GetGenreInput): Promise<GetGenreOutput> {
    const genreId = new GenreId(input.id);
    const genre = await this.genreRepo.ignoreSoftDeleted().findOneBy({
      genre_id: genreId,
      is_active: true,
    });
    if (!genre) {
      throw new NotFoundError(input.id, Genre);
    }

    return GenreOutputMapper.toOutput(genre);
  }
}

export type GetGenreInput = {
  id: string;
};

export type GetGenreOutput = GenreOutput;
