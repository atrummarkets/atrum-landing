"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

import { ACTS, BUILDERS, LAWS, MECHANISM, MARKETS } from "@/lib/copy";
import { useScene } from "@/lib/progress";
import type { FeedRow } from "@/lib/waitlist";

import { JoinPanel } from "../ui/JoinPanel";
import { LiveFeed } from "../ui/LiveFeed";

const COUNT = ACTS.length;

/**
 * Copy overlays.
 *
 * Every act reads the same scroll value the camera does, so text and camera can
 * never drift apart — they are two views of one number rather than two
 * timelines that happen to be tuned alike.
 */
function useActOpacity(index: number): MotionValue<number> {
  const { progress } = useScene();
  const centre = index / (COUNT - 1);
  const span = 1 / (COUNT - 1);
  // Hold at full opacity across the middle of the act, fade at the shoulders.
  return useTransform(
    progress,
    [centre - span * 0.62, centre - span * 0.24, centre + span * 0.24, centre + span * 0.62],
    [0, 1, 1, 0]
  );
}

/**
 * Reveal timed to the camera passing a specific pillar.
 *
 * The colonnade is laid out so the camera passes each law-bearing pillar in
 * turn across Act III; this maps item `i` onto that same stretch of scroll, so
 * a law arrives as its pillar does. Move a pillar in LAYOUT and its law
 * follows.
 */
function usePassOpacity(actIndex: number, i: number, n: number): MotionValue<number> {
  const { progress, reducedMotion } = useScene();
  const centre = actIndex / (COUNT - 1);
  const span = 1 / (COUNT - 1);
  const from = centre - span * 0.52;
  const to = centre + span * 0.3;
  const step = (to - from) / n;
  const at = from + step * i;
  return useTransform(
    progress,
    [at, at + step * 0.72],
    reducedMotion ? [1, 1] : [0, 1]
  );
}

function useActShift(index: number): MotionValue<number> {
  const { progress, reducedMotion } = useScene();
  const centre = index / (COUNT - 1);
  const span = 1 / (COUNT - 1);
  return useTransform(
    progress,
    [centre - span * 0.62, centre + span * 0.62],
    reducedMotion ? [0, 0] : [26, -26]
  );
}

const stage: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2,
  display: "grid",
  placeItems: "center",
  padding: "var(--s-6) var(--s-5)",
  pointerEvents: "none",
};

