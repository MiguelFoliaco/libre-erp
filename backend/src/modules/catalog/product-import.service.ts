import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { PG_POOL } from '../../database/database.module';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ProductType = 'physical' | 'virtual' | 'service';
const PRODUCT_TYPES = ['physical', 'virtual', 'service'] as const;
const ALLOWED_FIELDS = new Set([
  'row_number',
  'company_id',
  'environment_id',
  'brand_id',
  'brand_name',
  'category_id',
  'category_name',
  'department_id',
  'department_name',
  'sku',
  'barcode',
  'name',
  'description',
  'product_type',
  'cost_price',
  'sale_price',
  'currency_code',
  'unit',
  'metadata',
  'is_active',
]);

type CatalogKind = 'brand' | 'category' | 'department';

interface CatalogReference {
  id?: string;
  name?: string;
}

interface ProductValues {
  brand_id: string | null;
  category_id: string | null;
  department_id: string | null;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  product_type: ProductType;
  cost_price: string;
  sale_price: string;
  currency_code: string;
  unit: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
}

interface PendingProduct {
  rowNumber: number;
  values: ProductValues;
  references: Record<CatalogKind, CatalogReference>;
}

interface RowError {
  row_number: number;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readCell(
  row: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = row[key];
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function isProductType(value: string): value is ProductType {
  return PRODUCT_TYPES.some((productType) => productType === value);
}

function postgresErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }
  return undefined;
}

function readNullableText(
  row: Record<string, unknown>,
  key: string,
  maxLength: number | undefined,
  errors: string[],
): string | null {
  const value = readCell(row, key);
  if (value === undefined) return null;
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(`${key} cannot exceed ${maxLength} characters`);
  }
  return value;
}

function readRequiredText(
  row: Record<string, unknown>,
  key: string,
  maxLength: number,
  errors: string[],
): string {
  const value = readCell(row, key);
  if (value === undefined) {
    errors.push(`${key} is required`);
    return '';
  }
  if (value.length > maxLength) {
    errors.push(`${key} cannot exceed ${maxLength} characters`);
  }
  return value;
}

function readPrice(
  row: Record<string, unknown>,
  key: string,
  errors: string[],
): string {
  const value = readCell(row, key) ?? '0';
  if (!/^\d{1,14}(?:\.\d{1,6})?$/.test(value)) {
    errors.push(
      `${key} must be a non-negative number with up to 6 decimal places`,
    );
    return '0';
  }
  return value;
}

function readBoolean(
  row: Record<string, unknown>,
  key: string,
  fallback: boolean,
  errors: string[],
): boolean {
  const value = readCell(row, key);
  if (value === undefined) return fallback;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  errors.push(`${key} must be true or false`);
  return fallback;
}

function readMetadata(
  row: Record<string, unknown>,
  errors: string[],
): Record<string, unknown> {
  const raw = row.metadata;
  if (raw === undefined || raw === null || raw === '') return {};
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      errors.push('metadata must contain valid JSON');
      return {};
    }
  }
  if (!isRecord(value)) {
    errors.push('metadata must be a JSON object');
    return {};
  }
  return value;
}

function readReference(
  row: Record<string, unknown>,
  kind: CatalogKind,
  errors: string[],
): CatalogReference {
  const id = readCell(row, `${kind}_id`);
  const name = readCell(row, `${kind}_name`);
  if (id !== undefined) {
    if (!UUID_PATTERN.test(id)) errors.push(`${kind}_id must be a valid UUID`);
    return { id };
  }
  if (name !== undefined && name.length > 150) {
    errors.push(`${kind}_name cannot exceed 150 characters`);
  }
  return name === undefined ? {} : { name };
}

