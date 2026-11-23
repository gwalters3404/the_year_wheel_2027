import raw from "@/data/moments.json";
import { buildIndex, dayTitle, headlines, mom, parseRows, RINGS, type Moment, type Raw } from "./moments";

export const RAW = raw as unknown as Raw[];
export const ITEMS: Moment[] = parseRows(RAW);
export const INDEX = buildIndex(ITEMS, () => true);

export function daySummary(d: number) {
  const list = INDEX.byDay[d];
  const perRing = RINGS.map((r, k) => ({ ...r, count: list.filter((x) => x.r === k).length }));
  return { title: dayTitle(d), count: list.length, countText: mom(list.length), top: headlines(list, 3), perRing, list };
}
