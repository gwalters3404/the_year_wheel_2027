// Shared data model and date math for 2027 (not a leap year; Jan 1 is a Friday).

export type Raw = string[];

export interface Moment {
  id: number;
  t: string; // h holiday, e event, i industry, o observance, b birth, d death
  n: string; // name
  rs: string; // real start, ISO
  re: string; // real end, ISO
  c: string; // category
  l: string; // location
  st: string; // status
  x: string; // basis
  u: string; // url
  y: string; // extra
  s: number | null; // start day index 0..364
  e: number | null; // end day index
  r: number; // ring index
  hay: string;
}

export const RINGS = [
  { letter: "A", name: "Tech", color: "#e5412f" },
  { letter: "B", name: "Holidays", color: "#f28a2a" },
  { letter: "C", name: "Music", color: "#f5d13b" },
  { letter: "D", name: "Film", color: "#86bd43" },
  { letter: "E", name: "Sports", color: "#27a79a" },
  { letter: "F", name: "Arts & culture", color: "#3d8fd6" },
  { letter: "G", name: "Industry", color: "#9566b8" },
  { letter: "H", name: "Deaths", color: "#ea6fa5" },
  { letter: "I", name: "Births", color: "#f1eee6" },
  { letter: "J", name: "Observances", color: "#96938c" },
] as const;
export const NR = RINGS.length;

