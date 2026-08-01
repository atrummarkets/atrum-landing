"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "motion/react";

import type { Tier } from "./tier";

/**
 * One scroll value drives everything.
 *
 * GSAP writes it, the camera rig reads it inside useFrame, and the DOM acts
 * derive opacity from it. Holding it in a MotionValue rather than React state
 * means scrolling never triggers a re-render — the 3D layer and the copy stay
 * frame-locked because they are reading the same number, not two timelines
 * that happen to be configured alike.
 */
export type SceneRuntime = {
  progress: MotionValue<number>;
  tier: Tier;
  reducedMotion: boolean;
  /** Set once the scene's textures are decoded and the first frame is drawn. */
  onReady: () => void;
};

export const SceneContext = createContext<SceneRuntime | null>(null);

export function useScene(): SceneRuntime {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used inside <Experience>");
  return ctx;
}
