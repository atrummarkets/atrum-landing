"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Preload } from "@react-three/drei";
import * as THREE from "three";

import { mobileAsset } from "@/lib/assets";
import { LAYOUT } from "@/lib/camera-path";
import { useHdriSource } from "@/lib/hdri";
import { useScene } from "@/lib/progress";
import { TIER_SETTINGS } from "@/lib/tier";

import { CameraRig } from "./CameraRig";
import { Ground } from "./Ground";
import { Plate, FogPlate } from "./Plate";
import { Emblem } from "./Emblem";
import { Rain, Dust } from "./Atmosphere";
import { Effects } from "./Effects";

/**
 * Tells the boot overlay when the scene is genuinely ready, not on a timer.
 *
 * This is a sibling *inside* the Suspense boundary, so it cannot mount until
 * every texture in that boundary has resolved — which is exactly the signal we
 * want, and it arrives as an ordinary post-commit effect. Subscribing to a
 * loader-progress store instead would fire mid-render, while the very
 * components being waited on are still rendering.
 */
const DEBRIS = [
  "/scene/debris-drum.png",
  "/scene/debris-rubble.png",
  "/scene/debris-capital.png",
  "/scene/debris-base.png",
];

function ReadyGate({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

function Contents({ mobile }: { mobile: boolean }) {
  const { tier } = useScene();
  const settings = TIER_SETTINGS[tier];
  const hdriSrc = useHdriSource();

  return (
    <>
      {/* Night-sky ambient. Held low: it lights stone, it must not lift the
          void off black. The emblem overrides this with its own env map.
          The source is picked by useHdriSource: the full EXR when it can
          land quickly, a much smaller HDR fallback otherwise, so a slow
          connection can never hang the boot sequence on this one asset. */}
      {hdriSrc && (
        <Suspense fallback={null}>
          <Environment files={hdriSrc} environmentIntensity={0.3} />
        </Suspense>
      )}

      {/* One dominant key from upper left, matching how every asset was lit,
          plus a cold fill so the shadow side does not go fully dead. */}
      <directionalLight position={[-9, 14, 6]} intensity={1.5} color="#E8E4DC" />
      <directionalLight position={[7, 5, -14]} intensity={0.34} color="#5A6472" />
      <ambientLight intensity={0.13} color="#1F242D" />
      {/* The aperture: the one warm source, sitting above the throne. */}
      <pointLight
        position={[0, 9, LAYOUT.throne.z + 3]}
        intensity={62}
        distance={46}
        decay={2}
        color="#F0D9B0"
      />

      <fog attach="fog" args={["#06070A", 18, 108]} />

      <Ground tier={tier} mobile={mobile} />

      {/* Far backdrop. Its baked vignette and horizon are an asset at this
          distance, where they read as sky rather than as a constraint. It has
          no alpha, so it must stay wider than every camera's frustum or its
          own rectangle edge shows against the void. */}
      <Plate
        url={mobileAsset("/scene/backdrop.png", mobile)}
        height={LAYOUT.backdrop.scale}
        position={[0, LAYOUT.backdrop.y, LAYOUT.backdrop.z]}
        tone={0.5}
      />

      {/* Act I — the threshold the camera passes through. Fixed, never
          billboarded: yawing it would visibly swing the opening. */}
      <Plate
        url={mobileAsset("/scene/threshold-arch.png", mobile)}
        height={LAYOUT.arch.scale}
        position={[0, LAYOUT.arch.y, LAYOUT.arch.z]}
      />
      <Emblem
        position={[0, LAYOUT.emblem.y, LAYOUT.emblem.z]}
        height={LAYOUT.emblem.scale}
      />

      {/* Act II — the sentinel. */}
      <Plate
        url={mobileAsset("/scene/sentinel.png", mobile)}
        height={LAYOUT.sentinel.scale}
        position={[0, LAYOUT.sentinel.y, LAYOUT.sentinel.z]}
        billboard
      />

      {/* Act III — the colonnade, one law per pillar. */}
      {LAYOUT.pillars.map((p, i) => (
        <Plate
          key={`pillar-${i}`}
          url={mobileAsset(`/scene/pillar-${p.sprite + 1}.png`, mobile)}
          height={p.scale}
          position={[p.x, p.scale / 2, p.z]}
          billboard
          // The trailing pair sit deeper in the fog; dropping them slightly
          // keeps them reading as distance rather than as duplicates.
          tone={p.law ? 1 : 0.72}
        />
      ))}
      {LAYOUT.debris.map((d, i) => (
        <Plate
          key={`debris-${i}`}
          url={mobileAsset(DEBRIS[i % DEBRIS.length], mobile)}
          height={d.scale}
          position={[d.x, d.scale * 0.34, d.z]}
          billboard
          rotation={d.rot}
          tone={0.85}
        />
      ))}

      {/* Act IV — the seal. Laid flat on the floor, because this is the one
          moment the camera rises and looks straight down at the ground. */}
      <Plate
        url={mobileAsset("/scene/dais.png", mobile)}
        height={LAYOUT.seal.scale}
        position={[0, 0.02, LAYOUT.seal.z]}
        flat
      />

      {/* Act V — the dais, then the throne standing on it. */}
      <Plate
        url={mobileAsset("/scene/dais.png", mobile)}
        height={LAYOUT.dais.scale * 0.4}
        position={[0, LAYOUT.dais.y, LAYOUT.dais.z]}
        rotation={0}
      />
      <Plate
        url={mobileAsset("/scene/throne.png", mobile)}
        height={LAYOUT.throne.scale}
        position={[0, LAYOUT.throne.y, LAYOUT.throne.z]}
      />

      {/* Fog, interleaved between the depth layers so it separates them.
          Vertical plates break up the colonnade; the horizontal banks sit on
          the floor. */}
      {settings.fogLayers > 0 && (
        <>
          <FogPlate url={mobileAsset("/scene/fog-tendrils.png", mobile)} height={9} position={[-2, 2.4, 8]} opacity={0.2} drift={0.02} />
          <FogPlate url={mobileAsset("/scene/fog1.png", mobile)} height={14} position={[0, 1.4, -6]} opacity={0.3} phase={1.2} />
          <FogPlate url={mobileAsset("/scene/fog-column.png", mobile)} height={13} position={[-6.5, 4.2, -16]} opacity={0.16} phase={2.1} />
          <FogPlate url={mobileAsset("/scene/fog-curtain.png", mobile)} height={16} position={[7, 5, -24]} opacity={0.13} phase={0.4} />
          {settings.fogLayers > 4 && (
            <>
              <FogPlate url={mobileAsset("/scene/fog3.png", mobile)} height={18} position={[0, 1.1, -31]} opacity={0.26} phase={3.3} />
              <FogPlate url={mobileAsset("/scene/fog-column.png", mobile)} height={15} position={[5.5, 4.6, -38]} opacity={0.15} phase={4.0} />
              <FogPlate url={mobileAsset("/scene/fog2.png", mobile)} height={22} position={[0, 2.2, -50]} opacity={0.22} phase={5.1} />
            </>
          )}
        </>
      )}

      <Rain count={settings.rain} />
      <Dust count={settings.dust} />

      <CameraRig mobile={mobile} />
      <Preload all />
    </>
  );
}

export default function Scene({ mobile }: { mobile: boolean }) {
  const { tier, onReady } = useScene();
  const settings = TIER_SETTINGS[tier];

  return (
    <Canvas
      dpr={settings.dpr}
      gl={{
        antialias: tier === "full",
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [0, 1.75, 15.5], fov: 38, near: 0.1, far: 320 }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
    >
      <color attach="background" args={["#06070A"]} />
      <Suspense fallback={null}>
        <Contents mobile={mobile} />
        <ReadyGate onReady={onReady} />
      </Suspense>
      <Effects tier={tier} focus={0.02} />
    </Canvas>
  );
}
