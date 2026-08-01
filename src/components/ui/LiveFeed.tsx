"use client";

import { useEffect, useState } from "react";

import type { FeedRow } from "@/lib/waitlist";

/**
 * Proof that other people are already inside.
 *
 * Identities are pseudonymous by construction — the server hashes the row id
 * rather than exposing anything about the person — which makes this the one
 * piece of social proof that does not contradict the product's own promise.
 */
export function LiveFeed({ initial }: { initial: FeedRow[] }) {
  const [rows, setRows] = useState<FeedRow[]>(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/waitlist/feed");
        if (!res.ok) return;
        const data = (await res.json()) as { feed: FeedRow[] };
        if (Array.isArray(data.feed) && data.feed.length) setRows(data.feed);
      } catch {
        // A dead feed is cosmetic; never surface it over the CTA.
      }
    }, 12_000);
    return () => clearInterval(id);
  }, []);

  if (!rows.length) return null;

  return (
    <ul
      style={{
        listStyle: "none",
        margin: "var(--s-4) 0 0",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      {rows.map((row) => (
        <li
          key={`${row.who}-${row.createdAt}`}
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--s-2)",
            fontSize: "var(--t-caption)",
            color: "var(--text-3)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 4,
              height: 4,
              borderRadius: "var(--r-full)",
              background: "var(--atrum-halo)",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--text-2)" }}>{row.who}</span>
          <span>{row.what}</span>
        </li>
      ))}
    </ul>
  );
}
