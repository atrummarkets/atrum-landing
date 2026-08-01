"use client";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Wired up by AudioToggle once the ambient bed is unlocked by a user gesture. */
export function setAudioBus(nextCtx: AudioContext | null, nextMaster: GainNode | null) {
  ctx = nextCtx;
  master = nextMaster;
}

/**
 * A soft, slow-swelling whoosh for reveal moments (pillars, mechanism
 * steps) — filtered noise with a bandpass sweep and a gentle attack, never
 * a sharp transient. Routed through the same master gain as the ambient
 * bed, so it silently no-ops until sound has been turned on, and goes
 * quiet the instant it's turned off.
 */
export function playWhoosh() {
  if (!ctx || !master) return;

  const duration = 0.9;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(200, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(1400, ctx.currentTime + duration * 0.55);
  filter.frequency.linearRampToValueAtTime(160, ctx.currentTime + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + duration * 0.35);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  noise.connect(filter).connect(gain).connect(master);
  noise.start();
  noise.stop(ctx.currentTime + duration + 0.05);
}
