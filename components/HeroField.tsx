"use client";

import { useEffect, useRef } from "react";

/**
 * The one striking generated moment: a Higgs-style field on a single 2D canvas.
 * Fine lattice of points with slow undulation + expanding wave "excitations"
 * that bloom every few seconds and follow the cursor. One rAF loop, DPR capped
 * at 2, pauses when offscreen/hidden, static frame for prefers-reduced-motion.
 * Ported from initField()/fDraw() in the prototype.
 */

const ACCENT: [number, number, number] = [26, 55, 224]; // #1a37e0
const INTENSITY = 1.4;

interface Ripple {
  x: number;
  y: number;
  t0: number;
  s: number;
  life: number;
}

export default function HeroField() {
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
    let gap = 30;
    let pts: [number, number][] = [];
    let ripples: Ripple[] = [];
    let lastAuto = 0;
    let lastPtr = 0;
    let running = false;
    let raf = 0;
    let visible: boolean | undefined;

    const resize = () => {
      const r = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = H;
      const small = r.width < 720;
      gap = (small ? 34 : 30) * dpr;
      pts = [];
      for (let y = gap * 0.5; y < H + gap; y += gap)
        for (let x = gap * 0.5; x < W + gap; x += gap) pts.push([x, y]);
    };

    const spawn = (x: number, y: number, s: number, life: number) => {
      if (ripples.length > 7) ripples.shift();
      ripples.push({ x: x * dpr, y: y * dpr, t0: performance.now(), s, life });
    };

    const draw = (now: number) => {
      const t = now * 0.001;
      const A = ACCENT;
      const k = INTENSITY;
      ctx.clearRect(0, 0, W, H);
      ripples = ripples.filter((rp) => (now - rp.t0) / 1000 < rp.life);
      const rips = ripples.map((rp) => {
        const age = (now - rp.t0) / 1000;
        return { x: rp.x, y: rp.y, R: age * 200 * dpr, fade: 1 - age / rp.life, s: rp.s };
      });
      const rw = 26 * dpr;
      const rw2 = 2 * rw * rw;
      for (let i = 0; i < pts.length; i++) {
        const px = pts[i][0];
        const py = pts[i][1];
        const base =
          (Math.sin(px * 0.0042 + t * 0.7) +
            Math.sin(py * 0.0052 - t * 0.55) +
            Math.sin((px + py) * 0.003 + t * 0.9)) /
          3;
        let R = 0;
        for (let j = 0; j < rips.length; j++) {
          const dx = px - rips[j].x;
          const dy = py - rips[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const dd = d - rips[j].R;
          R += rips[j].s * rips[j].fade * Math.exp(-(dd * dd) / rw2);
        }
        let b = 0.16 + (base * 0.5 + 0.5) * 0.34 * k + R * 0.95 * k;
        if (b < 0) b = 0;
        if (b > 1) b = 1;
        const rad = (0.7 + b * 2.6) * dpr;
        let cr: number;
        let cg: number;
        let cb: number;
        if (b < 0.55) {
          const u = b / 0.55;
          cr = 40 + (A[0] - 40) * u;
          cg = 44 + (A[1] - 44) * u;
          cb = 58 + (A[2] - 58) * u;
        } else {
          const u = (b - 0.55) / 0.45;
          cr = A[0] + (206 - A[0]) * u;
          cg = A[1] + (214 - A[1]) * u;
          cb = A[2] + (255 - A[2]) * u;
        }
        ctx.fillStyle =
          "rgba(" + (cr | 0) + "," + (cg | 0) + "," + (cb | 0) + "," + (0.22 + b * 0.78).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, 6.2832);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      if (now - lastAuto > 2600) {
        lastAuto = now;
        spawn((Math.random() * W) / dpr, (Math.random() * H) / dpr, 0.9, 3.2);
      }
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

    const onPointer = (e: PointerEvent) => {
      if (reduced) return;
      const now = performance.now();
      if (now - lastPtr < 70) return;
      lastPtr = now;
      const r = canvas.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top, 0.5, 1.3);
    };

    const onResize = () => resize();
    const onVis = () => {
      if (document.hidden) stop();
      else if (visible !== false) start();
    };

    resize();
    window.addEventListener("resize", onResize, { passive: true });
    canvas.addEventListener("pointermove", onPointer, { passive: true });

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

    // seed an initial excitation near the headline
    spawn((W * 0.62) / dpr, (H * 0.42) / dpr, 1.0, 3.4);
    if (reduced) draw(performance.now());
    else start();

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      if (io) io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-field" aria-hidden="true" />;
}
