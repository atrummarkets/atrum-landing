"use client";

import { useMemo } from "react";
import { useTexture, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

import { TIER_SETTINGS, type Tier } from "@/lib/tier";

/**
 * The floor — a real reflective plane, not a baked perspective plate.
 *
 * Everything standing on it casts a genuine reflection, and because no
 * vanishing point is baked into the texture the camera is free to rise, tilt
 * and travel across all six acts. This one surface does more of the "expensive"
 * work than anything else in the scene.
 *
 * NormalGL, not NormalDX: three.js follows the OpenGL green-channel
 * convention, and the DX map would invert every surface detail.
 */
export function Ground({ tier }: { tier: Tier }) {
  const settings = TIER_SETTINGS[tier];
  const [color, roughness, normal] = useTexture([
    "/textures/tiles/color.jpg",
    "/textures/tiles/roughness.jpg",
    "/textures/tiles/normal.jpg",
  ]);

  useMemo(() => {
    for (const map of [color, roughness, normal]) {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(26, 60);
      map.anisotropy = 8;
    }
    color.colorSpace = THREE.SRGBColorSpace;
  }, [color, roughness, normal]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]} receiveShadow>
      <planeGeometry args={[150, 260]} />
      {settings.reflectorRes > 0 ? (
        <MeshReflectorMaterial
          map={color}
          roughnessMap={roughness}
          normalMap={normal}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          resolution={settings.reflectorRes}
          blur={settings.reflectorBlur}
          mixBlur={1.1}
          mixStrength={2.4}
          mixContrast={1.4}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.35}
          metalness={0.32}
          roughness={0.82}
          color="#14171d"
          mirror={0}
        />
      ) : (
        <meshStandardMaterial
          map={color}
          roughnessMap={roughness}
          normalMap={normal}
          metalness={0.3}
          roughness={0.85}
          color="#14171d"
        />
      )}
    </mesh>
  );
}
