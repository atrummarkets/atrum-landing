import { Pool, type PoolClient } from "pg";

declare global {
  var __atrumPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment (see .env.example) before using the waitlist API."
    );
  }
  return new Pool({
    connectionString,
    ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
    max: 10,
  });
}

// Reuse the pool across hot reloads in dev and across invocations in prod.
export function getPool(): Pool {
  if (!global.__atrumPgPool) {
    global.__atrumPgPool = createPool();
  }
  return global.__atrumPgPool;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
