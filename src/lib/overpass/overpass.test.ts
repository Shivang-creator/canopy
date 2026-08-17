import { describe, it, expect } from "vitest";
import { buildGreenSpaceQuery } from "./query";
import { parseGreenSpaces, haversineMeters } from "./parse";
import { FALLBACK_ELEMENTS, FALLBACK_CENTER } from "./fallback-fixture";
import type { RawOverpassResponse } from "./types";

describe("buildGreenSpaceQuery", () => {
  it("interpolates coordinates and radius into valid-looking Overpass QL", () => {
    const q = buildGreenSpaceQuery({ lat: 45.5152, lon: -122.6784, radiusMeters: 2000 });
    expect(q).toContain("[out:json]");
    expect(q).toContain("around:2000,45.5152,-122.6784");
    expect(q).toContain('leisure"~"^(park|nature_reserve|garden)$"');
    expect(q).toContain("out center tags;");
  });

  it("widens the radius for the national-park/protected-area clause", () => {
    const q = buildGreenSpaceQuery({ lat: 45.5, lon: -122.6, radiusMeters: 2000 });
    expect(q).toContain("around:3000,45.5,-122.6"); // 1.5x, capped at 50km
  });

  it("requires protect_class for boundary=protected_area but not for national_park", () => {
    // Regression guard for the Pioneer Courthouse false-positive (see
    // parse.test cases): boundary=protected_area alone is ambiguous in
    // OSM (heritage sites use it too), so it must be gated on
    // protect_class in the query itself, not just in the parser.
    const q = buildGreenSpaceQuery({ lat: 45.5, lon: -122.6 });
    expect(q).toContain('way["boundary"="national_park"]');
    expect(q).toContain('way["boundary"="protected_area"]["protect_class"]');
    expect(q).not.toContain('boundary"~"^(national_park|protected_area)');
  });

  it("caps the widened radius at 50km even for a huge input radius", () => {
    const q = buildGreenSpaceQuery({ lat: 45.5, lon: -122.6, radiusMeters: 40000 });
    expect(q).toContain("around:50000,45.5,-122.6");
  });

  it("defaults to a sensible radius and timeout when omitted", () => {
    const q = buildGreenSpaceQuery({ lat: 0, lon: 0 });
    expect(q).toContain("[timeout:20]");
    expect(q).toContain("around:2000,0,0");
  });

  it("rejects out-of-range coordinates rather than silently sending garbage", () => {
    expect(() => buildGreenSpaceQuery({ lat: 95, lon: 0 })).toThrow();
    expect(() => buildGreenSpaceQuery({ lat: 0, lon: 200 })).toThrow();
    expect(() => buildGreenSpaceQuery({ lat: NaN, lon: 0 })).toThrow();
  });

  it("rejects a nonsense radius", () => {
    expect(() => buildGreenSpaceQuery({ lat: 0, lon: 0, radiusMeters: 0 })).toThrow();
    expect(() => buildGreenSpaceQuery({ lat: 0, lon: 0, radiusMeters: -5 })).toThrow();
    expect(() => buildGreenSpaceQuery({ lat: 0, lon: 0, radiusMeters: 999999 })).toThrow();
  });
});

