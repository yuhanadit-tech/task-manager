import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // For local dev: postgresql://taskmanager:taskmanager_dev@localhost:5432/taskmanager_db
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
