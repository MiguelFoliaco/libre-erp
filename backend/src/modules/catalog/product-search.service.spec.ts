import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { ProductSearchService } from './product-search.service';

describe('ProductSearchService', () => {
  const query = vi.fn();
  const authorize = vi.fn();
  const service = new ProductSearchService(
    { query } as unknown as Pool,
    { authorize } as unknown as AuthorizationService,
  );

  beforeEach(() => {
    query.mockReset().mockResolvedValue({ rows: [] });
    authorize.mockReset().mockResolvedValue({
      resource: { table: 'products', module: 'Product' },
      context: {
        userId: 'user-id',
        companyId: 'company-id',
        environmentId: 'environment-id',
        grants: ['Product[READ]'],
        isRoot: false,
      },
    });
  });

  it('searches and filters only products in the authorized workspace', async () => {
    await service.search('user-id', {
      query: ' ABC ',
      is_active: 'true',
      sale_price_min: '2.5',
      limit: '25',
      offset: '10',
    });

    expect(authorize).toHaveBeenCalledWith('user-id', 'products', 'READ');
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('p.company_id = $1');
    expect(sql).toContain('p.environment_id = $2');
    expect(sql).toContain(
      'p.name ILIKE $3 OR p.sku ILIKE $3 OR p.barcode ILIKE $3',
    );
    expect(sql).toContain('p.is_active = $4');
    expect(sql).toContain('p.sale_price >= $5');
    expect(sql).toContain('LIMIT $6 OFFSET $7');
    expect(values).toEqual([
      'company-id',
      'environment-id',
      '%ABC%',
      true,
      '2.5',
      25,
      10,
    ]);
  });

  it('rejects invalid filters before querying products', async () => {
    await expect(
      service.search('user-id', { product_type: 'bundle' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('compares high-precision sale price bounds without floating-point rounding', async () => {
    await expect(
      service.search('user-id', {
        sale_price_min: '90071992547409.3',
        sale_price_max: '90071992547409.2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });
});
