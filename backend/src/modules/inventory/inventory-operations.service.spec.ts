import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { InventoryOperationsService } from './inventory-operations.service';

describe('InventoryOperationsService', () => {
  const query = vi.fn();
  const connect = vi.fn();
  const release = vi.fn();
  const authorize = vi.fn();
  const client = { query, release };
  const service = new InventoryOperationsService(
    { query, connect } as unknown as Pool,
    { authorize } as unknown as AuthorizationService,
  );

  beforeEach(() => {
    query.mockReset();
    connect.mockReset().mockResolvedValue(client);
    release.mockReset();
    authorize.mockReset().mockResolvedValue({
      resource: { table: 'inventory_movements', module: 'Inventory' },
      context: {
        userId: 'user-id',
        companyId: '11111111-1111-4111-8111-111111111111',
        environmentId: '22222222-2222-4222-8222-222222222222',
        grants: ['Inventory[*]'],
        isRoot: false,
      },
    });
  });

  it('requires an origin for incoming stock before opening a transaction', async () => {
    await expect(
      service.createMovement('user-id', {
        movementType: 'entry',
        warehouseId: '33333333-3333-4333-8333-333333333333',
        productId: '44444444-4444-4444-8444-444444444444',
        quantity: '2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(connect).not.toHaveBeenCalled();
  });

  it('lists suppliers with person details scoped to the authorized workspace', async () => {
    query.mockResolvedValue({
      rows: [{ id: 'supplier-id', person_name: 'Ada Lovelace' }],
      rowCount: 1,
    });

    const result = await service.listSuppliers('user-id');

    expect(result.items).toEqual([{ id: 'supplier-id', person_name: 'Ada Lovelace' }]);
    expect(authorize).toHaveBeenCalledWith('user-id', 'suppliers', 'READ');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM suppliers supplier'),
      [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ],
    );
  });

  it('searches supplier and person fields using a validated query', async () => {
    query.mockResolvedValue({ rows: [], rowCount: 0 });

    await service.searchSuppliers('user-id', '  Ada  ');

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('person.email ILIKE $3'),
      [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        '%Ada%',
      ],
    );
  });

  it('rejects empty supplier searches', async () => {
    await expect(service.searchSuppliers('user-id', '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('searches active inventory products by name, SKU, or barcode', async () => {
    query.mockResolvedValue({ rows: [], rowCount: 0 });

    await service.searchProducts('user-id', '  tea  ');

    expect(authorize).toHaveBeenCalledWith('user-id', 'inventory', 'READ');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('name ILIKE $3 OR sku ILIKE $3 OR barcode ILIKE $3'),
      [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        '%tea%',
      ],
    );
  });

  it('rejects inventory product searches shorter than two characters', async () => {
    await expect(service.searchProducts('user-id', ' a ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('rolls back an exit when available stock is insufficient', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('FROM warehouses')) {
        return { rows: [{ id: 'warehouse-id' }], rowCount: 1 };
      }
      if (sql.includes('FROM products')) {
        return { rows: [{ id: 'product-id' }], rowCount: 1 };
      }
      if (sql.includes('INSERT INTO inventory (')) {
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('FROM inventory')) {
        return { rows: [{ id: 'inventory-id' }], rowCount: 1 };
      }
      if (sql.includes('UPDATE inventory')) {
        return { rows: [], rowCount: 0 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    });

    await expect(
      service.createMovement('user-id', {
        movementType: 'exit',
        warehouseId: '33333333-3333-4333-8333-333333333333',
        productId: '44444444-4444-4444-8444-444444444444',
        quantity: '2',
      }),
    ).rejects.toThrow('La cantidad supera las existencias disponibles');

    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO inventory_movements'))).toBe(false);
    expect(release).toHaveBeenCalledOnce();
  });

  it('updates stock and records an incoming return in one transaction', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT') {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('FROM warehouses')) {
        return { rows: [{ id: 'warehouse-id' }], rowCount: 1 };
      }
      if (sql.includes('FROM products')) {
        return { rows: [{ id: 'product-id' }], rowCount: 1 };
      }
      if (sql.includes('INSERT INTO inventory (')) {
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('FROM inventory')) {
        return { rows: [{ id: 'inventory-id' }], rowCount: 1 };
      }
      if (sql.includes('UPDATE inventory')) {
        return { rows: [{ quantity: '3' }], rowCount: 1 };
      }
      if (sql.includes('INSERT INTO inventory_movements')) {
        return { rows: [{ id: 'movement-id' }], rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    });

    const result = await service.createMovement('user-id', {
      movementType: 'entry',
      source: 'return',
      warehouseId: '33333333-3333-4333-8333-333333333333',
      productId: '44444444-4444-4444-8444-444444444444',
      quantity: '3',
    });

    const statements = query.mock.calls.map(([sql]) => String(sql));
    expect(result.id).toBe('movement-id');
    expect(statements[0]).toBe('BEGIN');
    expect(statements.findIndex((sql) => sql.includes('UPDATE inventory'))).toBeLessThan(
      statements.findIndex((sql) => sql.includes('INSERT INTO inventory_movements')),
    );
    expect(statements[statements.length - 1]).toBe('COMMIT');
  });

  it('rejects transfers to the same warehouse before opening a transaction', async () => {
    const warehouseId = '33333333-3333-4333-8333-333333333333';
    await expect(
      service.createTransfer('user-id', {
        sourceWarehouseId: warehouseId,
        destinationWarehouseId: warehouseId,
        items: [{
          productId: '44444444-4444-4444-8444-444444444444',
          quantity: '1',
        }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(connect).not.toHaveBeenCalled();
  });
});
