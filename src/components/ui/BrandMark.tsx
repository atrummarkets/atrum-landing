"use client";

/**
 * The wordmark, fixed top-left across the whole scroll.
 *
 * On the shipped site this only existed inside the hero, because the hero was
 * the whole page. Here the page is one continuous descent, so the mark moves
 * to the fixed chrome layer — same role as the act rail on the right — rather
 * than being repeated per act or left to only appear once at the very top.
 *
 * Deliberately small and quiet: Act I already carries the mark at full size
 * and full attention. This is a signature in the corner, not a second hero.
 */
export function BrandMark({ ready }: { ready: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "var(--s-4)",
        left: "var(--s-5)",
        zIndex: 20,
        opacity: ready ? 0.88 : 0,
        transition: "opacity var(--d-4) var(--e-reveal)",
        pointerEvents: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/wordmark-chrome.png"
        alt="Atrum"
        style={{
          display: "block",
          height: 22,
          width: "auto",
          filter: "drop-shadow(0 0 16px rgba(6,7,10,0.9))",
        }}
      />
    </div>
  );
}
