import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '../../auth/auth.guard';
import { CrudService } from '../../common/crud/crud.service';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { PeopleSearchController } from './people-search.controller';
import { PeopleSearchService } from './people-search.service';

describe('people search route', () => {
  let app: INestApplication;
  const peopleSearchService = { search: vi.fn() };
  const crudService = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      controllers: [
        PeopleSearchController,
        ...createResourceControllers({
          people: { table: 'people', module: 'Client' },
        }),
      ],
      providers: [
        { provide: PeopleSearchService, useValue: peopleSearchService },
        { provide: CrudService, useValue: crudService },
      ],
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

  beforeEach(() => {
    peopleSearchService.search.mockReset().mockResolvedValue([]);
    crudService.get.mockReset();
  });

  it('routes the static search endpoint before the generic people-by-id route', async () => {
    await request(app.getHttpServer())
      .get('/api/people/search?query=ana')
      .expect(200)
      .expect([]);

    expect(peopleSearchService.search).toHaveBeenCalledWith('user-id', 'ana');
    expect(crudService.get).not.toHaveBeenCalled();
  });
});