describe("haversineMeters", () => {
  it("is zero for identical points", () => {
    expect(haversineMeters(45.5, -122.6, 45.5, -122.6)).toBeCloseTo(0, 6);
  });

  it("matches a known reference distance", () => {
    // Portland City Hall to Powell's Books, roughly 1.0km apart.
    const d = haversineMeters(45.5152, -122.6784, 45.5231, -122.6814);
    expect(d).toBeGreaterThan(700);
    expect(d).toBeLessThan(1200);
  });

  it("is symmetric", () => {
    const a = haversineMeters(10, 10, 20, 20);
    const b = haversineMeters(20, 20, 10, 10);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("parseGreenSpaces", () => {
  const center = { lat: 45.5152, lon: -122.6784 };

  it("classifies leisure=park as kind 'park'", () => {
    const raw: RawOverpassResponse = {
      elements: [
        {
          type: "way",
          id: 1,
          center: { lat: 45.516, lon: -122.679 },
          tags: { leisure: "park", name: "Test Park" },
        },
      ],
    };
    const spaces = parseGreenSpaces(raw, center);
    expect(spaces).toHaveLength(1);
    expect(spaces[0].kind).toBe("park");
    expect(spaces[0].name).toBe("Test Park");
    expect(spaces[0].unnamed).toBe(false);
  });

  it("classifies forest via either landuse=forest or natural=wood", () => {
    const raw: RawOverpassResponse = {
      elements: [
        { type: "way", id: 1, center: { lat: 45.52, lon: -122.68 }, tags: { landuse: "forest" } },
        { type: "way", id: 2, center: { lat: 45.53, lon: -122.68 }, tags: { natural: "wood" } },
      ],
    };
    const spaces = parseGreenSpaces(raw, center);
    expect(spaces.every((s) => s.kind === "forest")).toBe(true);
  });

  it("marks a nameless feature as unnamed rather than inventing a name", () => {
    const raw: RawOverpassResponse = {
      elements: [{ type: "way", id: 1, center: { lat: 45.516, lon: -122.679 }, tags: { leisure: "park" } }],
    };
    const spaces = parseGreenSpaces(raw, center);
    expect(spaces[0].name).toBeNull();
    expect(spaces[0].unnamed).toBe(true);
  });

  it("reads coordinates from lat/lon on nodes and from center on ways", () => {
    const raw: RawOverpassResponse = {
      elements: [
        { type: "node", id: 1, lat: 45.52, lon: -122.68, tags: { leisure: "garden", name: "Node Garden" } },
        { type: "way", id: 2, center: { lat: 45.53, lon: -122.69 }, tags: { leisure: "garden", name: "Way Garden" } },
      ],
    };
    const spaces = parseGreenSpaces(raw, center);
    expect(spaces.find((s) => s.name === "Node Garden")?.lat).toBeCloseTo(45.52, 6);
    expect(spaces.find((s) => s.name === "Way Garden")?.lat).toBeCloseTo(45.53, 6);
  });

  it("drops elements with no usable coordinate rather than crashing", () => {
    const raw: RawOverpassResponse = {
      elements: [{ type: "way", id: 1, tags: { leisure: "park", name: "No Coords" } }],
    };
    expect(() => parseGreenSpaces(raw, center)).not.toThrow();
    expect(parseGreenSpaces(raw, center)).toHaveLength(0);
  });

  it("excludes a heritage protected_area with no nature content (regression: Pioneer Courthouse)", () => {
    // Found during manual QA against a real Portland, OR query: a federal
    // courthouse carries boundary=protected_area for its National
    // Register of Historic Places status, with no protect_class tag. A
    // real protected NATURE area (e.g. Washington Park) carries
    // protect_class alongside boundary=protected_area.
    const raw: RawOverpassResponse = {
      elements: [
        {
          type: "way",
          id: 1,
          center: { lat: 45.5147, lon: -122.6793 },
          tags: {
            boundary: "protected_area",
            amenity: "courthouse",
            building: "office",
            heritage: "2",
            protection_title: "protected_site",
            name: "Pioneer Courthouse",
          },
        },
        {
          type: "relation",
          id: 2,
          center: { lat: 45.52, lon: -122.71 },
          tags: { boundary: "protected_area", protect_class: "5", name: "Washington Park" },
        },
      ],
    };
    const spaces = parseGreenSpaces(raw, center);
    expect(spaces.map((s) => s.name)).toEqual(["Washington Park"]);
  });

  it("ignores elements whose tags don't match any tracked green-space kind", () => {
    const raw: RawOverpassResponse = {
      elements: [
        { type: "node", id: 1, lat: 45.52, lon: -122.68, tags: { amenity: "cafe", name: "Not Green" } },
      ],
    };
    expect(parseGreenSpaces(raw, center)).toHaveLength(0);
  });

  it("dedupes the same named place mapped as overlapping elements", () => {
    const raw: RawOverpassResponse = {
      elements: [
        { type: "way", id: 1, center: { lat: 45.52001, lon: -122.68001 }, tags: { leisure: "park", name: "Dup Park" } },
        { type: "relation", id: 2, center: { lat: 45.52004, lon: -122.68004 }, tags: { leisure: "park", name: "Dup Park" } },
      ],
    };
    const spaces = parseGreenSpaces(raw, center);
    expect(spaces).toHaveLength(1);
  });

  it("sorts results by distance, closest first", () => {
    const raw: RawOverpassResponse = {
      elements: [
        { type: "way", id: 1, center: { lat: 45.6, lon: -122.6784 }, tags: { leisure: "park", name: "Far" } },
        { type: "way", id: 2, center: { lat: 45.516, lon: -122.6784 }, tags: { leisure: "park", name: "Near" } },
      ],
    };
    const spaces = parseGreenSpaces(raw, center);
    expect(spaces[0].name).toBe("Near");
    expect(spaces[1].name).toBe("Far");
    expect(spaces[0].distanceMeters).toBeLessThan(spaces[1].distanceMeters);
  });

  it("respects maxDistanceMeters", () => {
    const raw: RawOverpassResponse = {
      elements: [
        { type: "way", id: 1, center: { lat: 45.7, lon: -122.6784 }, tags: { leisure: "park", name: "Way Far" } },
      ],
    };
    const spaces = parseGreenSpaces(raw, center, { maxDistanceMeters: 5000 });
    expect(spaces).toHaveLength(0);
  });

  it("respects the limit and keeps the closest ones", () => {
    const elements = Array.from({ length: 10 }, (_, i) => ({
      type: "way" as const,
      id: i,
      center: { lat: 45.5152 + i * 0.001, lon: -122.6784 },
      tags: { leisure: "park", name: `Park ${i}` },
    }));
    const spaces = parseGreenSpaces({ elements }, center, { limit: 3 });
    expect(spaces).toHaveLength(3);
    expect(spaces.map((s) => s.name)).toEqual(["Park 0", "Park 1", "Park 2"]);
  });
});

describe("bundled fallback fixture", () => {
  it("is real captured data that still parses into a non-trivial result", () => {
    // This guards against the fallback silently rotting: if the fixture
    // shape ever drifted from what the parser expects, this would catch it.
    const spaces = parseGreenSpaces({ elements: FALLBACK_ELEMENTS }, FALLBACK_CENTER);
    expect(spaces.length).toBeGreaterThan(10);
    expect(spaces.some((s) => s.name === "Governor Tom McCall Waterfront Park")).toBe(true);
    expect(spaces.every((s) => s.distanceMeters >= 0)).toBe(true);
    // A real OSM pull always has some unnamed features (footpaths' edge
    // cases, incompletely-tagged ways) — if every single one had a name,
    // that would itself be a sign this is synthetic, not real, data.
    expect(spaces.some((s) => s.unnamed)).toBe(true);
  });
});
