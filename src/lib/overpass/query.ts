/**
 * Overpass QL query construction for green-space features.
 *
 * The general pattern here — build one union query over a handful of OSM
 * tag/value pairs, filtered by `around:<radius>,<lat>,<lon>`, requesting
 * `out center tags` so ways/relations come back with a computed centroid
 * — follows the same approach as the Nirog project's
 * `healthmap_fetch.py` (`~/Projects/Nirog App/healthmap_fetch.py`), which
 * used it to pull real PHC/CHC/hospital coordinates from Overpass. That
 * script queried `amenity` values for health facilities; this queries
 * `leisure` / `landuse` / `natural` / `boundary` values for green space.
 * See the README for the full credit.
 *
 * Regex-union tag matching (`["leisure"~"^(park|nature_reserve|garden)$"]`)
 * is used instead of one clause per tag value, for the same reason Nirog
 * used it: fewer clauses means less parsing/matching work per query on
 * the shared public Overpass instance. In practice, while building this
 * feature, overpass-api.de returned an HTTP 504 on the very first live
 * call made against it (a generic "server busy" error, reproduced by a
 * plain retry a few seconds later with the identical query — this is
 * shared, unauthenticated public infrastructure, not something under our
 * control) and then 200'd consistently on every subsequent attempt. That
 * is the actual, honest reason this client retries against a mirror and
 * falls back to a cached real snapshot rather than promising the live
 * endpoint always answers — see fetchGreenSpaces() in `client.ts`.
 */

export interface GreenSpaceQueryOptions {
  lat: number;
  lon: number;
  radiusMeters?: number;
  timeoutSeconds?: number;
}

const DEFAULT_RADIUS_METERS = 2000;
// Deliberately below the client's own abort (22s, see client.ts) so a slow
// area comes back as a real Overpass timeout we can report, rather than an
// aborted fetch we can only guess about.
const DEFAULT_TIMEOUT_SECONDS = 40;

export function buildGreenSpaceQuery({
  lat,
  lon,
  radiusMeters = DEFAULT_RADIUS_METERS,
  timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
}: GreenSpaceQueryOptions): string {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error(`buildGreenSpaceQuery: invalid latitude ${lat}`);
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error(`buildGreenSpaceQuery: invalid longitude ${lon}`);
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 50000) {
    throw new Error(`buildGreenSpaceQuery: invalid radius ${radiusMeters}`);
  }

  const around = `around:${radiusMeters},${lat},${lon}`;
  // National parks are frequently huge relations, so they get a wider
  // radius — a 2km "near me" radius would otherwise miss one whose
  // boundary starts 2.1km away but whose accessible edge is much closer.
  const wideAround = `around:${Math.min(radiusMeters * 1.5, 50000)},${lat},${lon}`;

  const clauses = [
    `node["leisure"~"^(park|nature_reserve|garden)$"](${around});`,
    `way["leisure"~"^(park|nature_reserve|garden)$"](${around});`,
    `relation["leisure"~"^(park|nature_reserve|garden)$"](${around});`,
    `way["landuse"~"^(forest|recreation_ground)$"](${around});`,
    `relation["landuse"~"^(forest|recreation_ground)$"](${around});`,
    `way["natural"="wood"](${around});`,
    // boundary=national_park is unambiguous on its own. boundary=protected_area
    // is not: OSM also uses it for heritage/cultural protection boundaries
    // with no nature content at all (found during manual QA: a courthouse
    // building in Portland carries boundary=protected_area for its National
    // Register of Historic Places status). Real protected NATURE areas carry
    // an IUCN protect_class tag alongside it; heritage boundaries don't. So
    // protected_area is only queried together with protect_class present.
    `way["boundary"="national_park"](${wideAround});`,
    `relation["boundary"="national_park"](${wideAround});`,
    `way["boundary"="protected_area"]["protect_class"](${wideAround});`,
    `relation["boundary"="protected_area"]["protect_class"](${wideAround});`,
  ];

  return `[out:json][timeout:${timeoutSeconds}];\n(\n  ${clauses.join("\n  ")}\n);\nout center tags;`;
}
