import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { PeopleSearchService } from './people-search.service';

describe('PeopleSearchService', () => {
  const query = vi.fn();
  const authorize = vi.fn();
  const service = new PeopleSearchService(
    { query } as unknown as Pool,
    { authorize } as unknown as AuthorizationService,
  );

  beforeEach(() => {
    query.mockReset().mockResolvedValue({ rows: [] });
    authorize.mockReset().mockResolvedValue({
      resource: { table: 'people', module: 'Client' },
      context: {
        userId: 'user-id',
        companyId: 'company-id',
        environmentId: 'environment-id',
        grants: ['Client[READ]'],
        isRoot: false,
      },
    });
  });

  it('requires at least two search characters', async () => {
    await expect(service.search('user-id', ' a ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(authorize).toHaveBeenCalledWith('user-id', 'people', 'READ');
    expect(query).not.toHaveBeenCalled();
  });

  it('searches names and document numbers only in the authorized workspace', async () => {
    await service.search('user-id', ' Ana ');

    expect(authorize).toHaveBeenCalledWith('user-id', 'people', 'READ');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('document_number ILIKE $3'),
      ['company-id', 'environment-id', '%Ana%'],
    );
    expect(query.mock.calls[0][0]).toContain('company_id = $1');
    expect(query.mock.calls[0][0]).toContain('environment_id = $2');
    expect(query.mock.calls[0][0]).toContain('is_active = TRUE');
  });

  it('propagates authorization failures', async () => {
    const forbidden = new Error('Forbidden');
    authorize.mockRejectedValueOnce(forbidden);

    await expect(service.search('user-id', 'Ana')).rejects.toBe(forbidden);
    expect(query).not.toHaveBeenCalled();
  });
});
