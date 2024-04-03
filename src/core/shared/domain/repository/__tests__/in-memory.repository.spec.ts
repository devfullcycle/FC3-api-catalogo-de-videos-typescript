import { AggregateRoot } from '../../aggregate-root';
import { NotFoundError } from '../../errors/not-found.error';
import { Uuid } from '../../value-objects/uuid.vo';
import { InMemoryRepository } from '../in-memory.repository';

type StubAggregateConstructorProps = {
  entity_id?: Uuid;
  name: string;
  price: number;
};

class StubAggregate extends AggregateRoot {
  entity_id: Uuid;
  name: string;
  price: number;
  constructor(props: StubAggregateConstructorProps) {
    super();
    this.entity_id = props.entity_id ?? new Uuid();
    this.name = props.name;
    this.price = +props.price;
  }

  toJSON() {
    return {
      id: this.entity_id.id,
      name: this.name,
      price: this.price,
    };
  }
}

class StubInMemoryRepository extends InMemoryRepository<StubAggregate, Uuid> {
  getEntity(): new (...args: any[]) => StubAggregate {
    return StubAggregate;
  }
}

describe('InMemoryRepository Unit Tests', () => {
  let repository: StubInMemoryRepository;
  beforeEach(() => (repository = new StubInMemoryRepository()));
  it('should inserts a new entity', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    expect(entity.toJSON()).toStrictEqual(repository.items[0].toJSON());
  });

  it('should find a entity by id', async () => {
    let entityFound = await repository.findById(new Uuid());
    expect(entityFound).toBeNull();

    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);

    entityFound = await repository.findById(entity.entity_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should find a entity by filter', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);

    let entityFound = await repository.findOneBy({ name: 'name value' });
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    entityFound = await repository.findOneBy({ name: 'not found' });
    expect(entityFound).toBeNull();
  });

  it('should find entities by filter', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);

    let entitiesFound = await repository.findBy({ name: 'name value' });
    expect(entitiesFound).toStrictEqual([entity]);

    entitiesFound = await repository.findBy({ name: 'not found' });
    expect(entitiesFound).toStrictEqual([]);
  });

  it('should find entities by filter and order', async () => {
    const entity1 = new StubAggregate({ name: 'name value', price: 5 });
    const entity2 = new StubAggregate({ name: 'name value', price: 10 });
    await repository.bulkInsert([entity1, entity2]);

    let entitiesFound = await repository.findBy(
      { name: 'name value' },
      { field: 'price', direction: 'asc' },
    );
    expect(entitiesFound).toStrictEqual([entity1, entity2]);

    entitiesFound = await repository.findBy(
      { name: 'name value' },
      { field: 'price', direction: 'desc' },
    );
    expect(entitiesFound).toStrictEqual([entity2, entity1]);
  });

  it('should returns all entities', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);

    const entities = await repository.findAll();

    expect(entities).toStrictEqual([entity]);
  });

  it('should throws error on update when entity not found', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.entity_id, StubAggregate),
    );
  });

  it('should updates an entity', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);

    const entityUpdated = new StubAggregate({
      entity_id: entity.entity_id,
      name: 'updated',
      price: 1,
    });
    await repository.update(entityUpdated);
    expect(entityUpdated.toJSON()).toStrictEqual(repository.items[0].toJSON());
  });

  it('should throws error on delete when entity not found', async () => {
    const uuid = new Uuid();
    expect(repository.delete(uuid)).rejects.toThrow(
      new NotFoundError(uuid.id, StubAggregate),
    );

    expect(
      repository.delete(new Uuid('9366b7dc-2d71-4799-b91c-c64adb205104')),
    ).rejects.toThrow(
      new NotFoundError('9366b7dc-2d71-4799-b91c-c64adb205104', StubAggregate),
    );
  });

  it('should deletes an entity', async () => {
    const entity1 = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity1);

    await repository.delete(entity1.entity_id);
    expect(repository.items).toHaveLength(0);
  });
});
