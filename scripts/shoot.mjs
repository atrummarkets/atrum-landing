/**
 * Visual QA harness.
 *
 * Drives the running dev server and captures each act, so the scroll
 * choreography can be checked rather than assumed. The plan calls for QA
 * across all three render tiers on one machine, which is what the `?tier=`
 * override and this script exist for.
 *
 *   PW_CHROME=/path/to/chrome node scripts/shoot.mjs standard 6 1440 900
 *
 * Under software GL the scene needs a long warm-up, hence the generous waits.
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const EXE = process.env.PW_CHROME;
const OUT = process.env.SHOT_DIR ?? "./shots";
const BASE = process.env.BASE_URL ?? "http://localhost:3111";

const tier = process.argv[2] ?? "standard";
const shots = Number(process.argv[3] ?? 6);
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);

if (!EXE) {
  console.error("Set PW_CHROME to a Chromium binary path.");
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: EXE,
  args: [
    "--no-sandbox",
    // Software GL, so this also runs on a headless box with no real GPU.
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});

const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`CONSOLE ${m.text().slice(0, 300)}`);
});

await page.goto(`${BASE}/?tier=${tier}`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});

// Give the scene a real chance to compile shaders and decode textures.
await page.waitForTimeout(tier === "minimal" ? 3000 : 45000);

const canvas = await page.locator("canvas").count();
const scrollH = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight
);

await mkdir(OUT, { recursive: true });

for (let i = 0; i < shots; i++) {
  const t = shots === 1 ? 0 : i / (shots - 1);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    t * scrollH
  );
  await page.waitForTimeout(tier === "minimal" ? 700 : 6000);
  await page.screenshot({ path: `${OUT}/${tier}-${i}.png` });
}

console.log(
  JSON.stringify({ tier, canvas, scrollH, errors: errors.slice(0, 12) }, null, 2)
);
await browser.close();
