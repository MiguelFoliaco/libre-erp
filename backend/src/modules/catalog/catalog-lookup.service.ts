import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { PG_POOL } from '../../database/database.module';

const CATALOGS = {
  brands: { table: 'brands', module: 'brands' },
  categories: { table: 'categories', module: 'categories' },
  departments: { table: 'departments', module: 'departments' },
} as const;

@Injectable()
export class CatalogLookupService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async search(userId: string, resourceName: string, queryValue: unknown) {
    const resource = CATALOGS[resourceName as keyof typeof CATALOGS];
    if (!resource) {
      throw new BadRequestException('Catalog search resource is not supported');
    }

    const { context } = await this.authorizationService.authorize(
      userId,
      resource.module,
      'READ',
    );
    if (typeof queryValue !== 'string' || queryValue.trim().length < 2) {
      throw new BadRequestException(
        'Search must contain at least 2 characters',
      );
    }

    const result = await this.pool.query<{ id: string; name: string }>(
      `SELECT id, name
       FROM ${resource.table}
       WHERE company_id = $1
         AND environment_id = $2
         AND is_active = TRUE
         AND name ILIKE $3
       ORDER BY name, id
       LIMIT 20`,
      [context.companyId, context.environmentId, `%${queryValue.trim()}%`],
    );
    return result.rows;
  }
}
