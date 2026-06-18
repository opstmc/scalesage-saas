"use client";

import { useEffect, useRef } from "react";

/**
 * The locked visual signature: flowing teal/cyan data streams on dark navy —
 * a river/current that converges, branches, and drifts. One 2D canvas, one rAF
 * loop, DPR-capped, gentle parallax on scroll, pauses offscreen/hidden, static
 * frame for prefers-reduced-motion. Alive but controlled — never noisy.
 */

const TEAL: [number, number, number] = [61, 217, 208]; // --accent-primary
const GLOW: [number, number, number] = [94, 239, 230]; // --accent-glow

interface Stream {
  base: number; // baseline y as fraction of height
  amp: number; // undulation amplitude (fraction of height)
  freq: number; // spatial frequency
  speed: number; // horizontal drift
  phase: number;
  width: number;
  alpha: number;
  parallax: number;
  packets: number[]; // packet positions 0..1
  packetSpeed: number;
}

const STREAMS: Stream[] = [
  { base: 0.16, amp: 0.05, freq: 1.1, speed: 0.05, phase: 0.0, width: 1.2, alpha: 0.18, parallax: 0.04, packets: [0.15, 0.7], packetSpeed: 0.055 },
  { base: 0.3, amp: 0.07, freq: 0.8, speed: 0.07, phase: 1.3, width: 1.6, alpha: 0.3, parallax: 0.07, packets: [0.4, 0.85], packetSpeed: 0.07 },
  { base: 0.42, amp: 0.06, freq: 1.4, speed: 0.045, phase: 2.4, width: 1.3, alpha: 0.22, parallax: 0.05, packets: [0.25], packetSpeed: 0.05 },
  { base: 0.54, amp: 0.09, freq: 0.7, speed: 0.085, phase: 0.7, width: 2.0, alpha: 0.36, parallax: 0.1, packets: [0.1, 0.55, 0.9], packetSpeed: 0.085 },
  { base: 0.66, amp: 0.055, freq: 1.2, speed: 0.06, phase: 3.1, width: 1.4, alpha: 0.24, parallax: 0.06, packets: [0.65], packetSpeed: 0.06 },
  { base: 0.78, amp: 0.08, freq: 0.9, speed: 0.05, phase: 1.9, width: 1.5, alpha: 0.2, parallax: 0.045, packets: [0.35, 0.8], packetSpeed: 0.05 },
  { base: 0.9, amp: 0.045, freq: 1.5, speed: 0.04, phase: 2.7, width: 1.1, alpha: 0.14, parallax: 0.03, packets: [0.5], packetSpeed: 0.045 },
];

export default function DataStreamField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1;
    let W = 1;
    let H = 1;
    let running = false;
    let raf = 0;
    let visible: boolean | undefined;
    let scrollY = 0;
    const streams = STREAMS.map((s) => ({ ...s, packets: [...s.packets] }));

    const resize = () => {
      const r = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = H;
    };

    const yAt = (s: Stream, xFrac: number, t: number, parY: number) => {
      const u = xFrac * Math.PI * 2 * s.freq;
      const wobble = Math.sin(u + t * s.speed * 6 + s.phase) * s.amp + Math.sin(u * 0.5 - t * s.speed * 3) * s.amp * 0.4;
      return (s.base + wobble) * H + parY;
    };

    const draw = (now: number) => {
      const t = now * 0.001;
      ctx.clearRect(0, 0, W, H);
      const steps = Math.max(40, Math.round(W / dpr / 9));

      for (let si = 0; si < streams.length; si++) {
        const s = streams[si];
        const parY = -scrollY * s.parallax * dpr;

        // the stream line, fading in/out across its width like a current
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},0)`);
        grad.addColorStop(0.18, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},${s.alpha})`);
        grad.addColorStop(0.6, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},${s.alpha})`);
        grad.addColorStop(1, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width * dpr;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const xf = i / steps;
          const x = xf * W;
          const y = yAt(s, xf, t, parY);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // traveling data packets — bright glints riding the current
        ctx.globalCompositeOperation = "lighter";
        for (let p = 0; p < s.packets.length; p++) {
          s.packets[p] = (s.packets[p] + (reduced ? 0 : s.packetSpeed * 0.016)) % 1;
          const xf = s.packets[p];
          const x = xf * W;
          const y = yAt(s, xf, t, parY);
          const edge = Math.sin(xf * Math.PI); // dimmer near edges
          const rad = 2.4 * dpr;
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 6);
          g.addColorStop(0, `rgba(${GLOW[0]},${GLOW[1]},${GLOW[2]},${0.9 * edge})`);
          g.addColorStop(0.4, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},${0.35 * edge})`);
          g.addColorStop(1, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, rad * 6, 0, 6.2832);
          ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${0.85 * edge})`;
          ctx.beginPath();
          ctx.arc(x, y, rad * 0.8, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };

    const onResize = () => resize();
    const onScroll = () => {
      scrollY = window.scrollY || 0;
    };
    const onVis = () => {
      if (document.hidden) stop();
      else if (visible !== false) start();
    };

    resize();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (ents) => {
          ents.forEach((en) => {
            visible = en.isIntersecting;
            if (visible) start();
            else stop();
          });
        },
        { threshold: 0.02 }
      );
      io.observe(parent);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", onVis);

    if (reduced) draw(performance.now());
    else start();

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      if (io) io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-field" aria-hidden="true" />;
}
