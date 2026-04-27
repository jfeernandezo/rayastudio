import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const useSsl = process.env.DATABASE_SSL === "true";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export async function waitForDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL precisa estar definido para iniciar o Raya Studio.");
  }

  const client = await pool.connect();
  client.release();
}
