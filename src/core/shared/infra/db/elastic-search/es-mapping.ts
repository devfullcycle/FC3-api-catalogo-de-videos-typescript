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
  },
};
