import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool, PoolClient } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { PG_POOL } from '../../database/database.module';

type JsonRecord = Record<string, unknown>;
type EntrySource = 'supplier' | 'return';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUANTITY_PATTERN = /^\d{1,14}(?:\.\d{1,6})?$/;

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('El cuerpo debe ser un objeto JSON');
  }
  return value as JsonRecord;
}

function readField(
  body: JsonRecord,
  camelName: string,
  snakeName: string,
): unknown {
  return body[camelName] ?? body[snakeName];
}

function readUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new BadRequestException(`${field} debe ser un UUID válido`);
  }
  return value;
}

function readQuantity(value: unknown): string {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    throw new BadRequestException('La cantidad debe ser un número positivo');
  }
  const quantity = String(value);
  if (!QUANTITY_PATTERN.test(quantity) || /^0(?:\.0{1,6})?$/.test(quantity)) {
    throw new BadRequestException(
      'La cantidad debe ser mayor que cero y tener hasta 6 decimales',
    );
  }
  return quantity;
}

function readNotes(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2000) {
    throw new BadRequestException('Las notas no pueden superar 2000 caracteres');
  }
  return value.trim() || null;
}

function normalizeDatabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (code === '23505') {
      throw new ConflictException('Ya existe un registro con esos datos');
    }
    if (
      code === '23503' ||
      code === '23514' ||
      code === '23502' ||
      code === '22P02'
    ) {
      throw new BadRequestException(
        'La operación no cumple las restricciones de la base de datos',
      );
    }
  }
  throw error;
}

