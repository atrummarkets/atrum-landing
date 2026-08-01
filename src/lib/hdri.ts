"use client";

import { useEffect, useState } from "react";

const FULL = "/hdri/night-sky.exr";
const FALLBACK = "/hdri/night-sky.hdr";

// Some browsers still don't type navigator.connection.
type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * Picks the night-sky environment map, favouring the full-quality EXR but
 * never letting it stall the boot sequence.
 *
 * The EXR is ~8MB; on a slow or congested connection it can still be in
 * flight well past the point the rest of the scene is ready, which reads as
 * the boot counter hanging. Rather than gate readiness on it, this fetches
 * the EXR itself with a deadline: if it lands in time, `<Environment>` reuses
 * it straight from the HTTP cache (no second download); if it doesn't, or
 * `navigator.connection` already flags a bad link, a ~450KB `.hdr` at a
 * fraction of the resolution stands in. It is lower fidelity but the map
 * only feeds ambient light and rough reflections, so the difference is not
 * worth a stuck loading screen.
 */
export function useHdriSource(): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection;
    const knownSlow =
      connection?.saveData === true ||
      (connection?.effectiveType !== undefined &&
        /2g/.test(connection.effectiveType));

    if (knownSlow) {
      setSrc(FALLBACK);
      return;
    }

    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 3500);

    fetch(FULL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HDRI fetch failed: ${res.status}`);
        return res.arrayBuffer();
      })
      .then(() => {
        clearTimeout(deadline);
        if (!cancelled) setSrc(FULL);
      })
      .catch(() => {
        clearTimeout(deadline);
        if (!cancelled) setSrc(FALLBACK);
      });

    return () => {
      cancelled = true;
      clearTimeout(deadline);
      controller.abort();
    };
  }, []);

  return src;
}
