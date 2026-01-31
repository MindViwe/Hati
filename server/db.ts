import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

/**
 * DEV MODE FALLBACK
 * -----------------
 * In production, DATABASE_URL MUST be set.
 * In local / Termux / Expo dev, we allow a fake URL
 * so the server can boot without a real Postgres instance.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://dev:dev@localhost:5432/dev";

/**
 * Create a pool even if the DB does not exist.
 * As long as no queries run, the server will stay alive.
 */
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false,
});

/**
 * Drizzle ORM instance
 */
export const db = drizzle(pool, { schema });
