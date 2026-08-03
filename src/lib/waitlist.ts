import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool, withTransaction } from "./db";

const ACTIVITY_LABELS = [
  "took the oath",
  "sealed a seat",
  "claimed a key",
  "joined the rite",
] as const;

const MAX_INVITES = 3;
const BASE_COUNT = Number(process.env.WAITLIST_BASE_COUNT ?? 0);
const ID_SALT = process.env.WAITLIST_ID_SALT ?? "atrum-dev-salt";

export type WaitlistEntry = {
  id: number;
  position: number;
  inviteCode: string;
  accessCode: string;
  invitesUsed: number;
  createdAt: string;
};

export type FeedRow = {
  who: string;
  what: string;
  createdAt: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 320 && EMAIL_RE.test(email);
}

function inviteCodeForId(id: number): string {
  return "ATR-" + id.toString(36).toUpperCase().padStart(4, "0");
}

/**
 * Real access credential for the testnet gate — unlike inviteCodeForId,
 * this must not be derivable from the row id (80 bits of CSPRNG).
 */
function generateAccessCode(): string {
  const n = BigInt("0x" + randomBytes(10).toString("hex"));
  const b36 = n.toString(36).toUpperCase().padStart(16, "0");
  const grouped = b36.match(/.{1,4}/g)!.join("-");
  return "AC-" + grouped;
}

/** Deterministic pseudonymous id for the public live feed, e.g. 0x4f2a…c91 */
export function pseudonymFor(id: number): string {
  const hex = createHash("sha256").update(`${ID_SALT}:${id}`).digest("hex");
  return `0x${hex.slice(0, 4)}…${hex.slice(4, 7)}`;
}

function pickActivityLabel(): string {
  return ACTIVITY_LABELS[Math.floor(Math.random() * ACTIVITY_LABELS.length)];
}

function toEntry(row: {
  id: number;
  invite_code: string;
  access_code: string;
  invites_used: number;
  created_at: Date;
}): WaitlistEntry {
  return {
    id: row.id,
    position: row.id + BASE_COUNT,
    inviteCode: row.invite_code,
    accessCode: row.access_code,
    invitesUsed: row.invites_used,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Get-or-create by email (idempotent: resubmitting the same email returns the
 * existing seat rather than erroring). If `refCode` names a real, distinct
 * entry, the referrer's invite count is bumped (capped at 3) on first join.
 */
export async function joinWaitlist(
  email: string,
  refCode: string | null
): Promise<WaitlistEntry> {
  const normalized = normalizeEmail(email);

  return withTransaction(async (client) => {
    const referrer = refCode ? await findByInviteCode(client, refCode) : null;
    const referredByCode = referrer && referrer.email_normalized !== normalized
      ? referrer.invite_code
      : null;

    const { rows } = await client.query<{
      id: number;
      invite_code: string | null;
      access_code: string | null;
      invites_used: number;
      created_at: Date;
      inserted: boolean;
    }>(
      `INSERT INTO waitlist_entries (email, email_normalized, referred_by_code, activity_label)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email_normalized) DO UPDATE SET email_normalized = EXCLUDED.email_normalized
       RETURNING id, invite_code, access_code, invites_used, created_at, (xmax = 0) AS inserted`,
      [email, normalized, referredByCode, pickActivityLabel()]
    );
    const row = rows[0];

    if (row.inserted) {
      const code = inviteCodeForId(row.id);

      // Collision odds at 80 bits are negligible; this loop is a formality,
      // not a real-world concern. Checked ahead of the UPDATE rather than
      // relying on the unique index, since a caught unique_violation would
      // poison this transaction and roll back the row just inserted above.
      let accessCode = generateAccessCode();
      for (let attempts = 0; attempts < 5; attempts++) {
        const { rows: clash } = await client.query(
          `SELECT 1 FROM waitlist_entries WHERE access_code = $1`,
          [accessCode]
        );
        if (clash.length === 0) break;
        accessCode = generateAccessCode();
      }

      await client.query(
        `UPDATE waitlist_entries SET invite_code = $1, access_code = $2 WHERE id = $3`,
        [code, accessCode, row.id]
      );
      row.invite_code = code;
      row.access_code = accessCode;

      if (referredByCode) {
        await client.query(
          `UPDATE waitlist_entries
           SET invites_used = LEAST(invites_used + 1, $2)
           WHERE invite_code = $1`,
          [referredByCode, MAX_INVITES]
        );
      }
    }

    return toEntry({
      id: row.id,
      invite_code: row.invite_code as string,
      access_code: row.access_code as string,
      invites_used: row.invites_used,
      created_at: row.created_at,
    });
  });
}

/** Used by the internal access-code validate endpoint. Returns a bare boolean by design — callers must never surface which row matched. */
export async function isValidAccessCode(code: string): Promise<boolean> {
  const { rows } = await getPool().query(
    `SELECT 1 FROM waitlist_entries WHERE access_code = $1`,
    [code.trim().toUpperCase()]
  );
  return rows.length > 0;
}

async function findByInviteCode(client: PoolClient, code: string) {
  const { rows } = await client.query<{
    invite_code: string;
    email_normalized: string;
  }>(
    `SELECT invite_code, email_normalized FROM waitlist_entries WHERE invite_code = $1`,
    [code.trim().toUpperCase()]
  );
  return rows[0] ?? null;
}

export async function getWaitlistStats(): Promise<{ count: number; displayCount: number }> {
  const { rows } = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM waitlist_entries`
  );
  const count = Number(rows[0]?.count ?? 0);
  return { count, displayCount: count + BASE_COUNT };
}

export async function getRecentFeed(limit = 2): Promise<FeedRow[]> {
  const { rows } = await getPool().query<{
    id: number;
    activity_label: string;
    created_at: Date;
  }>(
    `SELECT id, activity_label, created_at
     FROM waitlist_entries
     ORDER BY created_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 20)]
  );
  return rows.map((r) => ({
    who: pseudonymFor(r.id),
    what: r.activity_label,
    createdAt: r.created_at.toISOString(),
  }));
}
