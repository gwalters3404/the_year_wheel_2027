"use client";

import { useCallback, useEffect, useRef } from "react";
import { DIM, MON, MSTART, NR, RINGS, md, type DayRange } from "@/lib/moments";

// Geometry in a 1030-unit square centred on the hub, matching the original wheel.
const VB = 1030, GAP = 8, R_OUT = 440, PITCH = 29, RW = 27, R_IN = R_OUT - (NR - 1) * PITCH - RW;
const C = { bg: "#242322", panel: "#2d2c2a", ink: "#f1eee6", muted: "#a39f95", faint: "#6f6c65", today: "#ffe066" };
const FONT = 'Jost, "Century Gothic", "Avenir Next", sans-serif';

export interface Cell { day: number; ring: number | null }
interface Props {
  counts: Uint16Array[];
  active: boolean[];
  sel: number | null;
  today: number | null;
  range: DayRange | null;
  zoom: number | null; // month index, or null for the whole year
  hover: Cell | null;
  onHover: (cell: Cell | null, x: number, y: number) => void;
  onSelect: (day: number) => void;
  onZoom: (month: number | null) => void;
  onKey: (ev: React.KeyboardEvent) => void;
  label: string;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function WheelCanvas(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const p = useRef(props);
  p.current = props;
  // Visible span of days [d0, d1) and how much of the wheel has swept in on load.
  const view = useRef({ d0: 0, d1: 365, reveal: 0 });
  const anim = useRef(0);
  const drag = useRef<{ on: boolean; x: number; y: number; moved: boolean }>({ on: false, x: 0, y: 0, moved: false });

  const draw = useCallback(() => {
    const cv = ref.current;
    if (!cv) return;
    const S = cv.clientWidth;
    if (!S) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (cv.width !== Math.round(S * dpr)) { cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr); }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { counts, active, sel, today, range, hover } = p.current;
    const { d0, d1, reveal } = view.current;
    const span = d1 - d0, k = (S * dpr) / VB;
    ctx.setTransform(k, 0, 0, k, (S * dpr) / 2, (S * dpr) / 2);
    ctx.clearRect(-VB / 2, -VB / 2, VB, VB);
    const A = (x: number) => ((-90 + GAP / 2 + ((x - d0) / span) * (360 - GAP)) * Math.PI) / 180;
    const sector = (a: number, b: number, r0: number, r1: number) => {
      ctx.beginPath();
      ctx.arc(0, 0, r1, A(a), A(b));
      ctx.arc(0, 0, r0, A(b), A(a), true);
      ctx.closePath();
    };
    const lo = Math.max(0, Math.floor(d0)), hi = Math.min(365, Math.ceil(d1));
    const month = span <= 62;
    const shown = d0 + span * reveal;

    for (let r = 0; r < NR; r++) {
      const r1 = R_OUT - r * PITCH, r0 = r1 - RW;
      ctx.globalAlpha = active[r] ? 0.55 : 0.25;
      ctx.fillStyle = C.panel;
      sector(d0, d1, r0, r1);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = RINGS[r].color;
      ctx.strokeStyle = C.bg;
      ctx.lineWidth = month ? 2 : 0.7;
      const row = counts[r];
      for (let d = lo; d < hi; d++) {
        if (!row[d] || d >= shown) continue;
        sector(Math.max(d, d0), Math.min(d + 1, d1), r0, r1);
        ctx.fill();
        ctx.stroke();
      }
      if (hover && hover.ring === r && hover.day >= lo && hover.day < hi) {
        ctx.fillStyle = "rgba(255,255,255,.32)";
        sector(Math.max(hover.day, d0), Math.min(hover.day + 1, d1), r0, r1);
        ctx.fill();
      }
      ctx.fillStyle = C.ink;
      ctx.font = `500 12px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(RINGS[r].letter, 0, -(r0 + r1) / 2 + 4);
    }

    // Month dividers, ticks and the labels around the rim.
    const ls = (v: string) => { try { (ctx as unknown as { letterSpacing: string }).letterSpacing = v; } catch { /* older browsers */ } };
    const radial = (text: string, x: number, r: number) => {
      const a = A(x), flip = Math.cos(a) < 0;
      ctx.save();
      ctx.rotate(flip ? a + Math.PI : a);
      ctx.textAlign = flip ? "right" : "left";
      ctx.fillText(text, flip ? -r : r, 3);
      ctx.restore();
    };
    for (let m = 0; m < 12; m++) {
      const st = MSTART[m];
      if (st >= d0 - 1e-6 && st <= d1 + 1e-6) {
        const a = A(st), c = Math.cos(a), s = Math.sin(a);
        if (st > d0 + 1e-6 && st < d1 - 1e-6) {
          ctx.strokeStyle = C.bg; ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.moveTo(R_IN * c, R_IN * s); ctx.lineTo(R_OUT * c, R_OUT * s); ctx.stroke();
        }
        ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(444 * c, 444 * s); ctx.lineTo(466 * c, 466 * s); ctx.stroke();
      }
      if (month) continue;
      const mid = st + DIM[m] / 2;
      if (mid > d0 && mid < d1) {
        const a = A(mid);
        ctx.fillStyle = C.ink; ctx.font = `400 13px ${FONT}`; ctx.textAlign = "center"; ls("2.6px");
        ctx.fillText(MON[m].toUpperCase(), 488 * Math.cos(a), 488 * Math.sin(a) + 5);
        ls("0px");
      }
      if (span > 200) {
        ctx.fillStyle = C.faint; ctx.font = `400 8.5px ${FONT}`;
        for (const day of [1, 5, 10, 15, 20, 25]) radial(String(day), st + day - 0.5, 447);
      }
    }
    if (month) {
      ctx.font = `400 15px ${FONT}`;
      for (let d = lo; d < hi; d++) {
        if (d + 0.5 < d0 || d + 0.5 > d1) continue;
        ctx.fillStyle = d === sel ? C.ink : C.muted;
        radial(String(md(d)[1]), d + 0.5, 450);
      }
    }

    const clip = (a: number, b: number): [number, number] | null => {
      const x = Math.max(a, d0), y = Math.min(b, d1);
      return y > x ? [x, y] : null;
    };
    if (range) {
      ctx.fillStyle = "rgba(36,35,34,.72)";
      for (const part of [clip(0, range[0]), clip(range[1] + 1, 365)]) if (part) { sector(part[0], part[1], R_IN - 1, R_OUT + 1); ctx.fill(); }
      const inside = clip(range[0], range[1] + 1);
      if (inside && (inside[0] > d0 + 0.01 || inside[1] < d1 - 0.01)) { sector(inside[0], inside[1], R_IN - 3, R_OUT + 3); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke(); }
    }
    if (today != null && today + 1 > d0 && today < d1) {
      const t = clip(today, today + 1)!;
      sector(t[0], t[1], R_IN - 3, R_OUT + 3);
      ctx.fillStyle = "rgba(255,224,102,.18)"; ctx.fill();
      ctx.strokeStyle = C.today; ctx.lineWidth = 1.8; ctx.stroke();
      const a = A((t[0] + t[1]) / 2);
      ctx.fillStyle = C.today;
      ctx.beginPath(); ctx.arc((R_OUT + 11) * Math.cos(a), (R_OUT + 11) * Math.sin(a), 4.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc((R_IN - 10) * Math.cos(a), (R_IN - 10) * Math.sin(a), 3, 0, 7); ctx.fill();
    }
    if (hover && hover.day !== sel) {
      const h = clip(hover.day, hover.day + 1);
      if (h) { sector(h[0], h[1], R_IN - 3, R_OUT + 3); ctx.fillStyle = "rgba(241,238,230,.1)"; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9; ctx.stroke(); }
    }
    if (sel != null && !range) {
      const s = clip(sel, sel + 1);
      if (s) { sector(s[0], s[1], R_IN - 3, R_OUT + 3); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; ctx.stroke(); }
    }
  }, []);

  // Animate the visible span whenever the zoom target changes, and sweep the wheel in on first load.
  useEffect(() => {
    const target = props.zoom == null ? [0, 365] : [MSTART[props.zoom], MSTART[props.zoom] + DIM[props.zoom]];
    const from = { ...view.current };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const needsReveal = from.reveal < 1;
    if (still || (from.d0 === target[0] && from.d1 === target[1] && !needsReveal)) {
      view.current = { d0: target[0], d1: target[1], reveal: 1 };
      draw();
      return;
    }
    const t0 = performance.now(), dur = needsReveal ? 1100 : 650;
    cancelAnimationFrame(anim.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t);
      view.current = { d0: from.d0 + (target[0] - from.d0) * e, d1: from.d1 + (target[1] - from.d1) * e, reveal: needsReveal ? from.reveal + (1 - from.reveal) * e : 1 };
      draw();
      if (t < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim.current);
  }, [props.zoom, draw]);

  useEffect(() => { draw(); });
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(cv);
    document.fonts?.ready.then(() => draw());
    return () => ro.disconnect();
  }, [draw]);

  // Translate a pointer position into a day, a ring or a month label.
  const hit = (ev: React.PointerEvent): { kind: "day"; cell: Cell } | { kind: "month"; m: number } | null => {
    const cv = ref.current!;
    const box = cv.getBoundingClientRect();
    const x = ((ev.clientX - box.left) / box.width - 0.5) * VB, y = ((ev.clientY - box.top) / box.height - 0.5) * VB;
    const r = Math.hypot(x, y);
    if (r < R_IN - 3 || r > VB / 2) return null;
    const { d0, d1 } = view.current;
    const rel = ((((Math.atan2(y, x) * 180) / Math.PI + 90 - GAP / 2) % 360) + 360) % 360;
    if (rel > 360 - GAP) return null;
    const day = Math.max(0, Math.min(364, Math.floor(d0 + (rel / (360 - GAP)) * (d1 - d0))));
    if (r > R_OUT + 28 && d1 - d0 > 62) return { kind: "month", m: md(day)[0] };
    const idx = Math.floor((R_OUT - r) / PITCH);
    const ring = r <= R_OUT && idx >= 0 && idx < NR && R_OUT - r - idx * PITCH <= RW ? idx : null;
    return { kind: "day", cell: { day, ring } };
  };

  return (
    <canvas
      ref={ref}
      className="wheel"
      tabIndex={0}
      role="img"
      aria-label={props.label}
      onKeyDown={props.onKey}
      onPointerMove={(ev) => {
        const h = hit(ev), dg = drag.current;
        ev.currentTarget.style.cursor = h ? "pointer" : "default";
        if (dg.on && Math.hypot(ev.clientX - dg.x, ev.clientY - dg.y) > 4) dg.moved = true;
        if (dg.on && dg.moved && ev.pointerType !== "touch" && h?.kind === "day") p.current.onSelect(h.cell.day);
        p.current.onHover(h?.kind === "day" && ev.pointerType !== "touch" ? h.cell : null, ev.clientX, ev.clientY);
      }}
      onPointerDown={(ev) => {
        drag.current = { on: true, x: ev.clientX, y: ev.clientY, moved: false };
        if (ev.pointerType !== "touch") ev.currentTarget.setPointerCapture(ev.pointerId);
      }}
      onPointerUp={(ev) => {
        const dg = drag.current;
        drag.current = { ...dg, on: false };
        if (dg.moved) return;
        const h = hit(ev);
        if (h?.kind === "month") p.current.onZoom(h.m);
        else if (h?.kind === "day") p.current.onSelect(h.cell.day);
      }}
      onPointerCancel={() => { drag.current.on = false; }}
      onPointerLeave={() => p.current.onHover(null, 0, 0)}
    />
  );
}
