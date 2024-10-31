import { IRepository } from '../../shared/domain/repository/repository.interface';
import { Genre, GenreId } from './genre.aggregate';

export interface IGenreRepository extends IRepository<Genre, GenreId> {}
