import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '../../auth/auth.guard';
import { POSController } from './pos.controller';
import { PosServices } from './pos.service';

describe('POS search route', () => {
  let app: INestApplication;
  const posService = { list: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [POSController],
      providers: [{ provide: PosServices, useValue: posService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { userId: string } };
        }) => {
          context.switchToHttp().getRequest().userId = 'user-id';
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    posService.list.mockReset().mockResolvedValue({ items: [], limit: 0, offset: 0 });
  });

  it('routes /api/pos/search to the POS service', async () => {
    await request(app.getHttpServer())
      .get('/api/pos/search?query=caja&limit=25&offset=10')
      .expect(200)
      .expect({ items: [], limit: 0, offset: 0 });

    expect(posService.list).toHaveBeenCalledWith('user-id', 'caja', '25', '10');
  });
});
