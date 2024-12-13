import { CastMember } from '../../../../cast-member/domain/cast-member.aggregate';
import { Category } from '../../../../category/domain/category.aggregate';
import { Genre } from '../../../../genre/domain/genre.aggregate';
import { Rating } from '../../../domain/rating.vo';
import { Video, VideoId } from '../../../domain/video.aggregate';
import { VideoOutputMapper } from './video-output';

describe('VideoOutputMapper Unit Tests', () => {
  it('should convert a video in output', () => {
    const categories = Category.fake().theNestedCategories(3).build();
    const genres = Genre.fake().theNestedGenres(3).build();
    const castMembers = CastMember.fake().theNestedDirectors(3).build();
    const video = Video.create({
      video_id: new VideoId(),
      title: 'any_title',
      description: 'any_description',
      year_launched: 2021,
      duration: 90,
      rating: Rating.create10(),
      is_opened: true,
      is_published: true,
      banner_url: 'any_banner_url',
      thumbnail_url: 'any_thumbnail_url',
      thumbnail_half_url: 'any_thumbnail_half_url',
      trailer_url: 'any_trailer_url',
      video_url: 'any_video_url',
      categories_props: categories.map((category) => ({
        category_id: category.category_id,
        name: category.name,
        is_active: category.is_active,
        deleted_at: category.deleted_at,
      })),
      genres_props: genres.map((genre) => ({
        genre_id: genre.genre_id,
        name: genre.name,
        is_active: genre.is_active,
        deleted_at: genre.deleted_at,
      })),
      cast_members_props: castMembers.map((castMember) => ({
        cast_member_id: castMember.cast_member_id,
        name: castMember.name,
        type: castMember.type,
      })),
      created_at: new Date(),
    });

    const output = VideoOutputMapper.toOutput(video);

    expect(output).toEqual({
      id: video.video_id.id,
      title: video.title,
      description: video.description,
      year_launched: video.year_launched,
      duration: video.duration,
      rating: video.rating.value,
      is_opened: video.is_opened,
      is_published: video.is_published,
      banner_url: video.banner_url,
      thumbnail_url: video.thumbnail_url,
      thumbnail_half_url: video.thumbnail_half_url,
      trailer_url: video.trailer_url,
      video_url: video.video_url,
      categories: categories.map((category) => ({
        id: category.category_id.id,
        name: category.name,
        is_active: category.is_active,
        deleted_at: category.deleted_at,
      })),
      genres: genres.map((genre) => ({
        id: genre.genre_id.id,
        name: genre.name,
        is_active: genre.is_active,
        deleted_at: genre.deleted_at,
      })),
      cast_members: castMembers.map((castMember) => ({
        id: castMember.cast_member_id.id,
        name: castMember.name,
        type: castMember.type.type,
      })),
      created_at: video.created_at,
    });
  });
});
