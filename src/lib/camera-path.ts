/**
 * The camera path — the spine of the whole experience.
 *
 * Scroll maps to a single 0→1 value; the rig interpolates position, target and
 * field of view between these marks. Because no perspective is baked into the
 * floor, the camera is free to move, rise and tilt through the space rather
 * than being pinned to one angle.
 *
 * Mobile is a separate authored path, not a scaled desktop one: a dolly tuned
 * for 16:9 foreshortens badly at 9:19, so the phone path stays closer to its
 * subjects and travels less.
 */

export type Mark = {
  /** Camera position in world space. */
  pos: [number, number, number];
  /** Point the camera looks at. */
  look: [number, number, number];
  fov: number;
};

/** Where each thing physically sits. One unit ≈ one metre. */
export const LAYOUT = {
  arch: { z: 2, y: 3.4, scale: 9.5 },
  sentinel: { z: -3, y: 2.55, scale: 5.1 },
  /**
   * The colonnade. The first four carry the four laws and are spaced so the
   * camera passes each one in turn across Act III — the copy is timed to those
   * passes, so moving a pillar moves when its law appears.
   *
   * `sprite` indexes the four pillar cutouts; the trailing pair reuse earlier
   * sprites to carry the colonnade on toward the seal, so the hall does not
   * simply stop once the laws run out.
   */
  pillars: [
    { x: -5.2, z: -6, scale: 7.4, sprite: 0, law: true },
    { x: 5.4, z: -12, scale: 7.6, sprite: 1, law: true },
    { x: -5.0, z: -18, scale: 7.2, sprite: 2, law: true },
    { x: 5.2, z: -24, scale: 7.5, sprite: 3, law: true },
    { x: -5.4, z: -31, scale: 7.0, sprite: 0, law: false },
    { x: 5.3, z: -38, scale: 7.3, sprite: 2, law: false },
  ],
  debris: [
    { x: -3.4, z: -7.5, scale: 1.5, rot: 0.3 },
    { x: 4.0, z: -13.5, scale: 1.3, rot: -0.5 },
    { x: -3.8, z: -19.0, scale: 1.6, rot: 0.9 },
    { x: 3.6, z: -25.0, scale: 1.4, rot: -0.2 },
    { x: -3.6, z: -32.5, scale: 1.4, rot: 0.6 },
  ],
  /** Act IV's subject: the engraved seal, lying flat so it reads from above. */
  seal: { z: -41, scale: 17 },
  dais: { z: -54, y: 0.9, scale: 13 },
  throne: { z: -56, y: 4.6, scale: 9.5 },
  emblem: { z: -1, y: 3.1, scale: 1.5 },
  /** Opaque (no alpha), so it has to outrun every frustum in the path. */
  backdrop: { z: -95, y: 26, scale: 150 },
} as const;

/** One mark per act. Index matches ACTS in copy.ts. */
export const DESKTOP_PATH: Mark[] = [
  // I — The Void. Wide, still, low. Nothing but ground, fog and the mark.
  { pos: [0, 1.75, 15.5], look: [0, 3.0, -2], fov: 38 },
  // II — The Sentinel. Push in until the figure holds the frame.
  { pos: [0, 1.7, 5.2], look: [0, 2.9, -3], fov: 40 },
  // III — The Colonnade. Travel between the pillars.
  { pos: [0, 1.85, -22], look: [0, 2.4, -36], fov: 48 },
  // IV — The Seal. Rise and tilt down onto the engraved floor.
  { pos: [0, 7.4, -34], look: [0, 0, -42], fov: 46 },
  // V — The Throne. Drop back to human height and look up at it.
  { pos: [0, 2.3, -45], look: [0, 4.6, -57], fov: 36 },
  // VI — The Oath. Settle. Barely moving.
  { pos: [0, 2.15, -48.5], look: [0, 4.0, -57], fov: 33 },
  // VII — The Builders. Step back and widen. The room is left in frame rather
  // than cut from, so the credit reads as part of the space, not an epilogue
  // bolted onto the end of it.
  { pos: [0, 3.6, -43], look: [0, 3.8, -57], fov: 42 },
];

export const MOBILE_PATH: Mark[] = [
  { pos: [0, 1.8, 13.0], look: [0, 3.2, -2], fov: 54 },
  { pos: [0, 1.75, 4.4], look: [0, 3.0, -3], fov: 56 },
  { pos: [0, 1.9, -21], look: [0, 2.6, -36], fov: 62 },
  { pos: [0, 6.6, -33], look: [0, 0, -42], fov: 60 },
  { pos: [0, 2.4, -44], look: [0, 4.6, -57], fov: 52 },
  { pos: [0, 2.2, -47.5], look: [0, 4.2, -57], fov: 48 },
  { pos: [0, 3.4, -42], look: [0, 3.8, -57], fov: 58 },
];

/**
 * Resolve a 0→1 scroll value to a camera mark.
 *
 * `snap` is the reduced-motion path: it cuts to the nearest mark instead of
 * easing between them, so the narrative still advances with no camera travel.
 */
export function markAt(path: Mark[], t: number, snap = false): Mark {
  const last = path.length - 1;
  const scaled = Math.min(Math.max(t, 0), 1) * last;

  if (snap) return path[Math.round(scaled)];

  const i = Math.min(Math.floor(scaled), last - 1);
  const a = path[i];
  const b = path[i + 1];
  // smoothstep between marks so arrivals and departures decelerate
  const f = scaled - i;
  const e = f * f * (3 - 2 * f);

  return {
    pos: [
      a.pos[0] + (b.pos[0] - a.pos[0]) * e,
      a.pos[1] + (b.pos[1] - a.pos[1]) * e,
      a.pos[2] + (b.pos[2] - a.pos[2]) * e,
    ],
    look: [
      a.look[0] + (b.look[0] - a.look[0]) * e,
      a.look[1] + (b.look[1] - a.look[1]) * e,
      a.look[2] + (b.look[2] - a.look[2]) * e,
    ],
    fov: a.fov + (b.fov - a.fov) * e,
  };
}

/** Progress window during which a given act's copy is on screen. */
export function actWindow(index: number, count: number): [number, number] {
  const span = 1 / (count - 1);
  return [(index - 0.42) * span, (index + 0.42) * span];
}
