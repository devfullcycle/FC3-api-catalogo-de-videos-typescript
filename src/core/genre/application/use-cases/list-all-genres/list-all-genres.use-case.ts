import { GenreOutput, GenreOutputMapper } from '../common/genre-output';
import { IUseCase } from '../../../../shared/application/use-case-interface';
import { IGenreRepository } from '../../../domain/genre.repository';
import { SearchInput } from '../../../../shared/application/search-input';

export class ListAllGenresUseCase
  implements IUseCase<ListGenresInput, ListGenresOutput>
{
  constructor(private genreRepo: IGenreRepository) {}

  async execute(): Promise<ListGenresOutput> {
    const genres = await this.genreRepo.ignoreSoftDeleted().findBy(
      {
        is_active: true,
      },
      { field: 'name', direction: 'asc' },
    );
    return genres.map(GenreOutputMapper.toOutput);
  }
}

export type ListGenresInput = SearchInput;

export type ListGenresOutput = GenreOutput[];
