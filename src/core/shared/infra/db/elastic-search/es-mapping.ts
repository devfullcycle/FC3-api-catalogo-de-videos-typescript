import { MappingTypeMapping } from '@elastic/elasticsearch/api/types';

//1 index = categories, genres, cast_members, videos

export const esMapping: MappingTypeMapping = {
  properties: {
    type: {
      type: 'keyword',
    },
    category_name: {
      type: 'keyword',
    },
    category_description: {
      type: 'text',
    },
    cast_member_name: { type: 'keyword' },
    cast_member_type: { type: 'integer' },
    genre_name: { type: 'keyword' },
    categories: {
      type: 'nested',
      properties: {
        category_id: { type: 'keyword' },
        category_name: { type: 'keyword' },
        is_active: { type: 'boolean', copy_to: 'categories__is_active' },
        deleted_at: { type: 'date' },
        is_deleted: { type: 'boolean', copy_to: 'categories__is_deleted' },
      },
    },
    categories__is_active: { type: 'boolean' },
    categories__is_deleted: { type: 'boolean' },
    is_active: {
      type: 'boolean',
    },
    created_at: {
      type: 'date',
    },
    deleted_at: {
      type: 'date',
    },
    genres: {
      type: 'nested',
      properties: {
        genre_id: { type: 'keyword' },
        genre_name: { type: 'keyword' },
        is_active: { type: 'boolean', copy_to: 'genres__is_active' },
        deleted_at: { type: 'date' },
        is_deleted: { type: 'boolean', copy_to: 'genres__is_deleted' },
      },
    },
    genres__is_deleted: { type: 'boolean' },
    genres__is_active: { type: 'boolean' },
    cast_members: {
      type: 'nested',
      properties: {
        cast_member_id: { type: 'keyword' },
        cast_member_name: { type: 'keyword' },
        cast_member_type: { type: 'integer' },
        deleted_at: { type: 'date' },
        is_deleted: { type: 'boolean', copy_to: 'cast_members__is_deleted' },
      },
    },
    cast_members__is_deleted: { type: 'boolean' },
    video_title: { type: 'text', analyzer: 'ngram_analyzer' },
    video_title_keyword: { type: 'keyword' },
    video_description: { type: 'text', analyzer: 'ngram_analyzer' },
    year_launched: { type: 'integer' },
    duration: { type: 'integer' },
    rating: { type: 'keyword' },
    is_opened: { type: 'boolean' },
    is_published: { type: 'boolean' },
    banner_url: { type: 'keyword' },
    thumbnail_url: { type: 'keyword' },
    thumbnail_half_url: { type: 'keyword' },
    trailer_url: { type: 'keyword' },
    video_url: { type: 'keyword' },
  },
};