@Injectable()
export class InventoryOperationsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async listStock(
    userId: string,
    filters: { warehouseId?: unknown; query?: unknown },
  ) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'inventory',
      'READ',
    );
    const values: unknown[] = [context.companyId, context.environmentId];
    const conditions = ['i.company_id = $1', 'i.environment_id = $2'];
    if (filters.warehouseId !== undefined && filters.warehouseId !== '') {
      values.push(readUuid(filters.warehouseId, 'warehouseId'));
      conditions.push(`i.warehouse_id = $${values.length}`);
    }
    if (filters.query !== undefined && filters.query !== '') {
      if (typeof filters.query !== 'string' || filters.query.length > 100) {
        throw new BadRequestException('El filtro de búsqueda no es válido');
      }
      values.push(`%${filters.query.trim()}%`);
      conditions.push(
        `(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length} OR p.barcode ILIKE $${values.length})`,
      );
    }
    const result = await this.pool.query(
      `SELECT i.id, i.product_id, p.name AS product_name, p.sku,
              i.warehouse_id, w.name AS warehouse_name,
              i.quantity::text, i.reserved_quantity::text,
              (i.quantity - i.reserved_quantity)::text AS available_quantity,
              i.updated_at
       FROM inventory i
       JOIN products p
         ON p.id = i.product_id
        AND p.company_id = i.company_id
        AND p.environment_id = i.environment_id
       JOIN warehouses w
         ON w.id = i.warehouse_id
        AND w.company_id = i.company_id
        AND w.environment_id = i.environment_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY w.name, p.name
       LIMIT 500`,
      values,
    );
    return { items: result.rows, limit: result.rows.length, offset: 0 };
  }

  async listMovements(userId: string) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'inventory-movements',
      'READ',
    );
    const result = await this.pool.query(
      `SELECT m.id, m.product_id, p.name AS product_name, p.sku,
              m.warehouse_id, w.name AS warehouse_name,
              m.movement_type, m.quantity::text,
              m.reference_type, m.reference_id, m.supplier_id,
              COALESCE(
                NULLIF(TRIM(CONCAT_WS(' ', person.first_name, person.last_name)), ''),
                NULL
              ) AS supplier_name,
              m.transfer_id, m.notes, m.created_by, m.created_at
       FROM inventory_movements m
       JOIN products p
         ON p.id = m.product_id
        AND p.company_id = m.company_id
        AND p.environment_id = m.environment_id
       JOIN warehouses w
         ON w.id = m.warehouse_id
        AND w.company_id = m.company_id
        AND w.environment_id = m.environment_id
       LEFT JOIN suppliers s
         ON s.id = m.supplier_id
        AND s.company_id = m.company_id
        AND s.environment_id = m.environment_id
       LEFT JOIN people person
         ON person.id = s.person_id
        AND person.company_id = s.company_id
        AND person.environment_id = s.environment_id
       WHERE m.company_id = $1 AND m.environment_id = $2
       ORDER BY m.created_at DESC
       LIMIT 200`,
      [context.companyId, context.environmentId],
    );
    return { items: result.rows, limit: result.rows.length, offset: 0 };
  }

  async listProducts(userId: string) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'inventory',
      'READ',
    );
    const result = await this.pool.query(
      `SELECT id, name, sku
       FROM products
       WHERE company_id = $1 AND environment_id = $2 AND is_active = TRUE
       ORDER BY name
       LIMIT 500`,
      [context.companyId, context.environmentId],
    );
    return { items: result.rows, limit: result.rows.length, offset: 0 };
  }

  async listPeople(userId: string) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'suppliers',
      'READ',
    );
    const result = await this.pool.query(
      `SELECT id,
              TRIM(CONCAT_WS(
                ' ', first_name, middle_name, last_name, second_last_name
              )) AS name
       FROM people
       WHERE company_id = $1 AND environment_id = $2 AND is_active = TRUE
       ORDER BY last_name NULLS LAST, first_name
       LIMIT 500`,
      [context.companyId, context.environmentId],
    );
    return { items: result.rows, limit: result.rows.length, offset: 0 };
  }

  async listSuppliers(userId: string) {
    return this.querySuppliers(userId);
  }

  async searchSuppliers(userId: string, query: unknown) {
    if (
      typeof query !== 'string' ||
      query.trim().length === 0 ||
      query.length > 100
    ) {
      throw new BadRequestException('El filtro de búsqueda no es válido');
    }
    return this.querySuppliers(userId, query.trim());
  }

  private async querySuppliers(userId: string, query?: string) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'suppliers',
      'READ',
    );
    const values: unknown[] = [context.companyId, context.environmentId];
    let searchCondition = '';
    if (query !== undefined) {
      values.push(`%${query}%`);
      searchCondition = `
         AND (
           supplier.supplier_code ILIKE $3
           OR TRIM(CONCAT_WS(
             ' ', person.first_name, person.middle_name,
             person.last_name, person.second_last_name
           )) ILIKE $3
           OR person.document_number ILIKE $3
           OR person.email ILIKE $3
           OR person.phone ILIKE $3
         )`;
    }
    const result = await this.pool.query(
      `SELECT supplier.id, supplier.person_id, supplier.supplier_code,
              supplier.is_active, person.first_name, person.middle_name,
              person.last_name, person.second_last_name,
              TRIM(CONCAT_WS(
                ' ', person.first_name, person.middle_name,
                person.last_name, person.second_last_name
              )) AS person_name,
              document_type.name AS document_type_name,
              person.document_number, person.email, person.phone
       FROM suppliers supplier
       JOIN people person
         ON person.id = supplier.person_id
        AND person.company_id = supplier.company_id
        AND person.environment_id = supplier.environment_id
       LEFT JOIN document_types_people document_type
         ON document_type.id = person.document_types_people_id
       WHERE supplier.company_id = $1
         AND supplier.environment_id = $2${searchCondition}
       ORDER BY person.last_name NULLS LAST, person.first_name,
                supplier.supplier_code NULLS LAST
       LIMIT 500`,
      values,
    );
    return { items: result.rows, limit: result.rows.length, offset: 0 };
  }

  async createMovement(userId: string, input: unknown) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'inventory-movements',
      'INSERT',
    );
    const body = asRecord(input);
    const movementType = readField(body, 'movementType', 'movement_type');
    if (
      movementType !== 'entry' &&
      movementType !== 'exit' &&
      movementType !== 'adjustment_in' &&
      movementType !== 'adjustment_out'
    ) {
      throw new BadRequestException('El tipo de movimiento no es válido');
    }
    const sourceValue = readField(body, 'source', 'reference_type');
    let source: EntrySource | null = null;
    if (movementType === 'entry') {
      if (sourceValue !== 'supplier' && sourceValue !== 'return') {
        throw new BadRequestException(
          'El ingreso debe indicar si proviene de un proveedor o una devolución',
        );
      }
      source = sourceValue;
    } else if (sourceValue !== undefined && sourceValue !== null) {
      throw new BadRequestException(
        'El origen solo se utiliza en los ingresos',
      );
    }

    const warehouseId = readUuid(
      readField(body, 'warehouseId', 'warehouse_id'),
      'warehouseId',
    );
    const productId = readUuid(
      readField(body, 'productId', 'product_id'),
      'productId',
    );
    const quantity = readQuantity(body.quantity);
    const notes = readNotes(body.notes);
    const supplierValue = readField(body, 'supplierId', 'supplier_id');
    const supplierId =
      source === 'supplier'
        ? readUuid(supplierValue, 'supplierId')
        : null;
    if (source !== 'supplier' && supplierValue !== undefined) {
      throw new BadRequestException(
        'Solo los ingresos de proveedor pueden indicar supplierId',
      );
    }
    const referenceValue = readField(body, 'referenceId', 'reference_id');
    const referenceId =
      source === 'return' && referenceValue !== undefined
        ? readUuid(referenceValue, 'referenceId')
        : source === 'supplier'
          ? supplierId
          : null;

    return this.transaction(async (client) => {
      await this.assertActiveWarehouse(
        client,
        context.companyId,
        context.environmentId,
        warehouseId,
      );
      await this.assertActiveProduct(
        client,
        context.companyId,
        context.environmentId,
        productId,
      );
      if (supplierId) {
        await this.assertActiveSupplier(
          client,
          context.companyId,
          context.environmentId,
          supplierId,
        );
      }
      await this.ensureInventoryRow(
        client,
        context.companyId,
        context.environmentId,
        productId,
        warehouseId,
      );
      await this.changeQuantity(
        client,
        context.companyId,
        context.environmentId,
        productId,
        warehouseId,
        quantity,
        movementType === 'exit' || movementType === 'adjustment_out',
      );
      const result = await client.query(
        `INSERT INTO inventory_movements (
           company_id, environment_id, product_id, warehouse_id,
           movement_type, quantity, reference_type, reference_id,
           supplier_id, notes, created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          context.companyId,
          context.environmentId,
          productId,
          warehouseId,
          movementType,
          quantity,
          source,
          referenceId,
          supplierId,
          notes,
          context.userId,
        ],
      );
      return result.rows[0];
    });
  }

  async createTransfer(userId: string, input: unknown) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'transfers',
      'INSERT',
    );
    await this.authorizationService.authorize(
      userId,
      'transfer-items',
      'INSERT',
    );
    await this.authorizationService.authorize(
      userId,
      'inventory-movements',
      'INSERT',
    );
    const body = asRecord(input);
    const sourceWarehouseId = readUuid(
      readField(body, 'sourceWarehouseId', 'source_warehouse_id'),
      'sourceWarehouseId',
    );
    const destinationWarehouseId = readUuid(
      readField(body, 'destinationWarehouseId', 'destination_warehouse_id'),
      'destinationWarehouseId',
    );
    if (sourceWarehouseId === destinationWarehouseId) {
      throw new BadRequestException(
        'Las bodegas de origen y destino deben ser diferentes',
      );
    }
    const notes = readNotes(body.notes);
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
      throw new BadRequestException(
        'El traslado debe incluir entre 1 y 100 productos',
      );
    }
    const items = body.items.map((item) => {
      const row = asRecord(item);
      return {
        productId: readUuid(
          readField(row, 'productId', 'product_id'),
          'productId',
        ),
        quantity: readQuantity(row.quantity),
      };
    });
    if (new Set(items.map(({ productId }) => productId)).size !== items.length) {
      throw new BadRequestException(
        'Cada producto solo puede aparecer una vez en un traslado',
      );
    }
    items.sort((left, right) => left.productId.localeCompare(right.productId));

    return this.transaction(async (client) => {
      for (const warehouseId of [
        sourceWarehouseId,
        destinationWarehouseId,
      ].sort()) {
        await this.assertActiveWarehouse(
          client,
          context.companyId,
          context.environmentId,
          warehouseId,
        );
      }
      for (const { productId } of items) {
        await this.assertActiveProduct(
          client,
          context.companyId,
          context.environmentId,
          productId,
        );
        for (const warehouseId of [
          sourceWarehouseId,
          destinationWarehouseId,
        ].sort()) {
          await this.ensureInventoryRow(
            client,
            context.companyId,
            context.environmentId,
            productId,
            warehouseId,
          );
        }
      }

      const transferResult = await client.query(
        `INSERT INTO transfers (
           company_id, environment_id, transfer_number,
           source_warehouse_id, destination_warehouse_id,
           status, notes, created_by, approved_by, shipped_at, received_at
         )
         VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $7, NOW(), NOW())
         RETURNING *`,
        [
          context.companyId,
          context.environmentId,
          `TRF-${randomUUID()}`,
          sourceWarehouseId,
          destinationWarehouseId,
          notes,
          context.userId,
        ],
      );
      const transfer = transferResult.rows[0];

      for (const { productId, quantity } of items) {
        await this.changeQuantity(
          client,
          context.companyId,
          context.environmentId,
          productId,
          sourceWarehouseId,
          quantity,
          true,
        );
        await this.changeQuantity(
          client,
          context.companyId,
          context.environmentId,
          productId,
          destinationWarehouseId,
          quantity,
          false,
        );
        await client.query(
          `INSERT INTO transfer_items (
             company_id, environment_id, transfer_id, product_id, quantity
           )
           VALUES ($1, $2, $3, $4, $5)`,
          [
            context.companyId,
            context.environmentId,
            transfer.id,
            productId,
            quantity,
          ],
        );
        for (const [warehouseId, movementType] of [
          [sourceWarehouseId, 'transfer_out'],
          [destinationWarehouseId, 'transfer_in'],
        ] as const) {
          await client.query(
            `INSERT INTO inventory_movements (
               company_id, environment_id, product_id, warehouse_id,
               movement_type, quantity, reference_type, reference_id,
               transfer_id, notes, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, 'transfer', $7, $7, $8, $9)`,
            [
              context.companyId,
              context.environmentId,
              productId,
              warehouseId,
              movementType,
              quantity,
              transfer.id,
              notes,
              context.userId,
            ],
          );
        }
      }
      return {
        transfer,
        items,
      };
    });
  }

  private async assertActiveWarehouse(
    client: PoolClient,
    companyId: string,
    environmentId: string,
    warehouseId: string,
  ) {
    const result = await client.query(
      `SELECT id FROM warehouses
       WHERE id = $1 AND company_id = $2 AND environment_id = $3
         AND is_active = TRUE
       FOR UPDATE`,
      [warehouseId, companyId, environmentId],
    );
    if (result.rowCount !== 1) {
      throw new BadRequestException(
        'La bodega no existe en el workspace o está bloqueada',
      );
    }
  }

  private async assertActiveProduct(
    client: PoolClient,
    companyId: string,
    environmentId: string,
    productId: string,
  ) {
    const result = await client.query(
      `SELECT id FROM products
       WHERE id = $1 AND company_id = $2 AND environment_id = $3
         AND is_active = TRUE
       FOR SHARE`,
      [productId, companyId, environmentId],
    );
    if (result.rowCount !== 1) {
      throw new BadRequestException(
        'El producto no existe en el workspace o está inactivo',
      );
    }
  }

  private async assertActiveSupplier(
    client: PoolClient,
    companyId: string,
    environmentId: string,
    supplierId: string,
  ) {
    const result = await client.query(
      `SELECT id FROM suppliers
       WHERE id = $1 AND company_id = $2 AND environment_id = $3
         AND is_active = TRUE
       FOR SHARE`,
      [supplierId, companyId, environmentId],
    );
    if (result.rowCount !== 1) {
      throw new BadRequestException(
        'El proveedor no existe en el workspace o está inactivo',
      );
    }
  }

  private async ensureInventoryRow(
    client: PoolClient,
    companyId: string,
    environmentId: string,
    productId: string,
    warehouseId: string,
  ) {
    await client.query(
      `INSERT INTO inventory (
         company_id, environment_id, product_id, warehouse_id
       )
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, environment_id, product_id, warehouse_id)
       DO NOTHING`,
      [companyId, environmentId, productId, warehouseId],
    );
    await client.query(
      `SELECT id FROM inventory
       WHERE company_id = $1 AND environment_id = $2
         AND product_id = $3 AND warehouse_id = $4
       FOR UPDATE`,
      [companyId, environmentId, productId, warehouseId],
    );
  }

  private async changeQuantity(
    client: PoolClient,
    companyId: string,
    environmentId: string,
    productId: string,
    warehouseId: string,
    quantity: string,
    decrease: boolean,
  ) {
    const signedQuantity = decrease ? `-${quantity}` : quantity;
    const result = await client.query(
      `UPDATE inventory
       SET quantity = quantity + $5::numeric, updated_at = NOW()
       WHERE company_id = $1 AND environment_id = $2
         AND product_id = $3 AND warehouse_id = $4
         AND ($6::boolean = FALSE OR quantity - reserved_quantity >= ABS($5::numeric))
       RETURNING quantity::text`,
      [
        companyId,
        environmentId,
        productId,
        warehouseId,
        signedQuantity,
        decrease,
      ],
    );
    if (result.rowCount !== 1) {
      throw new BadRequestException(
        'La cantidad supera las existencias disponibles no reservadas',
      );
    }
    return result.rows[0].quantity as string;
  }

  private async transaction<T>(
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      normalizeDatabaseError(error);
    } finally {
      client.release();
    }
  }
}
