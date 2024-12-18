import { CategoriesConsumer } from '../categories.consumer';
import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { SaveCategoryUseCase } from '../../../../core/category/application/use-cases/save-category/save-category.use-case';
import { DeleteCategoryUseCase } from '../../../../core/category/application/use-cases/delete-category/delete-category.use-case';
import { CDCOperation } from '../../../kafka-module/cdc.dto';

describe('CategoriesConsumer Unit Tests', () => {
  let categoriesConsumer: CategoriesConsumer;
  let saveCategoryUseCase: SaveCategoryUseCase;
  let deleteCategoryUseCase: DeleteCategoryUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesConsumer],
      providers: [SaveCategoryUseCase, DeleteCategoryUseCase],
    })
      .overrideProvider(SaveCategoryUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .overrideProvider(DeleteCategoryUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .compile();

    categoriesConsumer = module.get<CategoriesConsumer>(CategoriesConsumer);
    saveCategoryUseCase = module.get<SaveCategoryUseCase>(SaveCategoryUseCase);
    deleteCategoryUseCase = module.get<DeleteCategoryUseCase>(
      DeleteCategoryUseCase,
    );
  });

  describe('handle', () => {
    it('should log a message when the event is a read event', async () => {
      const loggerSpy = jest.spyOn(categoriesConsumer['logger'], 'log');
      const message = {
        op: 'r',
      } as any;

      await categoriesConsumer.handle(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [CategoriesConsumer] - Discarding read operation',
      );
    });

    describe('should call saveUseCase.execute when the event is a create or update event', () => {
      const repeatedProps = {
        category_id: '6e8e2e8e-4b6e-4f3e-8f3c-3f3e8e3e8e3e',
        name: 'category',
        description: 'description',
        is_active: true,
        created_at: '2021-08-25T00:00:00.000Z',
      };
      const arrange = [
        {
          op: CDCOperation.CREATE,
          before: null,
          after: repeatedProps,
        },
        {
          op: CDCOperation.CREATE,
          before: null,
          after: {
            ...repeatedProps,
            is_active: false,
          },
        },
        {
          op: CDCOperation.CREATE,
          before: null,
          after: {
            ...repeatedProps,
            is_active: 'true',
          },
        },
        {
          op: CDCOperation.CREATE,
          before: null,
          after: {
            ...repeatedProps,
            is_active: 'false',
          },
        },
        {
          op: CDCOperation.CREATE,
          before: null,
          after: {
            ...repeatedProps,
            is_active: '1',
          },
        },
        {
          op: CDCOperation.CREATE,
          before: null,
          after: {
            ...repeatedProps,
            is_active: '0',
          },
        },
        {
          op: CDCOperation.CREATE,
          before: null,
          after: {
            ...repeatedProps,
            created_at: '2021-08-25T00:00:00.000Z',
          },
        },
        {
          op: CDCOperation.UPDATE,
          before: {
            category_id: '6e8e2e8e-4b6e-4f3e-8f3c-3f3e8e3e8e3e',
            name: 'category',
            description: 'description',
            is_active: true,
            created_at: '2021-08-25T00:00:00.000Z',
          },
          after: {
            category_id: '6e8e2e8e-4b6e-4f3e-8f3c-3f3e8e3e8e3e',
            name: 'category changed',
            description: 'description changed',
            is_active: true,
            created_at: '2022-08-25T00:00:00.000Z',
          },
        },
      ];

      it.each(arrange)('message: %j', async (message) => {
        const saveUseCaseSpy = jest.spyOn(saveCategoryUseCase, 'execute');

        await categoriesConsumer.handle(message);

        expect(saveUseCaseSpy).toHaveBeenCalledWith({
          category_id: message.after.category_id,
          name: message.after.name,
          description: message.after.description,
          is_active:
            message.after.is_active === 'true' ||
            message.after.is_active === true ||
            //@ts-expect-error after.is_active is a string
            message.after.is_active === 1 ||
            message.after.is_active === '1',
          created_at: new Date(message.after.created_at),
        });
      });
    });

    it('should call deleteUseCase.execute when the event is a delete event', async () => {
      const deleteUseCaseSpy = jest.spyOn(deleteCategoryUseCase, 'execute');
      const message = {
        op: CDCOperation.DELETE,
        before: {
          category_id: 1,
        },
        after: null,
      };

      await categoriesConsumer.handle(message);

      expect(deleteUseCaseSpy).toHaveBeenCalledWith({
        id: message.before.category_id,
      });
    });

    describe('should throw an error when the event is not a valid operation', () => {
      const repeatedErrors = [
        'name should not be empty',
        'name must be a string',
        'is_active should not be empty',
        'created_at must be a Date instance or a valid date string',
      ];
      const arrange = [
        {
          message: {
            op: CDCOperation.CREATE,
            after: null,
          },
          expectedErrors: repeatedErrors,
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {},
          },
          expectedErrors: repeatedErrors,
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              category_id: 1,
            },
          },
          expectedErrors: [
            'category_id must be a string',
            'category_id must be a UUID',
            ...repeatedErrors,
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              name: 1,
            },
          },
          expectedErrors: [
            'name must be a string',
            'created_at must be a Date instance or a valid date string',
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              name: 1,
            },
          },
          expectedErrors: [
            'name must be a string',
            'created_at must be a Date instance or a valid date string',
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              description: 1,
            },
          },
          expectedErrors: ['description must be a string', ...repeatedErrors],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              is_active: 'a',
            },
          },
          expectedErrors: [
            'name should not be empty',
            'name must be a string',
            'is_active must be a boolean value',
            'created_at must be a Date instance or a valid date string',
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              created_at: 'a',
            },
          },
          expectedErrors: [
            'name should not be empty',
            'name must be a string',
            'created_at must be a Date instance or a valid date string',
          ],
        },
      ];

      it.each(arrange)('message: %j', async ({ message, expectedErrors }) => {
        try {
          await categoriesConsumer.handle(message as any);
        } catch (e) {
          const error: UnprocessableEntityException = e;
          expect(e).toBeInstanceOf(UnprocessableEntityException);
          expect(error.getStatus()).toBe(422);
          //@ts-expect-error error.getResponse() is an object
          expect(error.getResponse().message).toMatchObject(
            expect.arrayContaining(expectedErrors),
          );
        }
      });
    });
  });
});
