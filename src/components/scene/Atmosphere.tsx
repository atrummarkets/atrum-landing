"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Rain and dust — both procedural, because a PNG sprite sheet would cost
 * bandwidth to look worse and could not respond to depth.
 *
 * Rain is drawn as GL_LINES rather than sprites: a falling streak is literally
 * a line segment, and one draw call covers the whole field. Dust is points
 * that barely move, sized by distance so motes near the camera read larger.
 */

const FIELD = { x: 70, y: 34, z: 150, zCenter: -40 };

export function Rain({ count }: { count: number }) {
  const ref = useRef<THREE.LineSegments>(null);
  const speeds = useRef<Float32Array>(new Float32Array(0));

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * FIELD.x;
      const y = Math.random() * FIELD.y;
      const z = FIELD.zCenter + (Math.random() - 0.5) * FIELD.z;
      const len = 0.5 + Math.random() * 1.1;
      positions.set([x, y, z, x, y - len, z], i * 6);
      spd[i] = 9 + Math.random() * 13;
    }
    speeds.current = spd;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const step = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      const drop = speeds.current[i] * step;
      arr[o + 1] -= drop;
      arr[o + 4] -= drop;
      if (arr[o + 4] < -1) {
        const len = arr[o + 1] - arr[o + 4];
        arr[o + 1] = FIELD.y;
        arr[o + 4] = FIELD.y - len;
      }
    }
    attr.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color="#8B94A3"
        transparent
        opacity={0.16}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

export function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD.x;
      positions[i * 3 + 1] = Math.random() * 14;
      positions[i * 3 + 2] = FIELD.zCenter + (Math.random() - 0.5) * FIELD.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // A slow rotation of the whole field reads as motes suspended in a draught
    // without touching per-particle state every frame.
    ref.current.rotation.y = clock.elapsedTime * 0.006;
  });

  if (count === 0) return null;

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color="#B9C0CA"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.32}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
