import { BadRequestException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { ProductImportService } from './product-import.service';

describe('ProductImportService', () => {
  const query = vi.fn();
  const release = vi.fn();
  const connect = vi.fn();
  const authorize = vi.fn();
  const client = { query, release };
  const service = new ProductImportService(
    { connect } as unknown as Pool,
    { authorize } as unknown as AuthorizationService,
  );

  beforeEach(() => {
    query.mockReset().mockResolvedValue({ rows: [] });
    release.mockReset();
    connect.mockReset().mockResolvedValue(client as unknown as PoolClient);
    authorize.mockReset().mockResolvedValue({
      resource: { table: 'products', module: 'Product' },
      context: {
        userId: 'user-id',
        companyId: 'authorized-company',
        environmentId: 'authorized-environment',
        grants: ['Product[INSERT]'],
        isRoot: false,
      },
    });
  });

  it('inserts valid rows using workspace IDs from the session', async () => {
    await expect(
      service.import('user-id', {
        rows: [
          {
            company_id: 'untrusted-company',
            environment_id: 'untrusted-environment',
            name: 'Widget',
            currency_code: 'usd',
            sku: 'W-1',
          },
        ],
      }),
    ).resolves.toEqual({ created: 1 });

    expect(authorize).toHaveBeenCalledWith('user-id', 'products', 'INSERT');
    const insertCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO products'),
    );
    expect(insertCall?.[1]).toEqual([
      'authorized-company',
      'authorized-environment',
      null,
      null,
      null,
      'W-1',
      null,
      'Widget',
      null,
      'physical',
      '0',
      '0',
      'USD',
      'unit',
      '{}',
      true,
    ]);
    expect(query).toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalledOnce();
  });

  it('rejects invalid rows and rolls back the entire import', async () => {
    await expect(
      service.import('user-id', {
        rows: [
          { name: 'Valid', currency_code: 'USD' },
          { name: 'Missing currency' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT INTO products'),
      ),
    ).toBe(false);
    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalledOnce();
  });

  it('resolves catalog IDs in the active workspace and prefers IDs over names', async () => {
    const brandId = 'c4c6bf91-0e22-4bf1-9af0-607ec4410899';
    query.mockImplementation(async (sql: unknown) => {
      if (String(sql).includes('FROM brands')) {
        return { rows: [{ id: brandId, name: 'Acme' }] };
      }
      return { rows: [] };
    });

    await service.import('user-id', {
      rows: [
        {
          brand_id: brandId,
          brand_name: 'This name is ignored',
          name: 'Widget',
          currency_code: 'USD',
        },
      ],
    });

    const insertCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO products'),
    );
    expect(insertCall?.[1][2]).toBe(brandId);
    expect(insertCall?.[1][0]).toBe('authorized-company');
    expect(insertCall?.[1][1]).toBe('authorized-environment');
  });
});
