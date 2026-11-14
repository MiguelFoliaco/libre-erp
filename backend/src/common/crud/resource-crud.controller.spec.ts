import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '../../auth/auth.guard';
import { CrudService } from './crud.service';
import { createResourceControllers } from './resource-crud.controller';
import { CATALOG_RESOURCES } from '../../modules/catalog/resources';

describe('resource CRUD controllers', () => {
  let app: INestApplication;
  const crudService = {
    list: vi.fn().mockResolvedValue({ items: [], limit: 50, offset: 0 }),
    get: vi.fn().mockResolvedValue({ id: 'record-id' }),
    create: vi.fn().mockResolvedValue({ id: 'record-id' }),
    update: vi.fn().mockResolvedValue({ id: 'record-id' }),
    remove: vi.fn().mockResolvedValue({ deleted: true }),
  };

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      controllers: createResourceControllers({
        products: CATALOG_RESOURCES.products,
      }),
      providers: [{ provide: CrudService, useValue: crudService }],
    });
    builder.overrideGuard(AuthGuard).useValue({
      canActivate: (context: {
        switchToHttp: () => { getRequest: () => { userId: string } };
      }) => {
        context.switchToHttp().getRequest().userId = 'user-id';
        return true;
      },
    });
    const moduleRef = await builder.compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('preserves the generic CRUD routes for each resource', async () => {
    await request(app.getHttpServer())
      .get('/api/products?limit=10')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/products/record-id')
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/products')
      .send({ name: 'Product' })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/api/products/record-id')
      .send({ name: 'Updated product' })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/products/record-id')
      .expect(200);

    expect(crudService.list).toHaveBeenCalledWith(
      'user-id',
      'products',
      '10',
      undefined,
    );
    expect(crudService.get).toHaveBeenCalledWith(
      'user-id',
      'products',
      'record-id',
    );
    expect(crudService.create).toHaveBeenCalledWith('user-id', 'products', {
      name: 'Product',
    });
    expect(crudService.update).toHaveBeenCalledWith(
      'user-id',
      'products',
      'record-id',
      { name: 'Updated product' },
    );
    expect(crudService.remove).toHaveBeenCalledWith(
      'user-id',
      'products',
      'record-id',
    );
  });
});
