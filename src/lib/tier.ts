/**
 * Rendering tiers.
 *
 * `minimal` renders no WebGL at all — the same six acts are laid out as flat
 * parallax layers in the DOM, so the narrative and every word of copy survive
 * on hardware that cannot afford a scroll-driven 3D scene.
 *
 * Motion preference is a *separate* axis from tier: a fast machine with
 * reduced-motion set should still get the full scene, just without camera
 * travel. Conflating the two throws away visual quality for no accessibility
 * gain.
 */

export type Tier = "full" | "standard" | "minimal";

type NavigatorWithHints = Navigator & { deviceMemory?: number };

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

function override(): Tier | null {
  const value = new URLSearchParams(window.location.search).get("tier");
  return value === "full" || value === "standard" || value === "minimal" ? value : null;
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "minimal";

  // `?tier=` forces a tier. QA needs to check all three on one machine, and
  // heuristics alone can't be trusted to reproduce a given device's path.
  const forced = override();
  if (forced) return forced;

  if (!hasWebGL2()) return "minimal";

  const nav = navigator as NavigatorWithHints;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.matchMedia("(max-width: 880px)").matches;

  // Sustained WebGL on a phone is a real battery and thermal cost, so hand-held
  // devices opt out by default and only opt back in if they look genuinely fast.
  if (coarse && small) {
    return cores >= 8 && memory >= 6 ? "standard" : "minimal";
  }

  if (cores <= 4 || memory <= 4) return "standard";
  return "full";
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Per-tier render knobs, kept in one place so the scene never branches ad hoc. */
export const TIER_SETTINGS = {
  full: {
    dpr: [1, 1.75] as [number, number],
    reflectorRes: 1024,
    reflectorBlur: [420, 110] as [number, number],
    postprocessing: true,
    depthOfField: true,
    dust: 900,
    rain: 1400,
    fogLayers: 7,
  },
  standard: {
    dpr: [1, 1.25] as [number, number],
    reflectorRes: 256,
    reflectorBlur: [180, 60] as [number, number],
    postprocessing: true,
    depthOfField: false,
    dust: 350,
    rain: 500,
    fogLayers: 4,
  },
  minimal: {
    dpr: [1, 1] as [number, number],
    reflectorRes: 0,
    reflectorBlur: [0, 0] as [number, number],
    postprocessing: false,
    depthOfField: false,
    dust: 0,
    rain: 0,
    fogLayers: 0,
  },
} as const;
