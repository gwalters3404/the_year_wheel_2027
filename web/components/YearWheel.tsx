"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WheelCanvas, { type Cell } from "./WheelCanvas";
import {
  DIM, MON, MONL, MSTART, NR, RINGS, WD, buildIndex, dayTitle, headlines, label, md, mmdd, mom, parseRows, parseWhen,
  rangeLabel, rangeText, todayDoy, wday, type DayRange, type Moment, type Raw,
} from "@/lib/moments";

const ALL_RINGS = RINGS.map((_, k) => k);
const CAP = 30;
const SAVE_KEY = "year-wheel-saved";
const byStart = (a: Moment, b: Moment) => (a.s ?? 999) - (b.s ?? 999);

export default function YearWheel({ initialDay }: { initialDay: number | null }) {
  const [items, setItems] = useState<Moment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [today, setToday] = useState<number | null>(null);
  const [sel, setSel] = useState(initialDay ?? 0);
  const [rings, setRings] = useState<Set<number>>(() => new Set(ALL_RINGS));
  const [q, setQ] = useState("");
  const [qText, setQText] = useState("");
  const [when, setWhen] = useState("");
  const [hint, setHint] = useState("");
  const [range, setRange] = useState<DayRange | null>(null);
  const [mode, setMode] = useState<"day" | "all" | "saved">("day");
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [zoom, setZoom] = useState<number | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [saved, setSaved] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = todayDoy();
    setToday(t);
    if (initialDay == null) setSel(t);
    try { const v = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]"); if (Array.isArray(v)) setSaved(v.filter((n) => Number.isInteger(n))); } catch { /* storage unavailable */ }
    fetch("/data.json").then((r) => r.json()).then((rows: Raw[]) => setItems(parseRows(rows))).catch(() => setFailed(true));
  }, [initialDay]);

  const pass = useCallback((it: Moment) => rings.has(it.r) && (!q || it.hay.includes(q)), [rings, q]);
  const idx = useMemo(() => (items ? buildIndex(items, pass) : null), [items, pass]);
  const counts = useMemo(() => {
    const c = RINGS.map(() => new Uint16Array(365));
    if (idx) for (let d = 0; d < 365; d++) for (const it of idx.byDay[d]) c[it.r][d]++;
    return c;
  }, [idx]);
  const totals = useMemo(() => {
    const c = new Array(NR).fill(0);
    if (items) for (const it of items) c[it.r]++;
    return c as number[];
  }, [items]);
  const active = useMemo(() => ALL_RINGS.map((k) => rings.has(k)), [rings]);
  const savedSet = useMemo(() => new Set(saved), [saved]);

  // Keep the address bar on the selected day so any view can be shared.
  useEffect(() => {
    if (!items) return;
    const t = setTimeout(() => { try { window.history.replaceState(null, "", "/day/" + mmdd(sel)); } catch { /* ignore */ } }, 250);
    return () => clearTimeout(t);
  }, [sel, items]);
  useEffect(() => { if (zoom != null && !range && md(sel)[0] !== zoom) setZoom(md(sel)[0]); }, [sel, zoom, range]);
  useEffect(() => {
    const t = setTimeout(() => { setQ(qText.trim().toLowerCase()); setOpen(new Set()); }, 150);
    return () => clearTimeout(t);
  }, [qText]);

  const persist = (next: number[]) => { setSaved(next); try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch { /* ignore */ } };
  const toggleSave = (id: number) => persist(savedSet.has(id) ? saved.filter((x) => x !== id) : [...saved, id]);

  const reset = () => { setQText(""); setQ(""); setRange(null); setMode("day"); setOpen(new Set()); setWhen(""); setHint(""); };
  const select = useCallback((d: number) => { setSel(Math.max(0, Math.min(364, d))); setRange(null); setMode("day"); setWhen(""); setHint(""); }, []);
  const go = (d: number) => { reset(); select(d); };

  const applyWhen = (v: string, final: boolean) => {
    const r = parseWhen(v);
    setOpen(new Set());
    if (r === false) { setHint(final || v.trim().length > 3 ? "Try a month, a date like Mar 3 or 3/3, or a range like Jun 1 to Jun 14." : ""); return; }
    setHint("");
    if (!r) { setRange(null); return; }
    setMode("day");
    if (r[0] === r[1]) { setRange(null); setSel(r[0]); return; }
    setRange(r); setSel(r[0]);
    const [m] = md(r[0]);
    setZoom(r[0] === MSTART[m] && r[1] === MSTART[m] + DIM[m] - 1 ? m : null);
  };
  useEffect(() => {
    if (!when) return;
    const t = setTimeout(() => applyWhen(when, false), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when]);

  const step = (dir: number) => {
    if (range) {
      const [a, b] = range, [m] = md(a), whole = a === MSTART[m] && b === a + DIM[m] - 1;
      let next: DayRange;
      if (whole) { const n = (m + dir + 12) % 12; next = [MSTART[n], MSTART[n] + DIM[n] - 1]; if (zoom != null) setZoom(n); }
      else { const len = b - a + 1, na = Math.max(0, Math.min(365 - len, a + dir * len)); next = [na, na + len - 1]; }
      setRange(next); setSel(next[0]); setOpen(new Set()); setWhen(rangeLabel(next));
    } else select(sel + dir);
  };
  const onKey = (ev: React.KeyboardEvent) => {
    const d = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[ev.key];
    if (d) { ev.preventDefault(); go(sel + d); }
    if (ev.key === "Escape" && zoom != null) setZoom(null);
  };
  const onHover = useCallback((cell: Cell | null, x: number, y: number) => {
    setHover((h) => (h?.day === cell?.day && h?.ring === cell?.ring ? h : cell));
    if (cell && wrap.current) { const b = wrap.current.getBoundingClientRect(); setTip({ x: x - b.left, y: y - b.top }); }
  }, []);

  const zoomTo = (m: number | null) => { setZoom(m); if (m != null && !range && md(sel)[0] !== m) select(MSTART[m]); };
  const isolate = (k: number) => { const only = rings.size === 1 && rings.has(k); setRings(new Set(only ? ALL_RINGS : [k])); setOpen(new Set()); };
  const toggleRing = (k: number) => { const n = new Set(rings); if (n.has(k)) n.delete(k); else n.add(k); setRings(n); };

  if (failed) return <main className="wrap"><h1>The Year <b>Wheel</b></h1><p className="sub">The data did not load. Reload the page to try again.</p></main>;
  if (!items || !idx) return <main className="wrap"><h1>The Year <b>Wheel</b></h1><p className="sub">Loading 12,669 moments…</p></main>;

  // ----- what the list shows -----
  let title = "", sub = "", list: Moment[] = [], showDate = true, capped = true, empty = "";
  const savedItems = saved.map((id) => items[id]).filter(Boolean).sort(byStart);
  if (mode === "saved") {
    title = "My list"; list = savedItems; sub = mom(list.length) + " saved on this device";
    empty = "Nothing saved yet. Press the star next to any moment to keep it here.";
  } else if (mode === "all") {
    list = items.filter(pass).sort(byStart); sub = mom(list.length) + " · all of 2027" + (q ? ` · matching “${q}”` : "");
    empty = "Nothing to show. Turn a color back on or clear the search.";
  } else if (range) {
    const [a, b] = range;
    list = items.filter((it) => it.s != null && pass(it) && it.s <= b && (it.e ?? it.s) >= a).sort(byStart);
    title = rangeLabel(range); sub = `${mom(list.length)} · ${b - a + 1} days` + (q ? ` · matching “${q}”` : "");
    empty = "Nothing matches in this range.";
  } else if (q) {
    list = items.filter(pass).sort(byStart); title = "Search results";
    sub = `${list.length.toLocaleString("en-US")} ${list.length === 1 ? "match" : "matches"} for “${q}”`; empty = "No matches. Try a shorter word.";
  } else {
    list = idx.byDay[sel]; title = dayTitle(sel); sub = `${mom(list.length)} · day ${sel + 1} of 365`; showDate = false; capped = false;
    empty = "Nothing matches the current filters on this day.";
  }
  const dayMode = mode === "day" && !range && !q;
  const running = dayMode ? idx.running[sel] : [];

  const entry = (it: Moment, n: number, dates: boolean) => {
    const bits: string[] = [];
    if (dates) bits.push(rangeText(it) || "No date yet");
    else if (it.e != null && it.e !== it.s) bits.push(rangeText(it));
    if (it.l) bits.push(it.l);
    if (it.c) bits.push(it.c);
    if (it.y && it.t === "b") bits.push("turns " + it.y);
    if (it.y && it.t === "d") bits.push(it.y + " yrs ago");
    const extra = ((it.st === "Estimated" || it.st === "Not held in 2027") && it.x) || (it.t === "h" && it.x && it.x !== "Fixed date") ? it.x : "";
    const cls = it.st === "Confirmed" || it.st === "Listed" ? "ok" : it.st === "Estimated" || it.st === "TBD" ? "warn" : "";
    const on = savedSet.has(it.id);
    return (
      <li key={it.id + "-" + n} style={{ ["--c" as string]: RINGS[it.r].color }}>
        <span className="num">{n}</span>
        <div>
          <span className="nm">{it.u ? <a href={it.u} target="_blank" rel="noopener noreferrer">{it.n}</a> : it.n}</span>
          {it.st && <span className={"st " + cls} title={it.x}>{it.st}</span>}
          {(bits.length > 0 || (dates && it.s != null)) && (
            <div className="meta">
              {bits.join(" · ")}
              {dates && it.s != null && <> · <button className="link" onClick={() => go(it.s!)}>open {label(it.s)}</button></>}
            </div>
          )}
          {extra && <div className="meta">{extra}</div>}
        </div>
        <button className={"star" + (on ? " on" : "")} aria-pressed={on} aria-label={(on ? "Remove from my list: " : "Save to my list: ") + it.n} onClick={() => toggleSave(it.id)}>{on ? "★" : "☆"}</button>
      </li>
    );
  };
  let n = 0;
  const groups = RINGS.map((ring, k) => {
    const subList = list.filter((x) => x.r === k);
    if (!subList.length) return null;
    const cut = capped && subList.length > CAP && !open.has(k);
    return (
      <div className="grp" key={k} style={{ ["--c" as string]: ring.color }}>
        <h3><i />{ring.letter} · {ring.name} <span>{subList.length.toLocaleString("en-US")}</span></h3>
        <ol className="items">{(cut ? subList.slice(0, CAP) : subList).map((x) => entry(x, ++n, showDate))}</ol>
        {cut && <button className="more" onClick={() => setOpen(new Set(open).add(k))}>Show all {subList.length.toLocaleString("en-US")}</button>}
      </div>
    );
  });

  // ----- hub, tooltip and "coming up" -----
  const hubDay = hover ? hover.day : range || mode !== "day" ? null : sel;
  const hubList = hubDay != null ? idx.byDay[hubDay] : [];
  const hubTop = headlines(hubList).map((s) => (s.length > 28 ? s.slice(0, 27) + "…" : s));
  const tipList = hover && hover.ring != null ? idx.byDay[hover.day].filter((x) => x.r === hover.ring) : [];
  const upcoming = items
    .filter((it) => it.s != null && it.s > sel && rings.has(it.r) && (it.t === "h" || (it.t === "e" && (it.e == null || it.e - it.s < 10))))
    .sort(byStart).slice(0, 4);
  const icsHref = "/api/ics?ids=" + savedItems.filter((x) => x.rs).map((x) => x.id).join(",");
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.origin + "/day/" + mmdd(sel)); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };

  return (
    <main className="wrap">
      <header>
        <div>
          <h1>The Year <b>Wheel</b></h1>
          <p className="sub">Find out what&apos;s happening on this date in 2027</p>
          <div className="actions">
            <button className="today" onClick={() => today != null && go(today)}>
              <span className="caps">Explore today&apos;s date</span>
              <span className="td">{today != null ? `${MONL[md(today)[0]]} ${md(today)[1]}` : ""}</span>
            </button>
            <button className="ghost" onClick={() => go(Math.floor(Math.random() * 365))}>Surprise me</button>
            <button className="ghost" aria-pressed={mode === "saved"} onClick={() => setMode(mode === "saved" ? "day" : "saved")}>My list <span className="n">{saved.length}</span></button>
          </div>
        </div>
        <div className="finders">
          <div className="search">
            <label className="caps" htmlFor="q">Keyword search</label>
            <input id="q" type="search" placeholder="pizza, marathon, pride" autoComplete="off" value={qText} onChange={(e) => { setQText(e.target.value); if (mode === "saved") setMode("day"); }} />
          </div>
          <div className="search">
            <label className="caps" htmlFor="when">Find a date or range</label>
            <input id="when" type="search" placeholder="January, Mar 3, Jun 1 to Jun 14" autoComplete="off" aria-describedby="whenhint" value={when}
              onChange={(e) => { setWhen(e.target.value); if (!e.target.value) { setRange(null); setHint(""); } }}
              onKeyDown={(e) => { if (e.key === "Enter") applyWhen(when, true); }} />
            <div className="hint" id="whenhint" aria-live="polite">{hint}</div>
          </div>
        </div>
      </header>

      <div className="cols">
        <section className="wheelbox">
          <div className="stage" ref={wrap}>
            <WheelCanvas counts={counts} active={active} sel={mode === "day" ? sel : null} today={today} range={range} zoom={zoom} hover={hover}
              onHover={onHover} onSelect={(d) => (range || mode !== "day" || q ? go(d) : select(d))} onZoom={zoomTo} onKey={onKey}
              label="Wheel of the 365 days of 2027 with ten rings: tech, holidays, music, film, sports, arts and culture, industry, deaths, births and observances. Use the arrow keys to move between days." />
            <div className="hub" aria-hidden="true">
              {hubDay != null ? (
                <>
                  <div className="hub1">{WD[wday(hubDay)]}</div>
                  <div className="hub2">{label(hubDay)}</div>
                  <div className="hub3">{mom(hubList.length)}</div>
                  <div className="hub4">{hubTop[0] || ""}</div>
                  <div className="hub4">{hubTop[1] || ""}</div>
                </>
              ) : (
                <>
                  <div className="hub1">{mode === "saved" ? "Saved" : range ? `${range[1] - range[0] + 1} days` : "365 days"}</div>
                  <div className="hub2 small">{mode === "saved" ? "My list" : range ? rangeLabel(range) : "All of 2027"}</div>
                  <div className="hub3">{mom(list.length)}</div>
                </>
              )}
            </div>
            {hover && (
              <div className="tip" style={{ left: tip.x, top: tip.y }} data-flip={tip.x > (wrap.current?.clientWidth ?? 0) * 0.6}>
                <div className="tiphead">{WD[wday(hover.day)].slice(0, 3)}, {label(hover.day)} · {mom(idx.byDay[hover.day].length)}</div>
                {hover.ring != null && tipList.length > 0 && (
                  <>
                    <div className="tipring" style={{ color: RINGS[hover.ring].color }}>{RINGS[hover.ring].letter} · {RINGS[hover.ring].name} · {tipList.length}</div>
                    {tipList.slice(0, 4).map((x) => <div key={x.id} className="tipline">{x.n}</div>)}
                    {tipList.length > 4 && <div className="tipline more2">+{tipList.length - 4} more</div>}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="zooms" role="group" aria-label="Zoom the wheel">
            <button aria-pressed={zoom == null} onClick={() => setZoom(null)}>Year</button>
            {MON.map((m, i) => <button key={m} aria-pressed={zoom === i} onClick={() => zoomTo(i)}>{m}</button>)}
          </div>
          <div className="transport">
            <input type="range" min={0} max={364} value={sel} aria-label="Scrub through the year" onChange={(e) => go(+e.target.value)} />
          </div>
          <p className="caps note">{q || rings.size < NR ? `${mom(idx.matched)} ${idx.matched === 1 ? "matches" : "match"}` : "Drag around the wheel to scrub · click a month to zoom in"}</p>

          {upcoming.length > 0 && (
            <div className="upnext">
              <div className="caps">Coming up after {label(sel)}</div>
              {upcoming.map((it) => (
                <button key={it.id} onClick={() => go(it.s!)} style={{ ["--c" as string]: RINGS[it.r].color }}>
                  <i /><span className="un">{it.n}</span><span className="ud">{label(it.s!)} · in {it.s! - sel} {it.s! - sel === 1 ? "day" : "days"}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="side">
          <section aria-label="Key to the rings">
            <div className="caps">Click a color to hide or show</div>
            <div className="keys">
              {RINGS.map((ring, k) => {
                const on = rings.has(k), only = rings.size === 1 && on;
                return (
                  <div className="keyrow" key={k} style={{ ["--c" as string]: ring.color }}>
                    <button className="key" aria-pressed={on} onClick={() => toggleRing(k)}><b>{ring.letter}</b><i /><span>{ring.name}</span><span className="n">{totals[k].toLocaleString("en-US")}</span></button>
                    <button className="iso" aria-pressed={only} aria-label={only ? "Show all rings" : "Show only " + ring.name} onClick={() => isolate(k)}>{only ? "Show all" : "Isolate"}</button>
                  </div>
                );
              })}
            </div>
            <div className="ramp caps">
              <span className="tk"><i />today</span>
              <button className="iso" aria-pressed={mode === "all"} onClick={() => { setMode(mode === "all" ? "day" : "all"); setRange(null); setWhen(""); setOpen(new Set()); }}>See all</button>
            </div>
          </section>

          <section>
            {mode !== "all" && (
              <div className="dayhead">
                <h2>{title}</h2>
                <div className="nav">
                  {dayMode && <button className="btn wide" onClick={share}>{copied ? "Copied" : "Copy link"}</button>}
                  {mode === "day" && (range || !q) && <><button className="btn" aria-label="Previous day or range" onClick={() => step(-1)}>←</button><button className="btn" aria-label="Next day or range" onClick={() => step(1)}>→</button></>}
                </div>
              </div>
            )}
            <div className="caps daysub">{sub}</div>
            {mode === "saved" && list.length > 0 && (
              <div className="savedbar">
                <a className="btn wide" href={icsHref}>Download calendar file</a>
                <button className="btn wide" onClick={() => persist([])}>Clear list</button>
              </div>
            )}
            <div className="daybody">
              {list.length ? groups : <p className="empty-note">{empty}</p>}
              {running.length > 0 && (
                <details>
                  <summary>{running.length} week- and month-long observances also running</summary>
                  <ol className="items">{running.map((x, i) => entry(x, i + 1, true))}</ol>
                </details>
              )}
            </div>
          </section>
        </div>
      </div>
      <footer>Status labels show whether a date is confirmed, listed, calculated or estimated (checked Nov 22, 2026). Week- and month-long observances are counted on the day they start. Wheel layout inspired by “Colours in Cultures” by David McCandless and AlwaysWithHonor for Information is Beautiful.</footer>
    </main>
  );
}
