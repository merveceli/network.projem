import { neon, Pool } from '@neondatabase/serverless';

// Serverless-compatible SQL client for Next.js API routes / Server Components
const sql = neon(process.env.DATABASE_URL!);
export default sql;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Helper: run a query and return rows
export async function query<T = Record<string, unknown>>(
    queryText: string,
    values?: unknown[]
): Promise<T[]> {
    const { rows } = await pool.query(queryText, values);
    return rows as T[];
}

// Helper: run a query and return first row or null
export async function queryOne<T = Record<string, unknown>>(
    queryText: string,
    values?: unknown[]
): Promise<T | null> {
    const rows = await query<T>(queryText, values);
    return rows[0] ?? null;
}
