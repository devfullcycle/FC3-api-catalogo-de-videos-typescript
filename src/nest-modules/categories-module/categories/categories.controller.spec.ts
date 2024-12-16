import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesConsumer } from './categories.consumer';

describe('CategoriesController', () => {
  let controller: CategoriesConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesConsumer],
    }).compile();

    controller = module.get<CategoriesConsumer>(CategoriesConsumer);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
