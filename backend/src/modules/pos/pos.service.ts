import { Inject, Injectable } from "@nestjs/common";
import { PG_POOL } from '@/database/database.module';
import { Pool } from "pg";
import { AuthorizationService } from '@/common/authorization/authorization.service';
import { cashRegisters } from '@/database/migrations/schema';

type CashRegistersWithWarehouse = typeof cashRegisters.$inferSelect & {
    warehouse_name: string;
    branch_name: string;
    branch_address: Record<string, string>
}

@Injectable()
export class PosServices {

    constructor(
        @Inject(PG_POOL) private readonly pool: Pool,
        private readonly authorizationService: AuthorizationService,
    ) { }


    async list(
        userId: string,
        query: string = '',
        limitValue?: string | number,
        offsetValue?: string | number,
    ) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'cash-registers',
            "READ"
        );

        const limit = limitValue !== undefined && limitValue !== '' ? Number(limitValue) : 50;
        const offset = offsetValue !== undefined && offsetValue !== '' ? Number(offsetValue) : 0;
        const searchPattern = `%${query.trim()}%`;

        const values = [context.companyId, context.environmentId, limit, offset, searchPattern];

        const { rows } = await this.pool.query<CashRegistersWithWarehouse>(
            `SELECT 
                cr.id,
                cr.company_id,
                cr.environment_id,
                cr.warehouse_id,
                cr."name",
                cr.code,
                cr.is_active,
                cr.metadata,
                cr.created_at,
                cr.updated_at,
                w."name" AS warehouse_name,
                b."name" AS branch_name,
                b.address as branch_address,
                b."id" AS branch_id
            FROM cash_registers cr
            INNER JOIN warehouses w
                ON w.id = cr.warehouse_id
            INNER JOIN branches b
                ON b.id = cr.branch_id
            WHERE cr.company_id = $1
              AND cr.environment_id = $2
              AND (cr."name" ILIKE $5 OR cr.code ILIKE $5)
            ORDER BY cr.created_at DESC, cr.id ASC
            LIMIT $3
            OFFSET $4;`,
            values,
        );

        return { items: rows, limit, offset };
    }

}