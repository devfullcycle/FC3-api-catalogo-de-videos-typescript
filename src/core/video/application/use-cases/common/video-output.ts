import { Video } from '../../../domain/video.aggregate';

export type VideoOutput = {
  id: string;
  title: string;
  description: string;
  year_launched: number;
  duration: number;
  rating: string;
  is_opened: boolean;
  is_published: boolean;
  banner_url: string | null;
  thumbnail_url: string | null;
  thumbnail_half_url: string | null;
  trailer_url: string;
  video_url: string;
  categories: {
    id: string;
    name: string;
    is_active: boolean;
    deleted_at: Date | null;
  }[];
  genres: {
    id: string;
    name: string;
    is_active: boolean;
    deleted_at: Date | null;
  }[];
  cast_members: {
    id: string;
    name: string;
    type: number;
  }[];
  created_at: Date;
};

export class VideoOutputMapper {
  static toOutput(entity: Video): VideoOutput {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { video_id, deleted_at, ...other_props } = entity.toJSON();
    return {
      ...other_props,
      rating: entity.rating.value,
      id: video_id,
      categories: Array.from(entity.categories.values()).map((category) => {
        return {
          id: category.category_id.id,
          name: category.name,
          is_active: category.is_active,
          deleted_at: category.deleted_at,
        };
      }),
      genres: Array.from(entity.genres.values()).map((genre) => {
        return {
          id: genre.genre_id.id,
          name: genre.name,
          is_active: genre.is_active,
          deleted_at: genre.deleted_at,
        };
      }),
      cast_members: Array.from(entity.cast_members.values()).map(
        (cast_member) => {
          return {
            id: cast_member.cast_member_id.id,
            name: cast_member.name,
            type: cast_member.type.type,
          };
        },
      ),
    };
  }
}
