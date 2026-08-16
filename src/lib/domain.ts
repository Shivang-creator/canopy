/**
 * Canopy — domain model.
 *
 * One diary entry pairs a day's outdoor time with the same day's
 * mood/energy self-rating. Everything downstream (the correlation panel,
 * the "log has gaps" warnings) is computed from a list of these — nothing
 * else is stored.
 */

import type { DayKey } from "./dates";

/** Loose category for where the time outdoors happened. Optional — the
 * fast path is just minutes. */
export const OUTDOOR_CATEGORIES = [
  "park",
  "trail_or_forest",
  "water_or_beach",
  "yard_or_neighborhood",
  "other_outdoor",
] as const;

export type OutdoorCategory = (typeof OUTDOOR_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<OutdoorCategory, string> = {
  park: "Park",
  trail_or_forest: "Trail / forest",
  water_or_beach: "Water / beach",
  yard_or_neighborhood: "Yard / neighborhood",
  other_outdoor: "Other outdoor",
};

/** The two outcomes Canopy tracks. Both are 1-5 self-ratings, chosen
 * because a tap-to-select 1-5 scale is the fastest honest way to log a
 * subjective state — no slider to drag, no free text required. */
export const METRICS = ["mood", "energy"] as const;
export type MetricId = (typeof METRICS)[number];

export const METRIC_LABEL: Record<MetricId, string> = {
  mood: "Mood",
  energy: "Energy",
};

export interface Entry {
  id: string;
  date: DayKey;
  createdAt: string; // ISO timestamp
  /** "demo" entries seed the payoff view on first load; "user" entries are
   * a real personal log. The two are never mixed in one analysis. */
  source: "demo" | "user";
  minutesOutdoors: number;
  category: OutdoorCategory | null;
  /** Free-text place name, e.g. "Laurelhurst Park" or "just the block". */
  location: string;
  mood: number; // 1-5
  energy: number; // 1-5
  note: string;
}

export function emptyEntry(date: DayKey): Omit<Entry, "id" | "createdAt" | "source"> {
  return {
    date,
    minutesOutdoors: 0,
    category: null,
    location: "",
    mood: 3,
    energy: 3,
    note: "",
  };
}
