import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { CustomerSearchService } from './customer-search.service';

describe('CustomerSearchService', () => {
  const query = vi.fn();
  const authorize = vi.fn();
  const service = new CustomerSearchService(
    { query } as unknown as Pool,
    { authorize } as unknown as AuthorizationService,
  );

  beforeEach(() => {
    query.mockReset().mockResolvedValue({ rows: [] });
    authorize.mockReset().mockResolvedValue({
      resource: { table: 'customers', module: 'Client' },
      context: {
        userId: 'user-id',
        companyId: 'company-id',
        environmentId: 'environment-id',
        grants: ['Client[READ]'],
        isRoot: false,
      },
    });
  });

  it('rejects non-empty searches shorter than two characters', async () => {
    await expect(service.search('user-id', ' a ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(authorize).toHaveBeenCalledWith('user-id', 'customers', 'READ');
    expect(query).not.toHaveBeenCalled();
  });

  it('lists joined customer and person records in the authorized workspace', async () => {
    await service.search('user-id');

    expect(authorize).toHaveBeenCalledWith('user-id', 'customers', 'READ');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('to_jsonb(people) AS person'),
      ['company-id', 'environment-id', null],
    );
    expect(query.mock.calls[0][0]).toContain('customers.company_id = $1');
    expect(query.mock.calls[0][0]).toContain('customers.environment_id = $2');
  });

  it('searches by customer code, person name, document, email, and phone', async () => {
    await service.search('user-id', ' AC 123 ');

    const [sql, parameters] = query.mock.calls[0];
    expect(sql).toContain('customers.customer_code ILIKE $3');
    expect(sql).toContain('people.document_number ILIKE $3');
    expect(sql).toContain('people.email ILIKE $3');
    expect(sql).toContain('people.phone ILIKE $3');
    expect(parameters).toEqual(['company-id', 'environment-id', '%AC123%']);
  });

  it('propagates authorization failures', async () => {
    const forbidden = new Error('Forbidden');
    authorize.mockRejectedValueOnce(forbidden);

    await expect(service.search('user-id', 'Acme')).rejects.toBe(forbidden);
    expect(query).not.toHaveBeenCalled();
  });
});
