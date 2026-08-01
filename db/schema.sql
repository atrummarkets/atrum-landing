-- ATRUM waitlist schema (PostgreSQL, no ORM)
-- Apply with: npm run db:migrate  (or: psql "$DATABASE_URL" -f db/schema.sql)

-- referred_by_code's FK is added after the unique index below exists (a FK
-- target needs a unique constraint/index in place before it can reference it).
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id               SERIAL PRIMARY KEY,
  email            TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  invite_code      TEXT,
  referred_by_code TEXT,
  invites_used     SMALLINT NOT NULL DEFAULT 0 CHECK (invites_used BETWEEN 0 AND 3),
  activity_label   TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on email; lookups/upserts key off this.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_entries_email_normalized_key
  ON waitlist_entries (email_normalized);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_entries_invite_code_key
  ON waitlist_entries (invite_code);

-- Powers the live "who joined" feed (latest first).
CREATE INDEX IF NOT EXISTS waitlist_entries_created_at_idx
  ON waitlist_entries (created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'waitlist_entries_referred_by_fkey'
  ) THEN
    ALTER TABLE waitlist_entries
      ADD CONSTRAINT waitlist_entries_referred_by_fkey
      FOREIGN KEY (referred_by_code) REFERENCES waitlist_entries (invite_code);
  END IF;
END $$;
