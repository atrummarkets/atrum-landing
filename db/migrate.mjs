// Applies db/schema.sql to DATABASE_URL. Safe to run repeatedly (uses IF NOT EXISTS).
// Usage: npm run db:migrate
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Put it in .env.local (or export it) before running migrations."
  );
  process.exit(1);
}

const schemaPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "schema.sql"
);
const sql = readFileSync(schemaPath, "utf8");

const client = new Client({
  connectionString,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("✓ waitlist_entries schema applied");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
