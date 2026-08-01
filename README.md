# ATRUM — landing experience

A single continuous nighttime space rather than a stack of sections. Scroll maps
to a camera being pushed through six acts, which answer, in order: what Atrum is,
why privacy matters, how it works, why it can be trusted, and why to join.

Replaces the landing page in `../atrum-ui`. The waitlist backend is carried over
unchanged and points at the same database.

## Running

```bash
npm install
cp .env.example .env.local     # DATABASE_URL is the only required value
npm run db:migrate             # idempotent
npm run dev
```

The page renders without a database — the waitlist reads degrade to defaults and
the experience still works end to end. Only signup itself needs Postgres.

## How it fits together

| Piece | Where |
|---|---|
| Scroll → one `MotionValue`, read by both camera and copy | `src/components/Experience.tsx` |
| Camera marks per act, desktop and mobile | `src/lib/camera-path.ts` |
| Every word on the page | `src/lib/copy.ts` |
| Render tiers and their knobs | `src/lib/tier.ts` |
| 3D scene | `src/components/scene/` |
| DOM copy overlays | `src/components/acts/Acts.tsx` |
| Waitlist (ported verbatim) | `src/lib/waitlist.ts`, `src/app/api/waitlist/` |

Scroll drives a single 0→1 value. The camera reads it inside `useFrame`, the copy
derives opacity from it. They cannot drift apart because they are two views of one
number, and scrolling never triggers a React re-render.

## Tiers

Detected from WebGL2 support plus core/memory hints. Hand-held devices opt out by
default, since sustained scroll-driven WebGL is a real battery cost, and opt back
in only if they look genuinely fast.

- **full** — reflective floor at full resolution, postprocessing, depth of field
- **standard** — reduced reflection resolution, no depth of field, fewer particles
- **minimal** — no WebGL; the same six acts as flat parallax layers (`FlatScene.tsx`)

Force one with `?tier=full|standard|minimal`. Motion preference is a **separate**
axis: a fast machine with reduced-motion set still gets the full scene, just
without camera travel.

## Verifying

```bash
PW_CHROME=/path/to/chromium node scripts/shoot.mjs standard 6 1440 900
```

Captures each act to `./shots` and reports console errors. Check all three tiers
and `prefers-reduced-motion` — the narrative and every word of copy must survive
in each.

## Assets

`public/scene/` holds the prepared art. Two things about it are load-bearing:

- **Everything is graded to true greyscale.** The palette is strictly monochrome
  and the source art was lit inconsistently, so a batch levels/desaturate pass
  brings the whole cast onto one lighting model. Re-run it if art is added, or
  the new piece will read as pasted on.
- **`normal.jpg` is the NormalGL map, not NormalDX.** three.js follows the OpenGL
  green-channel convention; the DX map inverts every surface detail in a way
  that is easy to miss and miserable to debug.

The emblem is extruded at runtime from `public/brand/emblem.svg` and given its own
procedural studio environment map. It deliberately does **not** reflect the scene
HDRI: that file is a starfield, and reflecting it renders polished metal as
near-black exactly where the mark is most scrutinised.
