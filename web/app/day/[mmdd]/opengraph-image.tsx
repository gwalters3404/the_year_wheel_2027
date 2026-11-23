import { ImageResponse } from "next/og";
import { fromMmdd, MONL, md, WD, wday } from "@/lib/moments";
import { daySummary } from "@/lib/server-data";

export const alt = "The Year Wheel: what's happening on this date in 2027";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ mmdd: string }> }) {
  const d = fromMmdd((await params).mmdd) ?? 0;
  const s = daySummary(d);
  const [m, day] = md(d);
  const max = Math.max(1, ...s.perRing.map((r) => Math.sqrt(r.count)));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#242322", color: "#f1eee6", padding: 64 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, letterSpacing: 8, color: "#a39f95" }}>
          <div>THE YEAR WHEEL</div>
          <div>2027</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, letterSpacing: 8, color: "#ffe066" }}>{WD[wday(d)].toUpperCase()}</div>
          <div style={{ fontSize: 124, letterSpacing: 6, lineHeight: 1.05 }}>{`${MONL[m].toUpperCase()} ${day}`}</div>
          <div style={{ fontSize: 34, color: "#a39f95", marginTop: 8 }}>{s.countText + (s.top.length ? " · " + s.top.slice(0, 2).join(" · ") : "")}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", height: 150 }}>
          {s.perRing.map((r) => (
            <div key={r.letter} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", width: 100, marginRight: 8, height: 150 }}>
              <div style={{ display: "flex", height: Math.max(r.count ? 8 : 2, (Math.sqrt(r.count) / max) * 84), background: r.color, opacity: r.count ? 1 : 0.3 }} />
              <div style={{ display: "flex", fontSize: 22, marginTop: 8 }}>{String(r.count)}</div>
              <div style={{ display: "flex", fontSize: 14, color: "#a39f95" }}>{r.name === "Arts & culture" ? "Arts" : r.name}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
