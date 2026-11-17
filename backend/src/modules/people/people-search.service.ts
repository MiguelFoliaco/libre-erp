import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';
import { AuthorizationService } from '../../common/authorization/authorization.service';

export interface PersonSearchResult {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  second_last_name: string | null;
  document_number: string | null;
  email: string | null;
}

@Injectable()
export class PeopleSearchService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) { }

  async search(userId: string, searchValue: unknown): Promise<PersonSearchResult[]> {
    const { context } = await this.authorizationService.authorize(
      userId,
      'people',
      'READ',
    );
    if (typeof searchValue !== 'string' || searchValue.trim().length < 2) {
      throw new BadRequestException('Search must contain at least 2 characters');
    }

    const searchTerm = `%${searchValue.trim()}%`.replaceAll(' ','');
    const result = await this.pool.query<PersonSearchResult>(
      `SELECT 
        *
       FROM people
       WHERE company_id = $1
         AND environment_id = $2
         AND is_active = TRUE
         AND (
           concat_ws('', first_name, middle_name, last_name, second_last_name)
             ILIKE $3
           OR document_number ILIKE $3
         )
       ORDER BY last_name NULLS FIRST, first_name, id
       LIMIT 20`,
      [context.companyId, context.environmentId, searchTerm],
    );

    return result.rows;
  }
}
