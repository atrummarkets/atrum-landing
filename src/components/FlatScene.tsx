"use client";

import { motion, useTransform } from "motion/react";

import { useScene } from "@/lib/progress";

/**
 * The minimal tier — no WebGL at all.
 *
 * Same six acts, same copy, same scroll value; the depth comes from a handful
 * of fixed layers moving at different rates instead of a camera. This is what
 * a mid-range phone and anything without WebGL2 actually gets, so it has to be
 * a real version of the experience rather than a static apology.
 *
 * It is also the honest fallback for the "held shot" idea: the scene reveals
 * itself in place rather than being travelled through.
 */
export function FlatScene() {
  const { progress, reducedMotion } = useScene();

  // Each layer moves a different amount across the whole scroll — the further
  // away, the less it travels.
  const still = reducedMotion;
  const sky = useTransform(progress, [0, 1], still ? ["0%", "0%"] : ["0%", "-6%"]);
  const arch = useTransform(progress, [0, 1], still ? ["0%", "0%"] : ["0%", "-22%"]);
  const figure = useTransform(progress, [0, 1], still ? ["0%", "0%"] : ["0%", "-38%"]);
  const near = useTransform(progress, [0, 1], still ? ["0%", "0%"] : ["0%", "-60%"]);
  const scale = useTransform(progress, [0, 1], reducedMotion ? [1, 1] : [1.02, 1.16]);
  const dim = useTransform(progress, [0, 0.45, 1], [1, 0.72, 0.4]);

  const layer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center bottom",
    willChange: "transform",
  };

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <motion.div
        style={{
          ...layer,
          y: sky,
          scale,
          backgroundImage: "url(/scene/backdrop.png)",
          backgroundSize: "cover",
          opacity: 0.75,
        }}
      />
      <motion.div
        style={{
          ...layer,
          y: arch,
          backgroundImage: "url(/scene/threshold-arch.png)",
          backgroundSize: "contain",
          opacity: 0.6,
        }}
      />
      <motion.div
        style={{
          ...layer,
          y: figure,
          backgroundImage: "url(/scene/sentinel.png)",
          backgroundSize: "auto 68%",
          opacity: 0.9,
        }}
      />
      <motion.div
        style={{
          ...layer,
          y: near,
          backgroundImage: "url(/scene/fog1.png)",
          backgroundSize: "cover",
          mixBlendMode: "screen",
          opacity: 0.28,
        }}
      />
      {/* Hold the copy legible over the art as the scene darkens. */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(6,7,10,0.35), rgba(6,7,10,0.92) 78%)",
          opacity: dim,
        }}
      />
    </div>
  );
}
