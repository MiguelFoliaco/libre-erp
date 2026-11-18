import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { PG_POOL } from '../../database/database.module';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRODUCT_TYPES = new Set(['physical', 'virtual', 'service']);

function comparePrices(left: string, right: string): number {
  const [leftWhole, leftFraction = ''] = left.split('.');
  const [rightWhole, rightFraction = ''] = right.split('.');
  const normalizedLeft = leftWhole.replace(/^0+(?=\d)/, '');
  const normalizedRight = rightWhole.replace(/^0+(?=\d)/, '');
  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length - normalizedRight.length;
  }
  if (normalizedLeft !== normalizedRight) {
    return normalizedLeft < normalizedRight ? -1 : 1;
  }
  const fractionLength = Math.max(leftFraction.length, rightFraction.length);
  const paddedLeft = leftFraction.padEnd(fractionLength, '0');
  const paddedRight = rightFraction.padEnd(fractionLength, '0');
  return paddedLeft === paddedRight ? 0 : paddedLeft < paddedRight ? -1 : 1;
}

interface ProductSearchFilters {
  query?: string;
  brand_id?: string;
  category_id?: string;
  department_id?: string;
  product_type?: string;
  is_active?: string;
  sale_price_min?: string;
  sale_price_max?: string;
  limit?: string;
  offset?: string;
}

function readOptionalString(
  filters: Record<string, unknown>,
  key: keyof ProductSearchFilters,
): string | undefined {
  const value = filters[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${key} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseUuid(
  value: string | undefined,
  field: string,
): string | undefined {
  if (value === undefined) return undefined;
  if (!UUID_PATTERN.test(value)) {
    throw new BadRequestException(`${field} must be a valid UUID`);
  }
  return value;
}

function parsePrice(
  value: string | undefined,
  field: string,
): string | undefined {
  if (value === undefined) return undefined;
  if (!/^\d{1,14}(?:\.\d{1,6})?$/.test(value)) {
    throw new BadRequestException(
      `${field} must be a non-negative number with up to 6 decimal places`,
    );
  }
  return value;
}

function parsePagination(
  value: string | undefined,
  field: string,
  fallback: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new BadRequestException(`${field} cannot exceed ${maximum}`);
  }
  return parsed;
}

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async search(userId: string, rawFilters: Record<string, unknown>) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'products',
      'READ',
    );

    const query = readOptionalString(rawFilters, 'query');
    if (query !== undefined && query.length < 2) {
      throw new BadRequestException(
        'Search must contain at least 2 characters',
      );
    }

    const brandId = parseUuid(
      readOptionalString(rawFilters, 'brand_id'),
      'brand_id',
    );
    const categoryId = parseUuid(
      readOptionalString(rawFilters, 'category_id'),
      'category_id',
    );
    const departmentId = parseUuid(
      readOptionalString(rawFilters, 'department_id'),
      'department_id',
    );
    const productType = readOptionalString(rawFilters, 'product_type');
    if (productType !== undefined && !PRODUCT_TYPES.has(productType)) {
      throw new BadRequestException('product_type is not supported');
    }

    const isActiveValue = readOptionalString(rawFilters, 'is_active');
    if (
      isActiveValue !== undefined &&
      isActiveValue !== 'true' &&
      isActiveValue !== 'false'
    ) {
      throw new BadRequestException('is_active must be true or false');
    }
    const salePriceMin = parsePrice(
      readOptionalString(rawFilters, 'sale_price_min'),
      'sale_price_min',
    );
    const salePriceMax = parsePrice(
      readOptionalString(rawFilters, 'sale_price_max'),
      'sale_price_max',
    );
    if (
      salePriceMin !== undefined &&
      salePriceMax !== undefined &&
      comparePrices(salePriceMin, salePriceMax) > 0
    ) {
      throw new BadRequestException(
        'sale_price_min cannot be greater than sale_price_max',
      );
    }

    const limit = parsePagination(
      readOptionalString(rawFilters, 'limit'),
      'limit',
      50,
      200,
    );
    const offset = parsePagination(
      readOptionalString(rawFilters, 'offset'),
      'offset',
      0,
      1_000_000,
    );

    const conditions = ['p.company_id = $1', 'p.environment_id = $2'];
    const values: unknown[] = [context.companyId, context.environmentId];
    const bind = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };
    const addCondition = (sql: string, value: unknown) => {
      conditions.push(sql.replace('?', bind(value)));
    };

    if (query !== undefined) {
      const parameter = bind(`%${query}%`);
      conditions.push(
        `(p.name ILIKE ${parameter} OR p.sku ILIKE ${parameter} OR p.barcode ILIKE ${parameter})`,
      );
    }
    if (brandId) addCondition('p.brand_id = ?', brandId);
    if (categoryId) addCondition('p.category_id = ?', categoryId);
    if (departmentId) addCondition('p.department_id = ?', departmentId);
    if (productType) addCondition('p.product_type = ?', productType);
    if (isActiveValue !== undefined) {
      addCondition('p.is_active = ?', isActiveValue === 'true');
    }
    if (salePriceMin !== undefined) {
      addCondition('p.sale_price >= ?', salePriceMin);
    }
    if (salePriceMax !== undefined) {
      addCondition('p.sale_price <= ?', salePriceMax);
    }

    values.push(limit, offset);
    const result = await this.pool.query(
      `SELECT p.*,
              b.name AS brand_name,
              c.name AS category_name,
              d.name AS department_name
       FROM products p
       LEFT JOIN brands b
         ON b.id = p.brand_id
        AND b.company_id = p.company_id
        AND b.environment_id = p.environment_id
       LEFT JOIN categories c
         ON c.id = p.category_id
        AND c.company_id = p.company_id
        AND c.environment_id = p.environment_id
       LEFT JOIN departments d
         ON d.id = p.department_id
        AND d.company_id = p.company_id
        AND d.environment_id = p.environment_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.name, p.id
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    return { items: result.rows, limit, offset };
  }
}
