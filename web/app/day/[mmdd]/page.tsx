import type { Metadata } from "next";
import { notFound } from "next/navigation";
import YearWheel from "@/components/YearWheel";
import { fromMmdd, mmdd } from "@/lib/moments";
import { daySummary } from "@/lib/server-data";

type Props = { params: Promise<{ mmdd: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from({ length: 365 }, (_, d) => ({ mmdd: mmdd(d) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = fromMmdd((await params).mmdd);
  if (d == null) return {};
  const s = daySummary(d);
  const description = `${s.countText} on ${s.title}, 2027` + (s.top.length ? `: ${s.top.join(", ")} and more.` : ".");
  return { title: s.title, description, openGraph: { title: `${s.title}, 2027`, description } };
}

export default async function DayPage({ params }: Props) {
  const d = fromMmdd((await params).mmdd);
  if (d == null) notFound();
  return <YearWheel initialDay={d} />;
}
