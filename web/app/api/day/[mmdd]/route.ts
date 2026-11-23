import { fromMmdd, RINGS } from "@/lib/moments";
import { daySummary, INDEX } from "@/lib/server-data";

// GET /api/day/07-04 returns everything on that date as JSON.
export async function GET(_req: Request, { params }: { params: Promise<{ mmdd: string }> }) {
  const key = (await params).mmdd;
  const d = fromMmdd(key);
  if (d == null) return Response.json({ error: "Use a date like 07-04." }, { status: 400 });
  const s = daySummary(d);
  const shape = (it: (typeof s.list)[number]) => ({
    id: it.id, name: it.n, category: it.c, location: it.l, start: it.rs, end: it.re || it.rs, status: it.st, basis: it.x, url: it.u,
  });
  return Response.json(
    {
      date: "2027-" + key,
      title: s.title,
      count: s.count,
      rings: RINGS.map((r, k) => ({ letter: r.letter, name: r.name, moments: s.list.filter((x) => x.r === k).map(shape) })),
      alsoRunning: INDEX.running[d].map(shape),
    },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
