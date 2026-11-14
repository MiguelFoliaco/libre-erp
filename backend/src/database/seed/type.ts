import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from '../migrations/schema';


export type DB = NodePgDatabase<typeof schema> & {
    $client: Pool;
};

export const Schema = schema;