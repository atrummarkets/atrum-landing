// One-time backfill: give every waitlist row that predates the access_code column a real
// one, using the exact same generator as joinWaitlist() (src/lib/waitlist.ts) so backfilled
// codes are indistinguishable from ones issued at signup.
//
// Usage: node --env-file=.env.local scripts/backfill-access-codes.mjs [--dry-run]
import { randomBytes } from "node:crypto";
import pg from "pg";

const DRY_RUN = process.argv.includes("--dry-run");

function generateAccessCode() {
  const n = BigInt("0x" + randomBytes(10).toString("hex"));
  const b36 = n.toString(36).toUpperCase().padStart(16, "0");
  const grouped = b36.match(/.{1,4}/g).join("-");
  return "AC-" + grouped;
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

await client.connect();

const { rows } = await client.query(
  "SELECT id, email_normalized FROM waitlist_entries WHERE access_code IS NULL ORDER BY id",
);
console.log(`${rows.length} row(s) missing an access_code${DRY_RUN ? " (dry run)" : ""}`);

let done = 0;
for (const row of rows) {
  let code = generateAccessCode();
  // Same collision guard joinWaitlist uses: negligible odds at 80 bits, checked anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { rows: clash } = await client.query(
      "SELECT 1 FROM waitlist_entries WHERE access_code = $1",
      [code],
    );
    if (clash.length === 0) break;
    code = generateAccessCode();
  }

  if (DRY_RUN) {
    console.log(`  id=${row.id} (${row.email_normalized}) -> ${code}`);
  } else {
    await client.query("UPDATE waitlist_entries SET access_code = $1 WHERE id = $2", [code, row.id]);
  }
  done++;
}

console.log(`${DRY_RUN ? "would backfill" : "backfilled"} ${done} row(s)`);
await client.end();
