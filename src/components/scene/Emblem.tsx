"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * The Atrum mark, extruded from the brand vector into real geometry.
 *
 * It gets its own environment map rather than the scene's. The sourced HDRI is
 * a starfield — reflecting it would render polished metal as near-black,
 * exactly where the mark is most scrutinised. Instead a tiny procedural studio
 * is drawn at runtime: a dark surround with a few bright bands standing in for
 * softboxes. Those bands become the highlight streaks that read as chrome.
 * An explicit material.envMap takes precedence over scene.environment, so the
 * rest of the scene keeps its night-sky ambient untouched.
 */
function useStudioEnvMap(): THREE.Texture {
  return useMemo(() => {
    const w = 512;
    const h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Surround: near-black, slightly lighter overhead so the metal has a
    // top-down gradient rather than reading as a flat cutout.
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#22262c");
    sky.addColorStop(0.45, "#0c0e12");
    sky.addColorStop(1, "#050609");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Softboxes. Monochrome by construction: no colour can leak into the scene.
    const box = (x: number, y: number, bw: number, bh: number, v: number) => {
      const g = ctx.createLinearGradient(x, y, x, y + bh);
      g.addColorStop(0, `rgba(255,255,255,0)`);
      g.addColorStop(0.5, `rgba(255,255,255,${v})`);
      g.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, bh);
    };
    box(w * 0.06, h * 0.05, w * 0.3, h * 0.34, 1.0); // key, upper left
    box(w * 0.62, h * 0.12, w * 0.24, h * 0.26, 0.42); // fill, upper right
    box(w * 0.3, h * 0.66, w * 0.44, h * 0.2, 0.16); // faint bounce off the floor

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
}

export function Emblem({
  position,
  height,
}: {
  position: [number, number, number];
  height: number;
}) {
  const group = useRef<THREE.Group>(null);
  const envMap = useStudioEnvMap();
  const data = useLoader(SVGLoader, "/brand/emblem.svg");

  const geometry = useMemo(() => {
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 26,
      bevelEnabled: true,
      // The bevel is what catches the highlight streak — without it the face
      // reads flat and the chrome stops looking like metal.
      bevelThickness: 7,
      bevelSize: 5,
      bevelSegments: 4,
      curveSegments: 12,
    });
    geo.center();
    geo.computeVertexNormals();

    // SVG user units are ~700 tall; normalise so `height` means metres.
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const scale = height / (box.max.y - box.min.y);
    geo.scale(scale, -scale, scale); // -Y: SVG's Y axis points down
    return geo;
  }, [data, height]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    // Ambient drift, deliberately below the threshold of noticed motion.
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.28;
    group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.4) * 0.06;
  });

  return (
    <group ref={group} position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          envMap={envMap}
          envMapIntensity={2.1}
          metalness={1}
          roughness={0.14}
          color="#ffffff"
        />
      </mesh>
    </group>
  );
}
