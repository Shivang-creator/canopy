/** A single green-space feature, normalised from a raw Overpass element. */
export interface GreenSpace {
  /** Stable id: `${osmType}/${osmId}`. */
  id: string;
  name: string | null;
  /** Coarse category derived from OSM tags. */
  kind: GreenSpaceKind;
  /** The raw OSM tag value that produced `kind` (e.g. "nature_reserve"). */
  rawTag: string;
  lat: number;
  lon: number;
  /** Great-circle distance from the query center, in metres. */
  distanceMeters: number;
  osmType: "node" | "way" | "relation";
  osmId: number;
  /** True if OSM has no `name` tag — shown honestly rather than invented. */
  unnamed: boolean;
}

export const GREEN_SPACE_KINDS = [
  "park",
  "nature_reserve",
  "garden",
  "forest",
  "recreation_ground",
  "protected_area",
  "other_green",
] as const;

export type GreenSpaceKind = (typeof GREEN_SPACE_KINDS)[number];

export const KIND_LABEL: Record<GreenSpaceKind, string> = {
  park: "Park",
  nature_reserve: "Nature reserve",
  garden: "Garden",
  forest: "Forest / wood",
  recreation_ground: "Recreation ground",
  protected_area: "Protected area",
  other_green: "Green space",
};

export type GreenSpaceSource =
  /** A real, live network call to a public Overpass endpoint. */
  | "live"
  /** Live call succeeded via the secondary (mirror) endpoint. */
  | "live_mirror"
  /** Live call to every endpoint failed; a bundled real snapshot (fetched
   * for real, cached in this repo) was used instead. Always disclosed to
   * the user when this happens — never presented as a live result. */
  | "cached_fallback";

export interface GreenSpaceQueryResult {
  spaces: GreenSpace[];
  source: GreenSpaceSource;
  center: { lat: number; lon: number };
  radiusMeters: number;
  fetchedAt: string;
  /** Present only when source === "cached_fallback": when the bundled
   * snapshot was actually captured from the live API. */
  cachedAt?: string;
  /** Present only when a live attempt failed, for transparency/debugging. */
  error?: string;
}

/** The subset of a raw Overpass JSON element this app reads. Overpass
 * returns nodes with lat/lon directly and ways/relations with a computed
 * `center` (requested via `out center`). */
export interface RawOverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface RawOverpassResponse {
  version?: number;
  generator?: string;
  elements: RawOverpassElement[];
}