export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MSTART = DIM.reduce<number[]>((a, _d, i) => (a.push(i ? a[i - 1] + DIM[i - 1] : 0), a), []);
export const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function doy(iso: string): number | null {
  if (!iso) return null;
  const y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1, d = +iso.slice(8, 10);
  if (y < 2027) return 0;
  if (y > 2027) return 364;
  return MSTART[m] + d - 1;
}
export function md(d: number): [number, number] {
  let m = 11;
  while (MSTART[m] > d) m--;
  return [m, d - MSTART[m] + 1];
}
export const wday = (d: number) => (5 + d) % 7;
export function label(d: number) {
  const [m, day] = md(d);
  return MON[m] + " " + day;
}
export function dayTitle(d: number) {
  const [m, day] = md(d);
  return WD[wday(d)] + ", " + MONL[m] + " " + day;
}
export function mmdd(d: number) {
  const [m, day] = md(d);
  return String(m + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}
export function fromMmdd(v: string): number | null {
  const x = /^(\d\d)-(\d\d)$/.exec(v);
  if (!x) return null;
  const m = +x[1] - 1, d = +x[2];
  if (m < 0 || m > 11 || d < 1 || d > DIM[m]) return null;
  return MSTART[m] + d - 1;
}
export function rangeText(it: Moment) {
  if (it.s == null) return "";
  if (it.e == null || it.e === it.s) return label(it.s);
  const f = (x: string) => {
    const m = +x.slice(5, 7) - 1, d = +x.slice(8, 10), y = x.slice(0, 4);
    return MON[m] + " " + d + (y !== "2027" ? ", " + y : "");
  };
  return f(it.rs) + " to " + f(it.re);
}
export const mom = (n: number) => n.toLocaleString("en-US") + (n === 1 ? " moment" : " moments");

export function ringOf(t: string, c: string) {
  switch (t) {
    case "h": return 1;
    case "i": return 6;
    case "d": return 7;
    case "b": return 8;
    case "o": return 9;
  }
  return c.startsWith("Music") ? 2 : c.startsWith("Film") ? 3 : c.startsWith("Sports") ? 4 : c.startsWith("Tech") ? 0 : 5;
}

export function parseRows(rows: Raw[]): Moment[] {
  return rows.map((r, id) => {
    const it: Moment = {
      id, t: r[0], n: r[1], rs: r[2], re: r[3], c: r[4], l: r[5], st: r[6], x: r[7], u: r[8], y: r[9],
      s: doy(r[2]), e: r[3] ? doy(r[3]) : null, r: ringOf(r[0], r[4] || ""), hay: (r[1] + " " + r[4] + " " + r[5]).toLowerCase(),
    };
    if (it.s == null && it.e != null) { it.s = it.e; it.rs = it.re; }
    if (it.e != null && it.s != null && it.e < it.s) it.e = it.s;
    return it;
  });
}

export interface DayIndex {
  byDay: Moment[][];
  running: Moment[][];
  undated: Moment[];
  matched: number;
}
// Observances longer than a day are listed on their start day only and tracked as "running" afterwards.
export function buildIndex(items: Moment[], pass: (it: Moment) => boolean): DayIndex {
  const byDay: Moment[][] = Array.from({ length: 365 }, () => []);
  const running: Moment[][] = Array.from({ length: 365 }, () => []);
  const undated: Moment[] = [];
  let matched = 0;
  for (const it of items) {
    if (!pass(it)) continue;
    matched++;
    if (it.s == null) { undated.push(it); continue; }
    const e = it.e == null ? it.s : it.e;
    if (it.t === "o" && e > it.s) {
      byDay[it.s].push(it);
      for (let d = it.s + 1; d <= e; d++) running[d].push(it);
    } else for (let d = it.s; d <= e; d++) byDay[d].push(it);
  }
  return { byDay, running, undated, matched };
}

export function headlines(list: Moment[], n = 2): string[] {
  return list
    .filter((x) => x.t === "h")
    .concat(list.filter((x) => x.t === "e" && (x.e == null || x.e - (x.s ?? 0) < 10)), list.filter((x) => x.t === "o"))
    .slice(0, n)
    .map((x) => x.n);
}

export type DayRange = [number, number];
export function rangeLabel([a, b]: DayRange) {
  const [m, d1] = md(a), [m2, d2] = md(b);
  if (a === 0 && b === 364) return "All of 2027";
  if (m === m2 && d1 === 1 && d2 === DIM[m]) return MONL[m];
  return label(a) + " to " + label(b);
}

function parsePart(raw: string, ctxMonth?: number): [number, number, number?] | null {
  const t = raw.trim().replace(/,?\s*2027$/, "").replace(/(\d)(st|nd|rd|th)\b/g, "$1").trim();
  const mon = (w: string) => {
    const k = w.slice(0, 3);
    const i = MON.findIndex((n) => n.toLowerCase() === k);
    return i >= 0 && MONL[i].toLowerCase().startsWith(w.replace(/\.$/, "")) ? i : -1;
  };
  let m: number | undefined, day: number | null = null, x: RegExpExecArray | null;
  if ((x = /^q([1-4])$/.exec(t))) { const q = +x[1] - 1; return [MSTART[q * 3], MSTART[q * 3 + 2] + DIM[q * 3 + 2] - 1]; }
  if (t === "2027" || t === "year" || t === "all") return [0, 364];
  if ((x = /^(\d{1,2})\s*\/\s*(\d{1,2})$/.exec(t))) { m = +x[1] - 1; day = +x[2]; }
  else if ((x = /^([a-z]+\.?)\s*(\d{1,2})?$/.exec(t))) { m = mon(x[1]); day = x[2] ? +x[2] : null; }
  else if ((x = /^(\d{1,2})\s+([a-z]+\.?)$/.exec(t))) { m = mon(x[2]); day = +x[1]; }
  else if (ctxMonth != null && (x = /^(\d{1,2})$/.exec(t))) { m = ctxMonth; day = +x[1]; }
  else return null;
  if (m == null || m < 0 || m > 11) return null;
  if (day == null) return [MSTART[m], MSTART[m] + DIM[m] - 1, m];
  if (day < 1 || day > DIM[m]) return null;
  return [MSTART[m] + day - 1, MSTART[m] + day - 1, m];
}
// null = empty input, false = could not be read, otherwise an inclusive day range.
export function parseWhen(input: string): DayRange | null | false {
  const v = input.toLowerCase().trim();
  if (!v) return null;
  const parts = v.split(/\s+(?:to|through|thru|until)\s+|\s*[–—-]\s*/);
  if (parts.length > 2) return false;
  const a = parsePart(parts[0]);
  if (!a) return false;
  if (parts.length === 1) return [a[0], a[1]];
  const b = parsePart(parts[1], a[2]);
  if (!b || b[1] < a[0]) return false;
  return [a[0], b[1]];
}

export function todayDoy() {
  const now = new Date();
  return MSTART[now.getMonth()] + Math.min(now.getDate(), DIM[now.getMonth()]) - 1;
}
