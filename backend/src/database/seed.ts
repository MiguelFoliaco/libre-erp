import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './migrations/schema';
import { createSeed } from './seed/index';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured before running the seed');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seedDatabase(): Promise<void> {
    try {
        const result = await createSeed(db);
        console.info('Initial seed completed', result);
    } catch (error) {
        console.error('Initial seed failed', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

void seedDatabase();


