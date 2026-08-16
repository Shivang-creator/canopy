import { NextResponse } from "next/server";
import { geocodePlace } from "@/lib/geocode";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ error: "q query param is required" }, { status: 400 });
  }

  try {
    const result = await geocodePlace(q);
    if (!result) {
      return NextResponse.json({ error: `No place found matching "${q}"` }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
