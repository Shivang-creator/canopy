import { NextResponse } from "next/server";
import { fetchGreenSpaces } from "@/lib/overpass/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const radiusParam = searchParams.get("radius");
  const radiusMeters = radiusParam ? parseInt(radiusParam, 10) : undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat and lon query params are required numbers" }, { status: 400 });
  }

  try {
    const result = await fetchGreenSpaces({ lat, lon, radiusMeters });
    return NextResponse.json(result);
  } catch (err) {
    // fetchGreenSpaces() already degrades to the cached fallback on
    // upstream failure, so reaching this branch means something more
    // fundamental broke (e.g. an invalid radius). Report it plainly
    // rather than returning a fabricated 200.
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
