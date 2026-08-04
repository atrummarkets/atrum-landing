"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMotionValue } from "motion/react";

import { ACTS } from "@/lib/copy";
import { SceneContext } from "@/lib/progress";
import { detectTier, prefersReducedMotion, type Tier } from "@/lib/tier";

import { Acts } from "./acts/Acts";
import { ActRail } from "./ui/ActRail";
import { AudioToggle } from "./ui/AudioToggle";
import { BootOverlay } from "./ui/BootOverlay";
import { BrandMark } from "./ui/BrandMark";
import { FlatScene } from "./FlatScene";

// ssr:false is only legal inside a Client Component in this version of Next,
// which is the whole reason Experience exists as a boundary: the HTML shell
// paints immediately while the WebGL bundle is still being fetched.
const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

export function Experience() {
  const track = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);

  const [ready, setReady] = useState(false);
  const [env, setEnv] = useState<{
    tier: Tier;
    reducedMotion: boolean;
    mobile: boolean;
  } | null>(null);

  // Capability detection can only run on the client, so it necessarily lands in
  // an effect. It is written as a single state object rather than three so the
  // page settles in one render instead of cascading through three.
  //
  // The tier is decided once and then held: re-deciding it on resize would tear
  // down and rebuild the WebGL context mid-scroll, which is far worse than
  // being slightly wrong about a device that changed orientation.
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia("(max-width: 880px)");
    const tier = detectTier();

    const sync = () =>
      setEnv({
        tier,
        reducedMotion: prefersReducedMotion(),
        mobile: widthQuery.matches,
      });

    sync();
    motionQuery.addEventListener("change", sync);
    widthQuery.addEventListener("change", sync);
    return () => {
      motionQuery.removeEventListener("change", sync);
      widthQuery.removeEventListener("change", sync);
    };
  }, []);

  const tier = env?.tier ?? null;
  const reducedMotion = env?.reducedMotion ?? false;
  const mobile = env?.mobile ?? false;

  // Scroll → progress. Lenis smooths the scroll itself and the camera rig damps
  // on top, so ScrollTrigger is left unscrubbed: adding a third smoothing pass
  // makes the camera feel laggy rather than heavy.
  useEffect(() => {
    if (!tier || !track.current) return;
    let lenis: import("lenis").default | undefined;
    let trigger: ScrollTrigger | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      if (!reducedMotion) {
        lenis = new Lenis({ duration: 1.35, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      trigger = ScrollTrigger.create({
        trigger: track.current!,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => progress.set(self.progress),
      });
    })();

    return () => {
      cancelled = true;
      trigger?.kill();
      lenis?.destroy();
    };
  }, [tier, reducedMotion, progress]);

  const runtime = useMemo(
    () => ({
      progress,
      tier: tier ?? "minimal",
      reducedMotion,
      onReady: () => setReady(true),
    }),
    [progress, tier, reducedMotion]
  );

  const webgl = tier === "full" || tier === "standard";
  // The minimal tier has no scene to report in, so nothing would ever mark it
  // ready — its images are plain DOM and are done as soon as the tier resolves.
  const entered = ready || tier === "minimal";

  // A hard ceiling on the boot screen. `useHdriSource` already gives the one
  // ~8MB asset a deadline, but every other texture (sentinel.png, throne.png,
  // the pillars) loads through the scene's Suspense boundary with no timeout
  // of its own — on a slow or congested connection any single one of them
  // can leave `onReady` waiting forever, which is exactly a stuck boot
  // counter with no way out. This does not cancel or speed up that loading;
  // it just refuses to let the overlay block entry past a bounded wait,
  // since a scene still finishing its textures in the background is a far
  // better failure mode than a page that looks permanently broken.
  useEffect(() => {
    if (!webgl) return;
    const ceiling = setTimeout(() => setReady(true), 12000);
    return () => clearTimeout(ceiling);
  }, [webgl]);

  return (
    <SceneContext.Provider value={runtime}>
      <a className="skip-link" href="#oath">
        Skip to app link
      </a>

      {tier && (webgl ? <Scene mobile={mobile} /> : <FlatScene />)}

      {/* The scroll track. It holds no content — it exists purely to give the
          fixed scene a distance to be pushed through. Phones get a shorter
          track: six acts at desktop pacing is an exhausting amount of thumb
          travel, and the mobile camera path already covers less ground. */}
      <div
        ref={track}
        style={{ height: `${ACTS.length * (mobile ? 72 : 100)}vh` }}
        aria-hidden
      />

      <Acts />
      <BrandMark ready={entered} />
      <ActRail />
      <AudioToggle ready={entered} />
      <BootOverlay ready={entered} />
    </SceneContext.Provider>
  );
}
