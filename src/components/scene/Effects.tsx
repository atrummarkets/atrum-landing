"use client";

import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  DepthOfField,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

import { TIER_SETTINGS, type Tier } from "@/lib/tier";

/**
 * A deliberately small postprocessing budget.
 *
 * Bloom is thresholded high so it only touches the emblem's specular hits and
 * the brightest fog — the token system caps light at under 1% of any surface,
 * and a full-screen glow would break that in one pass. Depth of field fires
 * once, at the throne, as a focus pull.
 *
 * No chromatic aberration, no lens flare, no glitch: those read as flashy,
 * which is the opposite of what this scene is going for. SSAO and SSR are
 * skipped too — on flat depth-sorted planes they cost real frame time to
 * approximate what the reflective floor already does.
 */
export function Effects({ tier, focus }: { tier: Tier; focus: number }) {
  const settings = TIER_SETTINGS[tier];
  if (!settings.postprocessing) return null;

  return (
    <EffectComposer multisampling={tier === "full" ? 4 : 0}>
      <Bloom
        intensity={0.62}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.28}
        mipmapBlur
      />
      {settings.depthOfField ? (
        <DepthOfField
          focusDistance={focus}
          focalLength={0.05}
          bokehScale={2.6}
          height={480}
        />
      ) : (
        <></>
      )}
      <Vignette offset={0.28} darkness={0.82} blendFunction={BlendFunction.NORMAL} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.16} />
    </EffectComposer>
  );
}
