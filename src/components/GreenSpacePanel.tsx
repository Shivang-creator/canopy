"use client";

import { useState } from "react";
import type { GreenSpaceQueryResult } from "@/lib/overpass/types";
import { KIND_LABEL } from "@/lib/overpass/types";
import type { StoredLocation } from "@/lib/storage";
import type { TrendSignal } from "@/lib/analysis/engine";

function formatDistance(m: number): string {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function wasVisited(name: string | null, visitedNames: Set<string>): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  for (const v of visitedNames) {
    if (!v) continue;
    if (lower.includes(v) || v.includes(lower)) return true;
  }
  return false;
}

export function GreenSpacePanel({
  result,
  loading,
  location,
  trend,
  visitedNames,
  onSearch,
  onUseMyLocation,
}: {
  result: GreenSpaceQueryResult | null;
  loading: boolean;
  location: StoredLocation;
  trend: TrendSignal;
  visitedNames: Set<string>;
  onSearch: (query: string) => void;
  onUseMyLocation: () => void;
}) {
  const [query, setQuery] = useState("");

  const spaces = result?.spaces ?? [];
  const unvisited = spaces.filter((s) => !wasVisited(s.name, visitedNames));
  const nudge = trend.declining ? (unvisited[0] ?? spaces[0]) : null;

  return (
    <section
      className="rounded-2xl border p-5 sm:p-6"
      style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
      aria-labelledby="greenspace-heading"
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 id="greenspace-heading" className="font-display text-xl" style={{ color: "var(--ink)" }}>
          Real green space near you
        </h2>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
        A live query against OpenStreetMap&rsquo;s Overpass API — real parks, forests, gardens, and nature
        reserves, not a curated list.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) onSearch(query.trim());
        }}
        className="flex flex-wrap gap-2 mb-4"
      >
        <label htmlFor="place-search" className="sr-only">
          Search a place
        </label>
        <input
          id="place-search"
          type="text"
          placeholder="Search a city or address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[10rem] px-3 py-2 rounded-lg text-sm border"
          style={{ background: "transparent", borderColor: "var(--border-strong)", color: "var(--ink)" }}
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-sm border cursor-pointer"
          style={{ borderColor: "var(--border-strong)", color: "var(--ink)" }}
        >
          Search
        </button>
        <button
          type="button"
          onClick={onUseMyLocation}
          className="px-3 py-2 rounded-lg text-sm border cursor-pointer"
          style={{ borderColor: "var(--border-strong)", color: "var(--ink)" }}
        >
          Use my location
        </button>
      </form>

      <p className="text-xs font-data mb-3" style={{ color: "var(--ink-faint)" }}>
        near {location.label} ({location.lat.toFixed(4)}, {location.lon.toFixed(4)})
      </p>

      {nudge && (
        <div
          className="rounded-xl p-4 mb-4 text-sm"
          style={{ background: "var(--amber-wash)", color: "var(--ink)" }}
        >
          <p className="font-medium mb-0.5">
            Outdoor time dropped this week ({Math.round(trend.recentMean)} vs {Math.round(trend.priorMean)}{" "}
            min/day, n = {trend.recentN} and {trend.priorN}).
          </p>
          <p>
            {nudge.name ?? `An unnamed ${KIND_LABEL[nudge.kind].toLowerCase()}`} is {formatDistance(nudge.distanceMeters)}{" "}
            away and {wasVisited(nudge.name, visitedNames) ? "you’ve logged visiting it" : "you haven’t logged visiting it"}.
          </p>
        </div>
      )}

      {loading && (
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Querying OpenStreetMap&hellip; a live public API, so this can take a few seconds (occasionally longer
          under load — it will fall back honestly rather than hang forever).
        </p>
      )}

      {!loading && result && (
        <>
          <SourceBadge result={result} />
          {spaces.length === 0 ? (
            <p className="text-sm mt-3" style={{ color: "var(--ink-muted)" }}>
              No mapped green space found in this radius. OSM coverage varies a lot by region — this is a real
              absence-of-data result, not an error.
            </p>
          ) : (
            <ul className="mt-3 grid sm:grid-cols-2 gap-3">
              {spaces.slice(0, 8).map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border p-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>
                      {s.name ?? <em style={{ color: "var(--ink-faint)" }}>unnamed {KIND_LABEL[s.kind].toLowerCase()}</em>}
                    </span>
                    <span className="font-data text-xs whitespace-nowrap" style={{ color: "var(--canopy-bright)" }}>
                      {formatDistance(s.distanceMeters)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "var(--canopy-wash)", color: "var(--canopy-strong)" }}
                    >
                      {KIND_LABEL[s.kind]}
                    </span>
                    {wasVisited(s.name, visitedNames) && (
                      <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                        ✓ logged
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function SourceBadge({ result }: { result: GreenSpaceQueryResult }) {
  if (result.source === "cached_fallback") {
    return (
      <p className="text-xs rounded-lg p-2" style={{ background: "var(--rust-wash)", color: "var(--rust)" }}>
        Live Overpass query failed{result.error ? ` (${result.error})` : ""} — showing a real snapshot captured{" "}
        {result.cachedAt ? new Date(result.cachedAt).toLocaleDateString() : "earlier"} near Portland, OR instead of
        a live result for your location. Not fabricated data, just not fresh for where you asked about.
      </p>
    );
  }
  const label = result.source === "live_mirror" ? "Live (mirror endpoint)" : "Live";
  return (
    <p className="text-xs font-data" style={{ color: "var(--ink-faint)" }}>
      {label} · {result.spaces.length} features · fetched {new Date(result.fetchedAt).toLocaleTimeString()}
    </p>
  );
}
