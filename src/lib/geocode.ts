/**
 * Server-side geocoding via OpenStreetMap Nominatim.
 *
 * Lets a user type a place name ("Corvallis, Oregon") instead of raw
 * coordinates. Nominatim's usage policy asks for a descriptive
 * `User-Agent` and no more than ~1 request/second from a given client —
 * both respected here (single lookup per call, no client-side polling).
 */

const USER_AGENT = "Canopy-Hackathon/0.1 (OregonHacks; place lookup)";
const FETCH_TIMEOUT_MS = 10000;

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "1",
  })}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Nominatim responded HTTP ${res.status}`);
    const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!results.length) return null;
    const { lat, lon, display_name } = results[0];
    return { lat: parseFloat(lat), lon: parseFloat(lon), displayName: display_name };
  } finally {
    clearTimeout(timeout);
  }
}
