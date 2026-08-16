/**
 * Local persistence.
 *
 * No login, no server-side database — Canopy is a single-visitor diary
 * that lives in the browser's localStorage. Two states:
 *
 *  - Nobody has logged a real entry yet: `getEntries()` returns a fresh
 *    demo diary (see `demo/seed.ts`) every time, generated on the fly and
 *    never written to storage. This is what a judge sees on first load.
 *  - The visitor has logged at least one real entry: `getEntries()`
 *    returns their real, stored diary. Demo and real entries are never
 *    merged — starting a real log clears the demo framing entirely.
 */

import type { Entry } from "./domain";
import { buildDemoEntries } from "./demo/seed";
import { DEMO_HOME } from "./demo/seed";
import { todayKey } from "./dates";

const KEYS = {
  entries: "canopy:entries:v1",
  started: "canopy:started-real-log:v1",
  location: "canopy:location:v1",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled (private browsing etc.) — fail silently
    // rather than crash the entry form.
  }
}

/* ------------------------------------------------------------------ */
/* Diary mode                                                          */
/* ------------------------------------------------------------------ */

export function hasStartedRealLog(): boolean {
  return readJson<boolean>(KEYS.started, false);
}

/** Switches Canopy from "showing the demo" to "showing your real,
 * currently-empty log". Idempotent. */
export function startRealLog(): void {
  writeJson(KEYS.started, true);
  if (!readJson<Entry[] | null>(KEYS.entries, null)) {
    writeJson(KEYS.entries, []);
  }
}

/** Returns to the demo view and discards any real entries. Used by the
 * "reset to demo" affordance on /method — a judge or a curious visitor
 * should be able to get back to the payoff view without clearing browser
 * storage by hand. */
export function resetToDemo(): void {
  writeJson(KEYS.started, false);
  writeJson(KEYS.entries, []);
}

/* ------------------------------------------------------------------ */
/* Entries                                                             */
/* ------------------------------------------------------------------ */

export function getEntries(): Entry[] {
  if (!hasStartedRealLog()) {
    return buildDemoEntries(todayKey());
  }
  return readJson<Entry[]>(KEYS.entries, []);
}

/** Add or replace today's (or any day's) entry, keyed by date — one entry
 * per calendar day, matching the product's "one quick check-in a day"
 * model. Logging a real entry implicitly starts the real log, replacing
 * the demo view. */
export function upsertEntry(entry: Entry): Entry[] {
  startRealLog();
  const existing = readJson<Entry[]>(KEYS.entries, []);
  const next = existing.filter((e) => e.date !== entry.date);
  next.push(entry);
  next.sort((a, b) => a.date.localeCompare(b.date));
  writeJson(KEYS.entries, next);
  return next;
}

export function deleteEntry(date: string): Entry[] {
  const existing = readJson<Entry[]>(KEYS.entries, []);
  const next = existing.filter((e) => e.date !== date);
  writeJson(KEYS.entries, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Location (for the green-space query)                                */
/* ------------------------------------------------------------------ */

export interface StoredLocation {
  lat: number;
  lon: number;
  label: string;
  source: "demo" | "geocoded" | "geolocation";
}

const DEFAULT_LOCATION: StoredLocation = {
  lat: DEMO_HOME.lat,
  lon: DEMO_HOME.lon,
  label: DEMO_HOME.label,
  source: "demo",
};

export function getLocation(): StoredLocation {
  return readJson<StoredLocation>(KEYS.location, DEFAULT_LOCATION);
}

export function setLocation(loc: StoredLocation): void {
  writeJson(KEYS.location, loc);
}
