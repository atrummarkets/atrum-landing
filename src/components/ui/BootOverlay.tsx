"use client";

import { useEffect, useState } from "react";

import { BOOT_LINES } from "@/lib/copy";

/**
 * The threshold.
 *
 * Carried over from the shipped site: two dark panels parting on a seam of
 * light, with the mark and a counter. No stone doors — the split is drawn in
 * CSS so it paints on the first frame, while the WebGL bundle and every
 * texture are still in flight. Putting real doors here would mean waiting for
 * the very thing this exists to cover.
 *
 * One change from the original: the counter is bound to actual readiness
 * rather than a timer. It climbs on its own but stalls below 100 until the
 * scene reports in, so the doors never open onto an empty frame.
 */
export function BootOverlay({ ready }: { ready: boolean }) {
  const [opening, setOpening] = useState(false);
  const [gone, setGone] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => Math.min(t + 2, 92)), 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const open = setTimeout(() => setOpening(true), 260);
    const done = setTimeout(() => setGone(true), 1800);
    return () => {
      clearTimeout(open);
      clearTimeout(done);
    };
  }, [ready]);

  if (gone) return null;

  const pct = ready ? 100 : tick;
  const line = opening
    ? "The doors open"
    : BOOT_LINES[Math.min(BOOT_LINES.length - 1, Math.floor(pct / 26))];

  const panel: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50.15%",
    transition: "transform 1.05s cubic-bezier(.72, 0, .2, 1)",
    willChange: "transform",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        overflow: "hidden",
        pointerEvents: opening ? "none" : "auto",
      }}
      role="status"
      aria-live="polite"
      aria-label={opening ? "Entering" : "Loading"}
    >
      <div
        style={{
          ...panel,
          left: 0,
          background: "linear-gradient(90deg, #06070A 58%, #0C0E11)",
          transform: opening ? "translateX(-101%)" : "translateX(0)",
        }}
      />
      <div
        style={{
          ...panel,
          right: 0,
          background: "linear-gradient(270deg, #06070A 58%, #0C0E11)",
          transform: opening ? "translateX(101%)" : "translateX(0)",
        }}
      />

      {/* The seam. It grows with load progress, then floods as the panels part. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1,
          height: opening ? "100vh" : `${pct * 0.66}vh`,
          transform: "translate(-50%, -50%)",
          background:
            "linear-gradient(180deg, transparent, rgba(240,217,176,.85) 18%, #F5F1E8 50%, rgba(240,217,176,.85) 82%, transparent)",
          boxShadow: "0 0 20px rgba(240,217,176,.7), 0 0 60px rgba(240,217,176,.28)",
          opacity: opening ? 0.15 : 1,
          transition: "height .22s linear, opacity .9s ease",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--s-4)",
          opacity: opening ? 0 : 1,
          transition: "opacity .45s ease",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/mark.png"
          alt=""
          width={96}
          height={96}
          style={{ objectFit: "contain", opacity: 0.9 }}
        />
        <div
          className="display"
          style={{ fontSize: 58, lineHeight: 1, color: "var(--atrum-ivory)" }}
        >
          {String(Math.floor(pct)).padStart(3, "0")}
        </div>
        <div className="label">{line}</div>
      </div>
    </div>
  );
}
