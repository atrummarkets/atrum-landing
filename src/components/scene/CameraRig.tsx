"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { DESKTOP_PATH, MOBILE_PATH, markAt } from "@/lib/camera-path";
import { useScene } from "@/lib/progress";

const target = new THREE.Vector3();
const look = new THREE.Vector3();

/**
 * Drives the camera from the scroll value.
 *
 * The position is damped rather than snapped to the scroll mark, which is what
 * makes the movement read as a camera being pushed through a space instead of
 * a value being scrubbed. Pointer parallax is deliberately tiny — a held
 * breath, not a joystick — and switched off entirely for touch, where there is
 * no hover state to justify it.
 */
export function CameraRig({ mobile }: { mobile: boolean }) {
  const { progress, reducedMotion } = useScene();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const pointer = useRef({ x: 0, y: 0 });

  useFrame(({ pointer: p }, delta) => {
    const path = mobile ? MOBILE_PATH : DESKTOP_PATH;
    const mark = markAt(path, progress.get(), reducedMotion);

    // Frame-rate independent damping. Reduced motion cuts straight to the mark.
    const k = reducedMotion ? 1 : 1 - Math.pow(0.0015, delta);

    if (!mobile && !reducedMotion) {
      pointer.current.x += (p.x - pointer.current.x) * k * 0.5;
      pointer.current.y += (p.y - pointer.current.y) * k * 0.5;
    }

    target.set(
      mark.pos[0] + pointer.current.x * 0.42,
      mark.pos[1] + pointer.current.y * 0.24,
      mark.pos[2]
    );
    camera.position.lerp(target, k);

    look.set(mark.look[0], mark.look[1], mark.look[2]);
    camera.lookAt(look);

    if (Math.abs(camera.fov - mark.fov) > 0.01) {
      camera.fov += (mark.fov - camera.fov) * k;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
