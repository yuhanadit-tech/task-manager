import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DbInstance = NeonHttpDatabase<typeof schema>;

let _db: DbInstance | null = null;

/**
 * Returns the Drizzle db instance.
 * Lazily initialized on first call.
 *
 * During Next.js static build (no DATABASE_URL), returns a placeholder
 * Drizzle instance bound to a dummy URL so the adapter type-check passes.
 * Actual queries will fail at runtime if DATABASE_URL is not set —
 * which is the correct behaviour (fail fast at request time, not build time).
 */
export function getDb(): DbInstance {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL ?? "postgresql://build-placeholder:5432/placeholder";
  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

// Convenience proxy — all method calls are forwarded to the real db
export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
