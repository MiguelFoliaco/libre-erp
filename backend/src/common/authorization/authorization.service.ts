import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';
import { API_RESOURCES, ApiResource } from '../crud/resources';
import { assertPermission, CrudAction } from './permissions';

export interface AuthorizationContext {
  userId: string;
  companyId: string;
  environmentId: string;
  grants: string[];
  isRoot: boolean;
}

@Injectable()
export class AuthorizationService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async authorize(
    userId: string,
    resourceName: string,
    action: CrudAction,
  ): Promise<{ resource: ApiResource; context: AuthorizationContext }> {
    const resource = (API_RESOURCES as Record<string, ApiResource>)[
      resourceName
    ];
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const context = await this.getContext(userId);
    assertPermission(context.grants, resource.module, action);
    if (resource.readOnly && action !== 'READ') {
      throw new ForbiddenException('This resource is read-only');
    }
    if (resource.table === 'audit_logs' && action !== 'READ') {
      throw new ForbiddenException('Audit logs cannot be modified');
    }
    if (resourceName === 'companies' && action !== 'READ' && !context.isRoot) {
      throw new ForbiddenException(
        'Only a super administrator can manage companies',
      );
    }
    return { resource, context };
  }

  async authorizeReport(userId: string): Promise<AuthorizationContext> {
    const context = await this.getContext(userId);
    assertPermission(context.grants, 'Report', 'READ');
    return context;
  }

  async getContext(userId: string): Promise<AuthorizationContext> {
    const result = await this.pool.query<{
      company_id: string;
      environment_id: string;
      actions: string[] | null;
    }>(
      `SELECT u.company_id, u.environment_id, r.actions
       FROM users u
       JOIN companies c ON c.id = u.company_id AND c.is_active = TRUE
       JOIN environments e
         ON e.id = u.environment_id
        AND e.company_id = u.company_id
        AND e.is_active = TRUE
       LEFT JOIN user_roles ur
         ON ur.company_id = u.company_id
        AND ur.environment_id = u.environment_id
        AND ur.user_id = u.id
       LEFT JOIN roles r
         ON r.id = ur.role_id
        AND r.company_id = ur.company_id
        AND r.environment_id = ur.environment_id
        AND r.is_active = TRUE
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [userId],
    );
    if (result.rowCount === 0) {
      throw new ForbiddenException(
        'User is not assigned to an active workspace',
      );
    }
    const user = result.rows[0];
    const grants = [
      ...new Set(
        result.rows.flatMap((row) =>
          Array.isArray(row.actions) ? row.actions : [],
        ),
      ),
    ];
    return {
      userId,
      companyId: user.company_id,
      environmentId: user.environment_id,
      grants,
      isRoot: grants.includes('*'),
    };
  }
}
