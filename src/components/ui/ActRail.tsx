"use client";

import { useEffect, useState } from "react";

import { ACTS } from "@/lib/copy";
import { useScene } from "@/lib/progress";

/**
 * Six marks down the right edge.
 *
 * This exists to protect the conversion goal. Cinematic pacing must never trap
 * someone who already knows they want to sign up, so the rail is a real
 * jump-to-act control from the first frame — and, being ordinary buttons, it
 * doubles as the keyboard route through the experience.
 */
export function ActRail() {
  const { progress } = useScene();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const unsubscribe = progress.on("change", (v) => {
      setActive(Math.round(v * (ACTS.length - 1)));
    });
    return () => unsubscribe();
  }, [progress]);

  const goTo = (index: number) => {
    const target =
      (index / (ACTS.length - 1)) *
      (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Sections"
      style={{
        position: "fixed",
        right: "var(--s-3)",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
      }}
      // Touch targets stay full size; only the label is dropped on narrow
      // screens, where there is no room for it beside the copy.
      className="act-rail"
    >
      {ACTS.map((act, i) => (
        <button
          key={act.id}
          type="button"
          onClick={() => goTo(i)}
          aria-current={i === active ? "true" : undefined}
          title={act.nav}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "var(--s-2)",
            padding: "var(--s-1)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: i === active ? "var(--text)" : "var(--text-3)",
            transition: "color var(--d-2) var(--e-move)",
          }}
        >
          <span
            className="label"
            style={{
              fontSize: 10,
              opacity: i === active ? 1 : 0,
              transition: "opacity var(--d-2) var(--e-move)",
              color: "inherit",
            }}
          >
            {act.nav}
          </span>
          <span
            aria-hidden
            style={{
              width: i === active ? 18 : 8,
              height: 1,
              background: "currentColor",
              transition: "width var(--d-3) var(--e-reveal)",
            }}
          />
        </button>
      ))}
    </nav>
  );
}
