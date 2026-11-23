import { ITEMS } from "@/lib/server-data";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const compact = (iso: string) => iso.replace(/-/g, "");
function nextDay(iso: string) {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}
// Fold lines at 75 bytes as the iCalendar format asks.
function fold(line: string) {
  const out: string[] = [];
  let cur = "", bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > 73) { out.push(cur); cur = " "; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}

// GET /api/ics?ids=12,340 returns the chosen moments as an all-day calendar file.
export function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("ids") || "";
  const ids = [...new Set(raw.split(",").map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n >= 0 && n < ITEMS.length))].slice(0, 500);
  const picked = ids.map((i) => ITEMS[i]).filter((it) => it.rs);
  if (!picked.length) return new Response("No dated moments were requested.", { status: 400 });
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Year Wheel//2027//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:The Year Wheel 2027"];
  for (const it of picked) {
    const title = it.t === "b" ? `${it.n}'s birthday` : it.t === "d" ? `${it.n} died on this day` : it.n;
    const desc = [it.c, it.st && `Date status: ${it.st}`, it.x, it.u].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT", `UID:moment-${it.id}@the-year-wheel`, "DTSTAMP:20261122T000000Z", `DTSTART;VALUE=DATE:${compact(it.rs)}`, `DTEND;VALUE=DATE:${compact(nextDay(it.re || it.rs))}`, `SUMMARY:${esc(title)}`);
    if (it.l) lines.push(`LOCATION:${esc(it.l)}`);
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    if (it.u) lines.push(`URL:${it.u}`);
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="year-wheel-2027.ics"' },
  });
}
