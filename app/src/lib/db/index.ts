import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type DbInstance = PostgresJsDatabase<typeof schema>;

let _db: DbInstance | null = null;

/**
 * Returns the Drizzle db instance backed by postgres.js.
 * Lazily initialized on first call so DATABASE_URL is not evaluated at build time.
 *
 * During Next.js static build (no real DATABASE_URL), a placeholder URL is used.
 * Actual queries will fail at runtime if DATABASE_URL is not set — which is
 * correct behaviour (fail fast at request time, not build time).
 */
export function getDb(): DbInstance {
  if (_db) return _db;

  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://build-placeholder:password@localhost:5432/placeholder";

  const client = postgres(databaseUrl, { max: 10 });
  _db = drizzle(client, { schema });
  return _db;
}

// Convenience proxy — all method calls are forwarded to the real db instance
export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
