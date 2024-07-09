import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  CategoryElasticSearchMapper,
  CategoryElasticSearchRepository,
} from '../category-elastic-search';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { esMapping } from '../../../../../shared/infra/db/elastic-search/es-mapping';

describe('CategoryElasticSearchRepository Integration Tests', () => {
  const esClient: ElasticsearchService = new ElasticsearchService({
    node: 'http://elasticsearch:9200',
  });
  let repository: CategoryElasticSearchRepository;

  beforeEach(async () => {
    try {
      await esClient.indices.delete({
        index: 'categories',
      });
    } catch (e) {}
    const result = await esClient.indices.create({
      index: 'categories',
    });
    //apply mapping
    await esClient.indices.putMapping({
      index: 'categories',
      body: esMapping,
    });
    console.log(result);
    repository = new CategoryElasticSearchRepository(esClient, 'categories');
  });

  test('should inserts a new entity', async () => {
    const category = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(category);
    //const entity = await repository.findById(category.category_id);
    const document = await esClient.get({
      index: 'categories',
      id: category.category_id.id,
    });
    console.log(document);
    const entity = CategoryElasticSearchMapper.toEntity(
      category.category_id.id,
      document.body._source,
    );
    expect(entity!.toJSON()).toStrictEqual(category.toJSON());
  });

  test('should insert many entities', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const result = await Promise.all(
      categories.map((c) =>
        esClient.get({ index: 'categories', id: c.category_id.id }),
      ),
    );
    const foundCategories = result.map((r) =>
      CategoryElasticSearchMapper.toEntity(r.body._id, r.body._source),
    );
    // const { exists: foundCategories } = await repository.findByIds(
    //   categories.map((g) => g.category_id),
    // );
    expect(foundCategories.length).toBe(2);
    expect(foundCategories[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(foundCategories[1].toJSON()).toStrictEqual(categories[1].toJSON());
  });
});
