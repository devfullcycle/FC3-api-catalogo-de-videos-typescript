import { QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { ICriteria } from '../../../domain/repository/criteria.interface';

export class SoftDeleteElasticSearchCriteria implements ICriteria {
  applyCriteria(query: QueryDslQueryContainer): QueryDslQueryContainer {
    return {
      ...query,
      bool: {
        ...query.bool,
        must_not: [
          {
            ...(query.bool?.must_not
              ? typeof query.bool.must_not === 'object'
                ? [query.bool.must_not as QueryDslQueryContainer]
                : query.bool.must_not
              : []),
            exists: {
              field: 'deleted_at',
            },
          },
        ],
      },
    };
  }
}
