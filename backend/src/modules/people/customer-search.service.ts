import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthorizationService } from '../../common/authorization/authorization.service';
import { PG_POOL } from '../../database/database.module';

@Injectable()
export class CustomerSearchService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async search(userId: string, searchValue?: unknown) {
    const { context } = await this.authorizationService.authorize(
      userId,
      'customers',
      'READ',
    );
    if (
      searchValue !== undefined &&
      (typeof searchValue !== 'string' ||
        (searchValue.trim().length > 0 && searchValue.trim().length < 2))
    ) {
      throw new BadRequestException('Search must contain at least two characters');
    }

    const query = typeof searchValue === 'string'
      ? searchValue.trim().replace(/\s+/g, '')
      : '';
    const pattern = query ? `%${query}%` : null;
    const result = await this.pool.query(
      `SELECT customers.*, to_jsonb(people) AS person,
              customer_types.name AS customer_type_name
       FROM customers
       INNER JOIN people
         ON people.id = customers.person_id
        AND people.company_id = customers.company_id
        AND people.environment_id = customers.environment_id
       INNER JOIN customer_types
         ON customer_types.id = customers.customer_type_id
       WHERE customers.company_id = $1
         AND customers.environment_id = $2
         AND (
           $3::text IS NULL
           OR customers.customer_code ILIKE $3
           OR concat_ws('', people.first_name, people.middle_name, people.last_name, people.second_last_name) ILIKE $3
           OR people.document_number ILIKE $3
           OR people.email ILIKE $3
           OR people.phone ILIKE $3
         )
       ORDER BY people.last_name NULLS FIRST, people.first_name, customers.id
       LIMIT 200`,
      [context.companyId, context.environmentId, pattern],
    );
    return result.rows;
  }
}
