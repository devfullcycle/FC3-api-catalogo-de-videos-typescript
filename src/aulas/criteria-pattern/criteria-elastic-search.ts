import { QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticsearchContainer } from '@testcontainers/elasticsearch';
import { CategoryElasticSearchRepository } from '../../core/category/infra/db/elastic-search/category-elastic-search';
import { esMapping } from '../../core/shared/infra/db/elastic-search/es-mapping';
import { Category } from '../../core/category/domain/category.aggregate';

interface ICriteria {
  applyCriteria(context: any): any;
}

class FindByNameCriteria implements ICriteria {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  applyCriteria(query: QueryDslQueryContainer): QueryDslQueryContainer {
    return {
      ...query,
      bool: {
        ...query.bool,
        must: [
          ...(query.bool?.must
            ? typeof query.bool.must === 'object'
              ? [query.bool.must as QueryDslQueryContainer]
              : query.bool.must
            : []),
          {
            match: {
              category_name: this.name,
            },
          },
        ],
      },
    };
  }
}

class FindByDescriptionCriteria implements ICriteria {
  private description: string;

  constructor(description: string) {
    this.description = description;
  }

  applyCriteria(query: QueryDslQueryContainer): QueryDslQueryContainer {
    return {
      ...query,
      bool: {
        ...query.bool,
        must: [
          ...(query.bool?.must
            ? Array.isArray(query.bool.must)
              ? query.bool.must
              : [query.bool.must as QueryDslQueryContainer]
            : []),
          {
            match: {
              category_description: this.description,
            },
          },
        ],
      },
    };
  }
}

class AndCriteria implements ICriteria {
  private criterias: ICriteria[];

  constructor(criterias: ICriteria[]) {
    this.criterias = criterias;
  }

  applyCriteria(query: QueryDslQueryContainer): QueryDslQueryContainer {
    return this.criterias.reduce(
      (acc, criteria) => criteria.applyCriteria(acc),
      query,
    );
  }
}

async function main() {
  const container = new ElasticsearchContainer(
    'elasticsearch:7.17.7',
  ).withReuse();
  const startedContainer = await container.start();
  const esClient = new ElasticsearchService({
    node: `http://${startedContainer.getHost()}:${startedContainer.getMappedPort(9200)}`,
  });
  await esClient.indices.delete({ index: 'categories' });
  await esClient.indices.create({
    index: 'categories',
    body: {
      mappings: esMapping,
    },
  });
  const repository = new CategoryElasticSearchRepository(
    esClient,
    'categories',
  );
  const category1 = Category.fake().aCategory().withName('Category 1').build();
  const category2 = Category.fake().aCategory().withName('Category 2').build();
  const category3 = Category.fake().aCategory().withName('Category 3').build();
  const category4 = Category.fake().aCategory().withName('Category 4').build();
  await repository.bulkInsert([category1, category2, category3, category4]);
  const findByNameCriteria = new FindByNameCriteria('Category 2');
  let result = await repository.searchByCriteria([findByNameCriteria]);
  console.log(result);
  const findByDescriptionCriteria = new FindByDescriptionCriteria(
    'Description 4',
  );

  let byNameAndDescription = new AndCriteria([
    findByNameCriteria,
    findByDescriptionCriteria,
  ]);
  result = await repository.searchByCriteria([byNameAndDescription]);
  console.log(result);

  byNameAndDescription = new AndCriteria([
    findByNameCriteria,
    new FindByDescriptionCriteria(category2.description!),
  ]);

  result = await repository.searchByCriteria([byNameAndDescription]);
  console.log(result);
}

main();
