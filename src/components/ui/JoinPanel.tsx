"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The conversion path.
 *
 * The request/response logic here is carried over unchanged from the shipped
 * waitlist — same endpoint, same idempotent get-or-create by email, same
 * referral handling. Only the surface is new. This is the one component on the
 * page where a regression costs signups.
 */

type JoinResult = {
  position: number;
  inviteCode: string;
  accessCode: string;
  invitesUsed: number;
};

const EMAIL_STORAGE_KEY = "atrum_waitlist_email";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "atrum.fun";
const MAX_INVITES = 3;

async function submitJoin(email: string, ref: string | null): Promise<JoinResult> {
  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ref }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "That did not go through.");
  return data as JoinResult;
}

const field: React.CSSProperties = {
  flex: 1,
  minWidth: 210,
  padding: "var(--s-3) var(--s-4)",
  // Sits directly over the throne, so it needs to hold its own against
  // high-contrast stone rather than dissolve into it.
  background: "rgba(9, 10, 14, 0.88)",
  border: "1px solid var(--rule-strong)",
  borderRadius: "var(--r-control)",
  color: "var(--text)",
  // 16px, not the --t-small token: anything smaller makes iOS Safari zoom
  // the whole viewport in on focus, which is a jarring way to greet someone
  // about to submit the one form on this page that matters.
  fontSize: 16,
  outline: "none",
  backdropFilter: "blur(12px)",
};

const primary: React.CSSProperties = {
  padding: "var(--s-3) var(--s-6)",
  background:
    "linear-gradient(168deg, #F5F1E8, #E8E4DC 34%, #B9C0CA 62%, #F5F1E8)",
  color: "var(--atrum-void)",
  border: "none",
  borderRadius: "var(--r-control)",
  fontWeight: 600,
  fontSize: "var(--t-label)",
  letterSpacing: "var(--tr-label)",
  textTransform: "uppercase",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  padding: "var(--s-3) var(--s-4)",
  background: "transparent",
  border: "1px solid var(--rule-strong)",
  borderRadius: "var(--r-control)",
  color: "var(--text)",
  fontWeight: 600,
  fontSize: "var(--t-label)",
  letterSpacing: "var(--tr-label)",
  textTransform: "uppercase",
  cursor: "pointer",
};

export function JoinPanel({ countLabel }: { countLabel: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JoinResult | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedAccess, setCopiedAccess] = useState(false);
  const copyAccessTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore a returning visitor's seat without making them re-type their email.
  useEffect(() => {
    const saved = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!saved) return;
    submitJoin(saved, null)
      .then(setResult)
      .catch(() => {});
  }, []);

  useEffect(
    () => () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      if (copyAccessTimeout.current) clearTimeout(copyAccessTimeout.current);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    setError(null);
    const ref = new URLSearchParams(window.location.search).get("ref");
    try {
      const r = await submitJoin(email, ref);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not go through.");
    } finally {
      setPending(false);
    }
  };

  if (result) {
    const inviteLink = `${SITE_ORIGIN}/oath/${result.inviteCode}`;
    const shareHref =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(
        `I've joined the waitlist for @AtrumMarkets.\n\nPrivate prediction markets are coming.\n\n${inviteLink}`
      );

    const handleCopy = () => {
      navigator.clipboard?.writeText(inviteLink).catch(() => {});
      setCopied(true);
      copyTimeout.current = setTimeout(() => setCopied(false), 1800);
    };

    const handleCopyAccess = () => {
      navigator.clipboard?.writeText(result.accessCode).catch(() => {});
      setCopiedAccess(true);
      copyAccessTimeout.current = setTimeout(() => setCopiedAccess(false), 1800);
    };

    return (
      <div
        style={{
          border: "1px solid var(--rule-strong)",
          background: "rgba(9, 10, 14, 0.90)",
          backdropFilter: "blur(16px)",
          padding: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "var(--s-3)",
            flexWrap: "wrap",
          }}
        >
          <span
            className="display"
            style={{ fontSize: 44, lineHeight: 1, color: "var(--atrum-ivory)" }}
          >
            #{result.position.toLocaleString("en-US")}
          </span>
          <span className="label">Sealed in the ledger</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <div style={{ height: 1, background: "var(--rule)" }}>
            <div
              style={{
                height: 1,
                width: `${(result.invitesUsed / MAX_INVITES) * 100}%`,
                background: "linear-gradient(90deg, var(--atrum-iron), var(--atrum-halo))",
                boxShadow: "0 0 10px rgba(240, 217, 176, .5)",
                transition: "width var(--d-4) var(--e-reveal)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="label">
              {result.invitesUsed} / {MAX_INVITES} initiates
            </span>
            <span className="label">+100 places</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap", alignItems: "center" }}>
          <code
            className="mono"
            style={{
              flex: 1,
              minWidth: 180,
              padding: "var(--s-3)",
              background: "var(--bg-inset)",
              border: "1px solid var(--rule)",
              fontSize: "var(--t-caption)",
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {inviteLink}
          </code>
          <button type="button" onClick={handleCopy} style={ghost}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <a href={shareHref} target="_blank" rel="noopener" style={ghost}>
            Post it
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <span className="label" style={{ color: "var(--text-3)" }}>
            Testnet access code — enter this at launch to get in
          </span>
          <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap", alignItems: "center" }}>
            <code
              className="mono"
              style={{
                flex: 1,
                minWidth: 180,
                padding: "var(--s-3)",
                background: "var(--bg-inset)",
                border: "1px solid var(--rule)",
                fontSize: "var(--t-caption)",
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {result.accessCode}
            </code>
            <button type="button" onClick={handleCopyAccess} style={ghost}>
              {copiedAccess ? "Copied" : "Copy code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <label htmlFor="oath-email" style={{ position: "absolute", left: -9999 }}>
          Email address
        </label>
        <input
          id="oath-email"
          type="email"
          required
          placeholder="you@ciphered.mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={field}
        />
        <button type="submit" disabled={pending} style={{ ...primary, opacity: pending ? 0.7 : 1 }}>
          {pending ? "Sealing…" : "Take the oath"}
        </button>
      </form>
      <div className="label" style={{ color: error ? "var(--danger)" : "var(--text-3)" }}>
        {error ?? `${countLabel} initiates hold a seat · invite-only at launch`}
      </div>
    </div>
  );
}
