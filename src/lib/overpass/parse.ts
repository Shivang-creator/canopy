/**
 * Overpass response parsing: raw elements -> deduped, distance-sorted
 * GreenSpace list.
 *
 * Adapted from the normalise/dedupe/label pattern in Nirog's
 * `healthmap_fetch.py` (element -> {name, lat, lon, type}, dedupe by
 * name+rounded-coordinate, classify a human-readable type from tags) —
 * ported from Python to TypeScript and re-targeted at green-space tags
 * instead of health-facility amenity tags. See the README for the full
 * credit.
 */

import type {
  GreenSpace,
  GreenSpaceKind,
  RawOverpassElement,
  RawOverpassResponse,
} from "./types";

/** Haversine great-circle distance in metres. */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Classify an element's green-space kind from its tags. Checked in an
 * order that prefers the more specific tag when an element carries more
 * than one (rare, but OSM data is messy). */
function classify(tags: Record<string, string>): { kind: GreenSpaceKind; rawTag: string } | null {
  if (tags.leisure === "nature_reserve") return { kind: "nature_reserve", rawTag: "leisure=nature_reserve" };
  if (tags.boundary === "national_park") return { kind: "protected_area", rawTag: "boundary=national_park" };
  // boundary=protected_area alone is ambiguous — OSM also uses it for
  // heritage/cultural protection with zero nature content (e.g. a
  // National-Register-listed courthouse). Real protected nature areas
  // carry an IUCN protect_class tag alongside it; only count it then.
  if (tags.boundary === "protected_area" && tags.protect_class) {
    return { kind: "protected_area", rawTag: "boundary=protected_area" };
  }
  if (tags.leisure === "garden") return { kind: "garden", rawTag: "leisure=garden" };
  if (tags.leisure === "park") return { kind: "park", rawTag: "leisure=park" };
  if (tags.landuse === "forest") return { kind: "forest", rawTag: "landuse=forest" };
  if (tags.natural === "wood") return { kind: "forest", rawTag: "natural=wood" };
  if (tags.landuse === "recreation_ground") return { kind: "recreation_ground", rawTag: "landuse=recreation_ground" };
  return null;
}

function elementCoords(el: RawOverpassElement): { lat: number; lon: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center && typeof el.center.lat === "number" && typeof el.center.lon === "number") {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return null;
}

export interface ParseOptions {
  /** Only features within this radius are kept, even if Overpass returned
   * something wider (the boundary/protected_area clause queries a larger
   * radius than the rest — see query.ts). */
  maxDistanceMeters?: number;
  /** Cap on the number of results returned, closest first. */
  limit?: number;
}

export function parseGreenSpaces(
  response: RawOverpassResponse,
  center: { lat: number; lon: number },
  options: ParseOptions = {},
): GreenSpace[] {
  const { maxDistanceMeters = Infinity, limit = 50 } = options;
  const seen = new Set<string>();
  const out: GreenSpace[] = [];

  for (const el of response.elements ?? []) {
    const tags = el.tags ?? {};
    const classification = classify(tags);
    if (!classification) continue;

    const coords = elementCoords(el);
    if (!coords) continue;

    const distanceMeters = haversineMeters(center.lat, center.lon, coords.lat, coords.lon);
    if (distanceMeters > maxDistanceMeters) continue;

    const name = tags.name?.trim() || null;
    // Dedupe on name + coarse coordinate (~11m grid) rather than OSM id:
    // the same real-world park is sometimes mapped as both a way and an
    // overlapping relation, and we want one card per place, not two.
    const dedupeKey = name
      ? `${name.toLowerCase()}|${coords.lat.toFixed(4)}|${coords.lon.toFixed(4)}`
      : `${el.type}/${el.id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push({
      id: `${el.type}/${el.id}`,
      name,
      kind: classification.kind,
      rawTag: classification.rawTag,
      lat: coords.lat,
      lon: coords.lon,
      distanceMeters: Math.round(distanceMeters),
      osmType: el.type,
      osmId: el.id,
      unnamed: name === null,
    });
  }

  out.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return out.slice(0, limit);
}
