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

  it('should finds a entity by id', async () => {
    let entityFound = await repository.findById(new CategoryId());
    expect(entityFound).toBeNull();

    const entity = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);
    entityFound = await repository.findById(entity.category_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should find a entity by filter', async () => {
    const entity = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);

    let entityFound = await repository.findOneBy({
      category_id: entity.category_id,
    });
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    expect(repository.findOneBy({ is_active: true })).resolves.toBeNull();

    entityFound = await repository.findOneBy({
      category_id: entity.category_id,
      is_active: false,
    });
    expect(entityFound?.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should find entities by filter and order', async () => {
    const categories = [
      Category.fake().aCategory().withName('a').build(),
      Category.fake().aCategory().withName('b').build(),
    ];

    await repository.bulkInsert(categories);

    let entities = await repository.findBy(
      { is_active: true },
      {
        field: 'name',
        direction: 'asc',
      },
    );

    expect(entities).toStrictEqual([categories[0], categories[1]]);

    entities = await repository.findBy(
      { is_active: true },
      {
        field: 'name',
        direction: 'desc',
      },
    );

    expect(entities).toStrictEqual([categories[1], categories[0]]);
  });

  it('should find entities by filter', async () => {
    const entity = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);

    let entities = await repository.findBy({ category_id: entity.category_id });
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entities = await repository.findBy({ is_active: true });
    expect(entities).toHaveLength(0);

    entities = await repository.findBy({
      category_id: entity.category_id,
      is_active: false,
    });
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));
  });

  it('should return all categories', async () => {
    const entity = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);
    const entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));
  });

  it('should return a categories list by ids', async () => {
    const categories = Category.fake().theCategories(2).build();

    await repository.bulkInsert(categories);
    const { exists: foundCategories } = await repository.findByIds(
      categories.map((g) => g.category_id),
    );
    expect(foundCategories.length).toBe(2);
    expect(foundCategories[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(foundCategories[1].toJSON()).toStrictEqual(categories[1].toJSON());
  });
});
