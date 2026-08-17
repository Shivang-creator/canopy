/**
 * Server-side Overpass fetch: live query -> mirror -> honest cached
 * fallback.
 *
 * This runs only on the server (called from `src/app/api/greenspace/route.ts`)
 * both to avoid CORS friction in the browser and to control the
 * `User-Agent` header — the public Overpass instance is more likely to
 * reject or deprioritise a request without one. The primary/mirror
 * endpoint pair mirrors the pattern in Nirog's `healthmap_fetch.py`,
 * which tried `overpass-api.de` then `overpass.kumi.systems` in order and
 * gave up only if both failed. See the README for the full credit.
 */

import { buildGreenSpaceQuery } from "./query";
import { parseGreenSpaces } from "./parse";
import {
  FALLBACK_CAPTURED_AT,
  FALLBACK_CENTER,
  FALLBACK_ELEMENTS,
} from "./fallback-fixture";
import type { GreenSpaceQueryResult, RawOverpassResponse } from "./types";

// Measured 17 Aug 2026: overpass-api.de answers a 2km park query in ~18s.
// overpass.kumi.systems returned nothing at all inside 25s, so keeping it in
// the chain spent most of the function budget on an endpoint that was never
// going to reply. It stays listed second only as a fallback if the primary
// starts refusing outright.
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
] as const;

const USER_AGENT = "Canopy-Hackathon/0.1 (OregonHacks; green-space lookup)";
// One live endpoint inside the route's 60s budget, so it gets 45s and there is
// room left for parsing and the fallback path. Overpass is a free shared
// service under real load: 18s for a 2km query is normal, not broken.
//
// This has to stay LONGER than the [timeout:N] we hand Overpass itself
// (20s, see query.ts). If we abort first, the server never gets to answer and
// the user sees "operation was aborted" instead of a real result. That is
// exactly what happened for dense cities: a 12s client abort against a query
// the server had been told could take 25s.
const FETCH_TIMEOUT_MS = 45000;

async function postOverpass(endpoint: string, query: string): Promise<RawOverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`${endpoint} responded HTTP ${res.status}`);
    }
    const json = (await res.json()) as RawOverpassResponse;
    if (!Array.isArray(json.elements)) {
      throw new Error(`${endpoint} returned an unexpected shape`);
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

export interface FetchGreenSpacesOptions {
  lat: number;
  lon: number;
  radiusMeters?: number;
  limit?: number;
}

/**
 * Fetch real green-space features near a point.
 *
 * Tries the primary Overpass endpoint, then a mirror, and only falls back
 * to the bundled real-but-stale snapshot (see fallback-fixture.ts) if
 * both live attempts fail. The result always says which of the three
 * happened via `source`, so the UI can disclose it honestly rather than
 * silently presenting cached or fabricated data as a live answer.
 */
export async function fetchGreenSpaces(
  options: FetchGreenSpacesOptions,
): Promise<GreenSpaceQueryResult> {
  const { lat, lon, radiusMeters = 2000, limit = 20 } = options;
  const query = buildGreenSpaceQuery({ lat, lon, radiusMeters });
  const center = { lat, lon };
  const fetchedAt = new Date().toISOString();

  let lastError: string | undefined;

  for (let i = 0; i < ENDPOINTS.length; i++) {
    try {
      const raw = await postOverpass(ENDPOINTS[i], query);
      const spaces = parseGreenSpaces(raw, center, { maxDistanceMeters: radiusMeters * 1.6, limit });
      return {
        spaces,
        source: i === 0 ? "live" : "live_mirror",
        center,
        radiusMeters,
        fetchedAt,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  // Both live endpoints failed. Degrade honestly: use the bundled real
  // snapshot, and say so explicitly rather than pretending it's live.
  const spaces = parseGreenSpaces(
    { elements: FALLBACK_ELEMENTS },
    FALLBACK_CENTER,
    { limit },
  );
  return {
    spaces,
    source: "cached_fallback",
    center: FALLBACK_CENTER,
    radiusMeters,
    fetchedAt,
    cachedAt: FALLBACK_CAPTURED_AT,
    error: lastError,
  };
}
