import { CategoryElasticSearchRepository } from '../category-elastic-search';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';

describe('CategoryElasticSearchRepository Integration Tests', () => {
  const esHelper = setupElasticsearch();
  let repository: CategoryElasticSearchRepository;

  beforeEach(async () => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
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
    const entity = await repository.findById(category.category_id);
    expect(entity!.toJSON()).toStrictEqual(category.toJSON());
  });

  test('should insert many entities', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const { exists: foundCategories } = await repository.findByIds(
      categories.map((g) => g.category_id),
    );
    expect(foundCategories.length).toBe(2);
    expect(foundCategories[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(foundCategories[1].toJSON()).toStrictEqual(categories[1].toJSON());
  });

  it('should find a entity by id', async () => {
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

    entity.markAsDeleted();

    await repository.update(entity);
    await expect(
      repository.ignoreSoftDeleted().findById(entity.category_id),
    ).resolves.toBeNull();
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

    entity.markAsDeleted();
    await repository.update(entity);

    expect(
      repository
        .ignoreSoftDeleted()
        .findOneBy({ category_id: entity.category_id }),
    ).resolves.toBeNull();
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

    categories[0].markAsDeleted();
    await repository.update(categories[0]);

    entities = await repository.ignoreSoftDeleted().findBy(
      { is_active: true },
      {
        field: 'name',
        direction: 'asc',
      },
    );

    expect(entities).toStrictEqual([categories[1]]);
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

    entity.markAsDeleted();

    await repository.update(entity);

    entities = await repository
      .ignoreSoftDeleted()
      .findBy({ category_id: entity.category_id });
    expect(entities).toHaveLength(0);
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
    let entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entity.markAsDeleted();

    await repository.update(entity);
    entities = await repository.ignoreSoftDeleted().findAll();
    expect(entities).toHaveLength(0);
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

    categories[0].markAsDeleted();
    categories[1].markAsDeleted();

    Promise.all([
      await repository.update(categories[0]),
      await repository.update(categories[1]),
    ]);

    const { exists: foundCategories2 } = await repository
      .ignoreSoftDeleted()
      .findByIds(categories.map((g) => g.category_id));
    expect(foundCategories2.length).toBe(0);
  });

  it('should return category id that exists', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);

    await repository.insert(category);
    const existsResult1 = await repository.existsById([category.category_id]);
    expect(existsResult1.exists[0]).toBeValueObject(category.category_id);
    expect(existsResult1.not_exists).toHaveLength(0);

    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    const notExistsResult = await repository.existsById([
      categoryId1,
      categoryId2,
    ]);
    expect(notExistsResult.exists).toHaveLength(0);
    expect(notExistsResult.not_exists).toHaveLength(2);
    expect(notExistsResult.not_exists[0]).toBeValueObject(categoryId1);
    expect(notExistsResult.not_exists[1]).toBeValueObject(categoryId2);

    const existsResult2 = await repository.existsById([
      category.category_id,
      categoryId1,
    ]);

    expect(existsResult2.exists).toHaveLength(1);
    expect(existsResult2.not_exists).toHaveLength(1);
    expect(existsResult2.exists[0]).toBeValueObject(category.category_id);
    expect(existsResult2.not_exists[0]).toBeValueObject(categoryId1);

    category.markAsDeleted();

    await repository.update(category);
    const existsResult3 = await repository
      .ignoreSoftDeleted()
      .existsById([category.category_id]);
    expect(existsResult3.exists).toHaveLength(0);
    expect(existsResult3.not_exists).toHaveLength(1);
    expect(existsResult3.not_exists[0]).toBeValueObject(category.category_id);
  });

  test('hasOnlyOneActivateInRelated method', async () => {
    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    const categoryId3 = new CategoryId();
    const categoryId4 = new CategoryId();
    await esHelper.esClient.bulk({
      index: esHelper.indexName,
      body: [
        {
          index: {
            _id: '1',
          },
        },
        {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: true,
              deleted_at: null,
            },
            {
              category_id: categoryId2.id,
              category_name: 'Movie 2',
              is_active: false,
              deleted_at: null,
            },
          ],
        },
        {
          index: {
            _id: '2',
          },
        },
        {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: true,
              deleted_at: null,
            },
            {
              category_id: categoryId3.id,
              category_name: 'Movie 3',
              is_active: true,
              deleted_at: null,
            },
          ],
        },
        {
          index: {
            _id: '3',
          },
        },
        {
          categories: [
            {
              category_id: categoryId3.id,
              category_name: 'Movie 3',
              is_active: true,
              deleted_at: null,
            },
            {
              category_id: categoryId4.id,
              category_name: 'Movie 4',
              is_active: false,
              deleted_at: null,
            },
          ],
        },
        {
          index: {
            _id: '4',
          },
        },
        {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: false,
              deleted_at: null,
            },
            {
              category_id: categoryId2.id,
              category_name: 'Movie 2',
              is_active: true,
              deleted_at: null,
            },
          ],
        },
      ],
      refresh: true,
    });

    const result = await repository.hasOnlyOneActivateInRelated(categoryId1);
    expect(result).toBe(true);

    //update category 1 to inactive
    await esHelper.esClient.update({
      index: esHelper.indexName,
      id: '1',
      body: {
        doc: {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: true,
              deleted_at: new Date(),
            },
            {
              category_id: categoryId2.id,
              category_name: 'Movie 2',
              is_active: false,
            },
          ],
        },
      },
      refresh: true,
    });

    const result2 = await repository.hasOnlyOneActivateInRelated(categoryId1);
    expect(result2).toBe(false);
  });

  test('hasOnlyOneNotDeletedInRelated method', async () => {
    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    const categoryId3 = new CategoryId();
    const categoryId4 = new CategoryId();
    await esHelper.esClient.bulk({
      index: esHelper.indexName,
      body: [
        {
          index: {
            _id: '1',
          },
        },
        {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: true,
              deleted_at: null,
              is_deleted: false,
            },
            {
              category_id: categoryId2.id,
              category_name: 'Movie 2',
              is_active: false,
              deleted_at: null,
              is_deleted: false,
            },
          ],
        },
        {
          index: {
            _id: '2',
          },
        },
        {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: true,
              deleted_at: null,
              is_deleted: false,
            },
            {
              category_id: categoryId3.id,
              category_name: 'Movie 3',
              is_active: true,
              deleted_at: null,
              is_deleted: false,
            },
          ],
        },
        {
          index: {
            _id: '3',
          },
        },
        {
          categories: [
            {
              category_id: categoryId3.id,
              category_name: 'Movie 3',
              is_active: true,
              deleted_at: null,
              is_deleted: false,
            },
            {
              category_id: categoryId4.id,
              category_name: 'Movie 4',
              is_active: false,
              deleted_at: null,
              is_deleted: false,
            },
          ],
        },
        {
          index: {
            _id: '4',
          },
        },
        {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: false,
              deleted_at: null,
              is_deleted: false,
            },
            {
              category_id: categoryId2.id,
              category_name: 'Movie 2',
              is_active: true,
              deleted_at: null,
              is_deleted: false,
            },
          ],
        },
      ],
      refresh: true,
    });

    const result = await repository.hasOnlyOneNotDeletedInRelated(categoryId1);
    expect(result).toBe(false);

    //update category 1 to deleted
    await esHelper.esClient.update({
      index: esHelper.indexName,
      id: '1',
      body: {
        doc: {
          categories: [
            {
              category_id: categoryId1.id,
              category_name: 'Movie 1',
              is_active: true,
              deleted_at: null,
              is_deleted: false,
            },
            {
              category_id: categoryId2.id,
              category_name: 'Movie 2',
              is_active: false,
              deleted_at: new Date(),
              is_deleted: true,
            },
          ],
        },
      },
      refresh: true,
    });

    const result2 = await repository.hasOnlyOneNotDeletedInRelated(categoryId1);
    expect(result2).toBe(true);
  });

  it('should throw error on update when a entity not found', async () => {
    const entity = Category.fake().aCategory().build();
    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.category_id.id, Category),
    );

    entity.markAsDeleted();
    await repository.insert(entity);
    await expect(repository.ignoreSoftDeleted().update(entity)).rejects.toThrow(
      new NotFoundError(entity.category_id.id, Category),
    );
  });

  it('should update a entity', async () => {
    const entity = Category.fake().aCategory().build();
    await repository.insert(entity);

    entity.changeName('Movie updated');
    await repository.update(entity);

    const entityFound = await repository.findById(entity.category_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should throw error on delete when a entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(repository.delete(categoryId)).rejects.toThrow(
      new NotFoundError(categoryId.id, Category),
    );

    const category = Category.fake().aCategory().build();
    category.markAsDeleted();
    await repository.insert(category);

    await expect(
      repository.ignoreSoftDeleted().delete(category.category_id),
    ).rejects.toThrow(new NotFoundError(category.category_id, Category));
  });

  it('should delete a entity', async () => {
    const entity = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);

    await repository.delete(entity.category_id);
    await expect(repository.findById(entity.category_id)).resolves.toBeNull();
  });
});