function Act({
  index,
  children,
  align = "center",
}: {
  index: number;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  const opacity = useActOpacity(index);
  const y = useActShift(index);

  return (
    <motion.section
      style={{
        ...stage,
        opacity,
        y,
        placeItems: align === "center" ? "center" : "center start",
      }}
      aria-labelledby={`act-${ACTS[index].id}`}
    >
      {/* Scrim. Stone and fog are high-contrast and text sits directly on
          them; without this the body copy competes with the art it is meant
          to be read against. Kept as a soft gradient rather than a panel so
          it never reads as a card floating over the scene. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            align === "center"
              ? // Generous on the vertical axis so a tall phone viewport keeps
                // the panel and footer covered, not just the headline.
                "radial-gradient(ellipse 76% 60% at 50% 50%, rgba(6,7,10,0.84), rgba(6,7,10,0) 76%)"
              : // Full-width acts need a band, not a left-to-right fade: the
                // rightmost column would otherwise sit on bare art.
                "linear-gradient(180deg, rgba(6,7,10,0) 4%, rgba(6,7,10,0.88) 26%, rgba(6,7,10,0.88) 74%, rgba(6,7,10,0) 96%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "min(100%, var(--page-max))",
          display: "flex",
          flexDirection: "column",
          alignItems: align === "center" ? "center" : "flex-start",
          textAlign: align === "center" ? "center" : "left",
          gap: "var(--s-4)",
        }}
      >
        {children}
      </div>
    </motion.section>
  );
}

/**
 * One law, arriving as the camera reaches its pillar. Its own component so the
 * per-item hook is called once per render rather than inside a loop.
 */
function Law({ law, index }: { law: (typeof LAWS)[number]; index: number }) {
  const opacity = usePassOpacity(2, index, LAWS.length);
  const { reducedMotion } = useScene();
  const x = useTransform(opacity, [0, 1], reducedMotion ? [0, 0] : [-14, 0]);

  return (
    <motion.div
      style={{ opacity, x, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}
    >
      <span className="label" style={{ color: "var(--atrum-champagne)" }}>
        {law.n}
      </span>
      <h3 className="display" style={{ margin: 0, fontSize: "var(--t-h3)", color: "var(--text)" }}>
        {law.title}
      </h3>
      <p className="body" style={{ margin: 0, fontSize: "var(--t-small)" }}>
        {law.body}
      </p>
    </motion.div>
  );
}

export function Acts({
  initialFeed,
  countLabel,
}: {
  initialFeed: FeedRow[];
  countLabel: string;
}) {
  return (
    <>
      {/* I — The Void. Atmosphere before information. */}
      <Act index={0}>
        <span className="label">{ACTS[0].label}</span>
        <h1
          id="act-void"
          className="wordmark chrome"
          style={{ margin: 0, fontSize: "clamp(46px, 9.6vw, 164px)" }}
        >
          ATRUM
        </h1>
        <p className="display chrome" style={{ margin: 0, fontSize: "var(--t-h2)" }}>
          {ACTS[0].display}
        </p>
        <p className="body" style={{ margin: 0 }}>
          {ACTS[0].body}
        </p>
        <span className="label" style={{ marginTop: "var(--s-6)", opacity: 0.7 }}>
          {ACTS[0].cue} ↓
        </span>
      </Act>

      {/* II — The Sentinel. What is Atrum? */}
      <Act index={1}>
        <span className="label">{ACTS[1].label}</span>
        <h2
          id="act-sentinel"
          className="display chrome"
          style={{ margin: 0, fontSize: "var(--t-h1)", maxWidth: "16ch" }}
        >
          {ACTS[1].display}
        </h2>
        <p className="body" style={{ margin: 0 }}>
          {ACTS[1].body}
        </p>
      </Act>

      {/* III — The Colonnade. One law per pillar. */}
      <Act index={2} align="start">
        <span className="label">{ACTS[2].label}</span>
        <h2
          id="act-colonnade"
          className="display chrome"
          style={{ margin: 0, fontSize: "var(--t-h1)" }}
        >
          {ACTS[2].display}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "var(--s-5)",
            width: "100%",
            marginTop: "var(--s-3)",
          }}
        >
          {LAWS.map((law, i) => (
            <Law key={law.n} law={law} index={i} />
          ))}
        </div>
      </Act>

      {/* IV — The Seal. How it works, plus the odds engraved in the floor. */}
      <Act index={3} align="start">
        <span className="label">{ACTS[3].label}</span>
        <h2
          id="act-seal"
          className="display chrome"
          style={{ margin: 0, fontSize: "var(--t-h1)" }}
        >
          {ACTS[3].display}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--s-5)",
            width: "100%",
          }}
        >
          {MECHANISM.map((step) => (
            <div key={step.n} style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <span className="label" style={{ color: "var(--atrum-champagne)" }}>
                {step.n}
              </span>
              <h3
                className="display"
                style={{ margin: 0, fontSize: "var(--t-h3)", color: "var(--text)" }}
              >
                {step.title}
              </h3>
              <p className="body" style={{ margin: 0, fontSize: "var(--t-small)" }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* The odds are public; the depth behind them is not. Showing the
            number beside a sealed pool states the product's core claim. */}
        <div
          style={{
            width: "100%",
            marginTop: "var(--s-4)",
            borderTop: "1px solid var(--rule)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          }}
        >
          {MARKETS.slice(0, 4).map((m) => (
            <div
              key={m.q}
              className="mono"
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "var(--s-3)",
                padding: "var(--s-3) var(--s-4) var(--s-3) 0",
                fontSize: "var(--t-caption)",
                color: "var(--text-2)",
              }}
            >
              <span>{m.q}</span>
              <span style={{ color: "var(--atrum-ivory)", fontSize: 15 }}>{m.p}</span>
              <span className="label" style={{ color: "var(--sealed)" }}>
                sealed
              </span>
            </div>
          ))}
        </div>
      </Act>

      {/* V — The Throne. Why trust it? */}
      <Act index={4}>
        <span className="label">{ACTS[4].label}</span>
        <h2
          id="act-throne"
          className="display chrome"
          style={{ margin: 0, fontSize: "var(--t-h1)", maxWidth: "18ch" }}
        >
          {ACTS[4].display}
        </h2>
        <p className="body" style={{ margin: 0 }}>
          {ACTS[4].body}
        </p>
      </Act>

      {/* VI — The Oath. */}
      <Act index={5}>
        <span className="label">{ACTS[5].label}</span>
        <h2
          id="act-oath"
          className="display chrome"
          style={{ margin: 0, fontSize: "var(--t-h1)", maxWidth: "16ch" }}
        >
          {ACTS[5].display}
        </h2>
        <p className="body" style={{ margin: 0 }}>
          {ACTS[5].body}
        </p>
        <div id="oath" style={{ width: "min(100%, 620px)", pointerEvents: "auto" }}>
          <JoinPanel countLabel={countLabel} />
          <LiveFeed initial={initialFeed} />
        </div>

      </Act>

      {/* VII — The Builders. The only place on the page that names anyone. */}
      <Act index={6}>
        <span className="label">{ACTS[6].label}</span>
        <h2
          id="act-builders"
          className="display chrome"
          style={{ margin: 0, fontSize: "var(--t-h1)", maxWidth: "16ch" }}
        >
          {ACTS[6].display}
        </h2>
        <p className="body" style={{ margin: 0 }}>
          {ACTS[6].body}
        </p>

        <div
          style={{
            display: "flex",
            gap: "var(--s-6)",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "var(--s-4)",
            pointerEvents: "auto",
          }}
        >
          {BUILDERS.map((person) => (
            <a
              key={person.handle}
              href={`https://x.com/${person.handle}`}
              target="_blank"
              rel="noopener"
              className="builder"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--s-2)",
              }}
            >
              {/* Cut, not moulded: square frames rather than the usual avatar
                  circle, which the token system reserves for the aperture. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={person.portrait}
                alt=""
                width={132}
                height={132}
                style={{
                  display: "block",
                  border: "1px solid var(--rule-strong)",
                  filter: "grayscale(1)",
                  // The seal behind is high-contrast stone; without a ground
                  // the portraits read as smudges on it.
                  background: "var(--bg-inset)",
                  boxShadow: "0 0 40px rgba(6,7,10,0.9)",
                }}
              />
              <span
                className="display"
                style={{ fontSize: "var(--t-h3)", color: "var(--text)" }}
              >
                {person.name}
              </span>
              <span className="mono" style={{ fontSize: "var(--t-caption)", color: "var(--text-2)" }}>
                @{person.handle}
              </span>
            </a>
          ))}
        </div>

        {/* Coda. The experience closes quietly rather than stopping. */}
        <footer
          style={{
            width: "min(100%, 620px)",
            marginTop: "var(--s-7)",
            paddingTop: "var(--s-4)",
            borderTop: "1px solid var(--rule)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--s-3)",
            flexWrap: "wrap",
            pointerEvents: "auto",
          }}
        >
          <span
            className="label"
            style={{ fontFamily: "var(--font-wordmark)", letterSpacing: "var(--tr-wordmark)" }}
          >
            ATRUM
          </span>
          <span className="label">Protocol · MMXXVI</span>
        </footer>
      </Act>
    </>
  );
}