function createPendingProduct(
  row: Record<string, unknown>,
  rowNumber: number,
): { product: PendingProduct; errors: string[] } {
  const errors: string[] = [];
  for (const key of Object.keys(row)) {
    if (!ALLOWED_FIELDS.has(key)) errors.push(`unknown column: ${key}`);
  }

  const productType = readCell(row, 'product_type') ?? 'physical';
  if (!isProductType(productType)) {
    errors.push('product_type must be physical, virtual, or service');
  }
  const currencyCode = (readCell(row, 'currency_code') ?? '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    errors.push('currency_code must contain 3 letters');
  }
  const unit = readCell(row, 'unit') ?? 'unit';
  if (unit.length > 30) errors.push('unit cannot exceed 30 characters');

  const references = {
    brand: readReference(row, 'brand', errors),
    category: readReference(row, 'category', errors),
    department: readReference(row, 'department', errors),
  };
  const values: ProductValues = {
    brand_id: null,
    category_id: null,
    department_id: null,
    sku: readNullableText(row, 'sku', 100, errors),
    barcode: readNullableText(row, 'barcode', 100, errors),
    name: readRequiredText(row, 'name', 255, errors),
    description: readNullableText(row, 'description', undefined, errors),
    product_type: isProductType(productType) ? productType : 'physical',
    cost_price: readPrice(row, 'cost_price', errors),
    sale_price: readPrice(row, 'sale_price', errors),
    currency_code: currencyCode,
    unit,
    metadata: readMetadata(row, errors),
    is_active: readBoolean(row, 'is_active', true, errors),
  };
  return {
    product: { rowNumber, values, references },
    errors,
  };
}

