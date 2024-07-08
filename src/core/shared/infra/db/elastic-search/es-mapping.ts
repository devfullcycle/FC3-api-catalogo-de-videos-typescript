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
    is_active: {
      type: 'boolean',
    },
    created_at: {
      type: 'date',
    },
  },
};
