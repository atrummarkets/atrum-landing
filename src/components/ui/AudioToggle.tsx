"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ambient sound.
 *
 * Muted by default and never auto-started: browsers block un-gestured audio,
 * and starting a track unannounced is hostile regardless of policy. The
 * trade-off is that plenty of visitors will never hear it, so the control is
 * given real weight and a label rather than being a 16px speaker in a corner —
 * it should read as an offer, not an afterthought.
 *
 * The bed loops from /audio/bgm.mp3, routed through a GainNode so play/pause
 * gets the same smooth fade the old synthesised drone had, rather than an
 * abrupt cut.
 */
export function AudioToggle({ ready }: { ready: boolean }) {
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      ctxRef.current?.close().catch(() => {});
    },
    []
  );

  const start = () => {
    const audio = new Audio("/audio/bgm.mp3");
    audio.loop = true;
    audio.crossOrigin = "anonymous";

    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtor();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    ctx.createMediaElementSource(audio).connect(master);

    void audio.play();
    master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 3.2);

    audioRef.current = audio;
    ctxRef.current = ctx;
    gainRef.current = master;
  };

  const toggle = () => {
    if (!ctxRef.current) {
      start();
      setOn(true);
      return;
    }
    const ctx = ctxRef.current;
    const master = gainRef.current!;
    const next = !on;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(next ? 0.22 : 0, ctx.currentTime + 1.1);
    if (next) {
      void ctx.resume();
      void audioRef.current?.play();
    } else {
      window.setTimeout(() => audioRef.current?.pause(), 1150);
    }
    setOn(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      style={{
        position: "fixed",
        left: "var(--s-5)",
        bottom: "var(--s-5)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: "var(--s-2)",
        padding: "var(--s-2) var(--s-3)",
        background: "rgba(13, 15, 20, 0.55)",
        backdropFilter: "blur(10px)",
        border: "1px solid var(--rule)",
        borderRadius: "var(--r-control)",
        color: on ? "var(--text)" : "var(--text-3)",
        cursor: "pointer",
        opacity: ready ? 1 : 0,
        transition: "opacity var(--d-4) var(--e-reveal), color var(--d-2) var(--e-move)",
      }}
    >
      {/* Three bars that stand up when sound is on — legible at a glance and
          not dependent on colour alone. */}
      <span aria-hidden style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 11 }}>
        {[0.45, 1, 0.66].map((h, i) => (
          <span
            key={i}
            style={{
              width: 2,
              height: on ? `${h * 11}px` : "2px",
              background: "currentColor",
              transition: `height var(--d-3) var(--e-reveal) ${i * 60}ms`,
            }}
          />
        ))}
      </span>
      <span className="label" style={{ color: "inherit" }}>
        {on ? "Sound on" : "Sound off"}
      </span>
    </button>
  );
}