@Injectable()
export class ProductImportService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async import(userId: string, input: unknown) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'products',
      'INSERT',
    );
    if (!isRecord(input) || !Array.isArray(input.rows)) {
      throw new BadRequestException('rows must be an array');
    }
    if (input.rows.length < 1 || input.rows.length > 500) {
      throw new BadRequestException(
        'Import must contain between 1 and 500 rows',
      );
    }

    const products: PendingProduct[] = [];
    const errors: RowError[] = [];
    input.rows.forEach((value, index) => {
      const rowNumberValue = isRecord(value) ? value.row_number : undefined;
      const parsedRowNumber =
        typeof rowNumberValue === 'string' && /^\d+$/.test(rowNumberValue)
          ? Number(rowNumberValue)
          : rowNumberValue;
      const rowNumber =
        typeof parsedRowNumber === 'number' &&
        Number.isSafeInteger(parsedRowNumber) &&
        parsedRowNumber > 0
          ? parsedRowNumber
          : index + 2;
      if (!isRecord(value)) {
        errors.push({
          row_number: rowNumber,
          errors: ['row must be an object'],
        });
        return;
      }

      const { product, errors: rowErrors } = createPendingProduct(
        value,
        rowNumber,
      );
      if (rowErrors.length > 0) {
        errors.push({ row_number: rowNumber, errors: rowErrors });
      } else {
        products.push(product);
      }
    });

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (errors.length === 0) {
        await this.resolveCatalogReferences(client, products, context, errors);
        await this.checkUniqueValues(client, products, context, errors);
      }
      if (errors.length > 0) {
        throw new BadRequestException({
          message: 'One or more product rows are invalid',
          errors,
        });
      }

      for (const product of products) {
        await client.query(
          `INSERT INTO products (
             company_id, environment_id, brand_id, category_id, department_id,
             sku, barcode, name, description, product_type, cost_price,
             sale_price, currency_code, unit, metadata, is_active
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
           )`,
          [
            context.companyId,
            context.environmentId,
            product.values.brand_id,
            product.values.category_id,
            product.values.department_id,
            product.values.sku,
            product.values.barcode,
            product.values.name,
            product.values.description,
            product.values.product_type,
            product.values.cost_price,
            product.values.sale_price,
            product.values.currency_code,
            product.values.unit,
            JSON.stringify(product.values.metadata),
            product.values.is_active,
          ],
        );
      }

      await client.query('COMMIT');
      return { created: products.length };
    } catch (error) {
      await client.query('ROLLBACK');
      if (postgresErrorCode(error) === '23505') {
        throw new ConflictException(
          'A product with the same SKU or barcode already exists',
        );
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private async resolveCatalogReferences(
    client: PoolClient,
    products: PendingProduct[],
    context: { companyId: string; environmentId: string },
    errors: RowError[],
  ): Promise<void> {
    const catalogConfig = {
      brand: { table: 'brands', field: 'brand_id' },
      category: { table: 'categories', field: 'category_id' },
      department: { table: 'departments', field: 'department_id' },
    } as const;

    for (const kind of Object.keys(catalogConfig) as CatalogKind[]) {
      const config = catalogConfig[kind];
      const ids = [
        ...new Set(
          products.flatMap((product) =>
            product.references[kind].id ? [product.references[kind].id] : [],
          ),
        ),
      ];
      const names = [
        ...new Set(
          products.flatMap((product) =>
            product.references[kind].name
              ? [product.references[kind].name.toLowerCase()]
              : [],
          ),
        ),
      ];
      if (ids.length === 0 && names.length === 0) continue;

      const result = await client.query<{ id: string; name: string }>(
        `SELECT id, name
         FROM ${config.table}
         WHERE company_id = $1
           AND environment_id = $2
           AND (id = ANY($3::uuid[]) OR lower(name) = ANY($4::text[]))`,
        [context.companyId, context.environmentId, ids, names],
      );
      const byId = new Map(result.rows.map((row) => [row.id, row]));
      const byName = new Map<string, { id: string; name: string }[]>();
      for (const row of result.rows) {
        const key = row.name.toLowerCase();
        byName.set(key, [...(byName.get(key) ?? []), row]);
      }

      for (const product of products) {
        const reference = product.references[kind];
        let matched: { id: string; name: string } | undefined;
        if (reference.id !== undefined) {
          matched = byId.get(reference.id);
        } else if (reference.name !== undefined) {
          const matches = byName.get(reference.name.toLowerCase()) ?? [];
          if (matches.length > 1) {
            this.addRowError(
              errors,
              product.rowNumber,
              `${kind}_name matches more than one catalog item`,
            );
            continue;
          }
          matched = matches[0];
        }

        if (
          (reference.id !== undefined || reference.name !== undefined) &&
          !matched
        ) {
          this.addRowError(
            errors,
            product.rowNumber,
            `${kind} was not found in the workspace`,
          );
          continue;
        }
        product.values[config.field] = matched?.id ?? null;
      }
    }
  }

  private async checkUniqueValues(
    client: PoolClient,
    products: PendingProduct[],
    context: { companyId: string; environmentId: string },
    errors: RowError[],
  ): Promise<void> {
    const skuRows = new Map<string, number>();
    const barcodeRows = new Map<string, number>();
    for (const product of products) {
      for (const [field, values] of [
        ['sku', skuRows],
        ['barcode', barcodeRows],
      ] as const) {
        const value = product.values[field];
        if (value === null) continue;
        if (values.has(value)) {
          this.addRowError(
            errors,
            product.rowNumber,
            `${field} is duplicated in the import`,
          );
        } else {
          values.set(value, product.rowNumber);
        }
      }
    }

    const skus = [...skuRows.keys()];
    const barcodes = [...barcodeRows.keys()];
    if (skus.length === 0 && barcodes.length === 0) return;
    const result = await client.query<{
      sku: string | null;
      barcode: string | null;
    }>(
      `SELECT sku, barcode
       FROM products
       WHERE company_id = $1
         AND environment_id = $2
         AND (sku = ANY($3::text[]) OR barcode = ANY($4::text[]))`,
      [context.companyId, context.environmentId, skus, barcodes],
    );
    const existingSkus = new Set(
      result.rows.flatMap((row) => (row.sku === null ? [] : [row.sku])),
    );
    const existingBarcodes = new Set(
      result.rows.flatMap((row) => (row.barcode === null ? [] : [row.barcode])),
    );
    for (const product of products) {
      if (product.values.sku && existingSkus.has(product.values.sku)) {
        this.addRowError(errors, product.rowNumber, 'sku already exists');
      }
      if (
        product.values.barcode &&
        existingBarcodes.has(product.values.barcode)
      ) {
        this.addRowError(errors, product.rowNumber, 'barcode already exists');
      }
    }
  }

  private addRowError(
    errors: RowError[],
    rowNumber: number,
    message: string,
  ): void {
    const rowError = errors.find((item) => item.row_number === rowNumber);
    if (rowError) {
      rowError.errors.push(message);
    } else {
      errors.push({ row_number: rowNumber, errors: [message] });
    }
  }
}
