import { RAW } from "@/lib/server-data";

// The dataset the wheel loads in the browser, built once and served as a static file.
export const dynamic = "force-static";
export function GET() {
  return new Response(JSON.stringify(RAW), { headers: { "Content-Type": "application/json" } });
}
