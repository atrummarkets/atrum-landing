"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * A cutout standing in the world.
 *
 * The art is pre-rendered 2D, so each piece is a textured plane placed at its
 * own depth rather than modelled geometry. `billboard` rotates the plane about
 * Y to face the camera: anything with real volume (a column, the sentinel)
 * needs it, or it goes edge-on and vanishes as the camera passes. Flat
 * architecture like the arch stays fixed, because turning it would visibly
 * swing the opening.
 */
export type PlateProps = {
  url: string;
  /** World height in metres; width follows the texture's aspect ratio. */
  height: number;
  position: [number, number, number];
  billboard?: boolean;
  rotation?: number;
  /** Lay the plate down on the ground, for anything read from above. */
  flat?: boolean;
  opacity?: number;
  /** Screen-blend for luminance plates (fog); black becomes transparent. */
  additive?: boolean;
  /** Ground contact shadow strength, 0 disables. */
  tone?: number;
};

export function Plate({
  url,
  height,
  position,
  billboard = false,
  rotation = 0,
  flat = false,
  opacity = 1,
  additive = false,
  tone = 1,
}: PlateProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useTexture(url) as THREE.Texture;

  const [w, h] = useMemo(() => {
    const image = texture.image as { width: number; height: number } | undefined;
    const aspect = image ? image.width / image.height : 1;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return [height * aspect, height];
  }, [texture, height]);

  const tint = useMemo(() => new THREE.Color(tone, tone, tone), [tone]);

  useFrame(({ camera }) => {
    if (!billboard || flat || !mesh.current) return;
    // Cylindrical billboard: yaw toward the camera, never pitch. Pitching
    // would tilt a standing column off its own base.
    const dx = camera.position.x - mesh.current.position.x;
    const dz = camera.position.z - mesh.current.position.z;
    mesh.current.rotation.y = Math.atan2(dx, dz);
  });

  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={
        flat ? [-Math.PI / 2, 0, rotation] : billboard ? undefined : [0, rotation, 0]
      }
      renderOrder={additive ? 10 : 0}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        color={additive ? undefined : tint}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthWrite={!additive}
        toneMapped={false}
        side={THREE.DoubleSide}
        alphaTest={additive ? 0 : 0.02}
      />
    </mesh>
  );
}

/**
 * Fog plate. The generated fog art is pure luminance on black, so additive
 * blending is the whole matte — no alpha channel involved. Drift is slow
 * enough to sit below noticed motion (the --d-5 token's intent, in 3D).
 */
export function FogPlate({
  url,
  height,
  position,
  drift = 0.012,
  opacity = 0.5,
  phase = 0,
}: {
  url: string;
  height: number;
  position: [number, number, number];
  drift?: number;
  opacity?: number;
  phase?: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime * drift + phase;
    group.current.position.x = position[0] + Math.sin(t) * 3.2;
    group.current.position.y = position[1] + Math.sin(t * 0.7) * 0.35;
  });

  return (
    <group ref={group} position={position}>
      <Plate url={url} height={height} position={[0, 0, 0]} additive opacity={opacity} />
    </group>
  );
}
