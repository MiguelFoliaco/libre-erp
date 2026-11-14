import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';
import { AuthorizationService } from '../../common/authorization/authorization.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async inventory(userId: string) {
    const context = await this.authorizationService.authorizeReport(userId);
    const result = await this.pool.query(
      `SELECT p.id AS product_id, p.sku, p.name AS product_name,
              w.id AS warehouse_id, w.name AS warehouse_name,
              i.quantity, i.reserved_quantity
       FROM inventory i
       JOIN products p
         ON p.id = i.product_id
        AND p.company_id = i.company_id
        AND p.environment_id = i.environment_id
       JOIN warehouses w
         ON w.id = i.warehouse_id
        AND w.company_id = i.company_id
        AND w.environment_id = i.environment_id
       WHERE i.company_id = $1 AND i.environment_id = $2
       ORDER BY p.name, w.name`,
      [context.companyId, context.environmentId],
    );
    return result.rows;
  }

  async sales(userId: string, from?: string, to?: string) {
    const context = await this.authorizationService.authorizeReport(userId);
    this.validateDateRange(from, to);
    const result = await this.pool.query(
      `SELECT date_trunc('day', sale_date)::date AS date,
              COUNT(*)::integer AS sales_count,
              COALESCE(SUM(subtotal), 0)::text AS subtotal,
              COALESCE(SUM(tax_total), 0)::text AS tax_total,
              COALESCE(SUM(total), 0)::text AS total
       FROM sales
       WHERE company_id = $1
         AND environment_id = $2
         AND ($3::date IS NULL OR sale_date >= $3::date)
         AND ($4::date IS NULL OR sale_date < $4::date + INTERVAL '1 day')
       GROUP BY date_trunc('day', sale_date)::date
       ORDER BY date`,
      [context.companyId, context.environmentId, from ?? null, to ?? null],
    );
    return result.rows;
  }

  private validateDateRange(from?: string, to?: string): void {
    const isDate = (value: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
    if ((from && !isDate(from)) || (to && !isDate(to))) {
      throw new BadRequestException('Dates must use YYYY-MM-DD format');
    }
    if (from && to && from > to) {
      throw new BadRequestException('"from" must be on or before "to"');
    }
  }
}
