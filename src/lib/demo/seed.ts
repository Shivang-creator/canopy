/**
 * The demo diary.
 *
 * A judge opens Canopy with zero history. An empty product cannot
 * demonstrate a longitudinal correlation, so this module synthesises a
 * realistic six-week diary with KNOWN planted signals.
 *
 * It is labelled as demo data everywhere it appears in the UI ("source":
 * "demo" on every entry), and starting a real personal log clears it —
 * demo and real entries are never mixed in one analysis.
 *
 * The generation *pattern* — a seeded mulberry32 PRNG plus a Box-Muller
 * normal deviate, so the diary is reproducible and can be regression
 * tested against known ground truth — is adapted from Skin Diary's
 * `~/Projects/skin-diary/src/lib/demo/seed.ts`. The actual content
 * (what's planted, at what strength, with what noise) is written fresh
 * for Canopy's domain. See the README for the full credit.
 *
 * Two properties matter, same as the source:
 *
 *  - DETERMINISTIC. A seeded PRNG, so every visitor sees the same diary
 *    and the same findings, and so the analysis engine can be regression
 *    tested against known ground truth (see seed.test.ts / engine.test.ts).
 *
 *  - HONEST IN SHAPE. It includes missed days, a genuinely null
 *    relationship (energy does NOT track same-day outdoor time; mood does
 *    NOT carry into the next day), and noise large enough that the engine
 *    has to actually work rather than being handed a clean answer.
 */

import type { Entry, OutdoorCategory } from "../domain";
import { addDays, todayKey, type DayKey } from "../dates";

/* ------------------------------------------------------------------ */
/* Ground truth — what the demo diary actually contains                */
/* ------------------------------------------------------------------ */

/**
 * The relationships planted in the demo data. The analysis engine is
 * given no knowledge of this table; seed.test.ts / engine.test.ts assert
 * that it rediscovers these...
 */
export const PLANTED_SIGNALS = [
  { metricId: "mood", lag: 0, direction: 1 },
  { metricId: "energy", lag: 1, direction: 1 },
] as const;

/** ...and does NOT invent a relationship at the lags/metrics deliberately
 * left null: mood does not carry into the next day, and energy does not
 * track *same-day* outdoor time (only the day after). */
export const NULL_RELATIONSHIPS = [
  { metricId: "mood", lag: 1 },
  { metricId: "energy", lag: 0 },
] as const;

export const DEMO_SPAN_DAYS = 42;
/** Days deliberately left blank — a real diary has gaps. */
export const DEMO_MISSED_DAY_INDEXES = [5, 16, 27] as const;
/** The most recent N days get a deliberate drop in outdoor time, so the
 * demo diary also exercises (and honestly earns) the "you've been going
 * outside less lately" nudge that surfaces real nearby green space.
 * Deliberately equal to the engine's trend window (ANALYSIS_CONFIG.
 * trendWindowDays, 7 days): that makes the "recent" window land exactly
 * on the decline and the "prior" window land exactly before it. A longer
 * decline was tried first and rejected — it let the lag-1 energy signal
 * leak into lag-0 (low-outdoor days clustering together made yesterday's
 * minutes and today's minutes correlated with each other, which forged a
 * same-day energy correlation that was never actually planted). Keeping
 * the two windows cleanly separated avoids that leakage. */
export const DEMO_DECLINE_DAYS = 7;

/** Where the demo diary is "from" — real coordinates in Portland, OR, so
 * the green-space panel's live Overpass query returns real places that
 * plausibly match the demo diary's location names. */
export const DEMO_HOME = {
  lat: 45.5152,
  lon: -122.6784,
  label: "Portland, OR (demo location)",
};

export const DEMO_SEED = 20260817;

/* ------------------------------------------------------------------ */
/* Deterministic PRNG                                                  */
/* ------------------------------------------------------------------ */

/** mulberry32 — small, fast, well-distributed, and completely reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller normal deviate from a uniform generator. */
function normal(rng: () => number, mean = 0, sd = 1): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/* ------------------------------------------------------------------ */
/* Real places, for realistic location text                            */
/* ------------------------------------------------------------------ */

/** Real Portland green spaces (confirmed present in a live Overpass query
 * against DEMO_HOME on 2026-08-16 — see README) used as demo location
 * text, so the diary's free-text locations plausibly line up with what
 * the live green-space panel actually returns. */
const PARK_PLACES = [
  "Governor Tom McCall Waterfront Park",
  "Couch Park",
  "Duniway Park",
  "Tanner Springs Park",
  "Mill Ends Park",
  "Keller Fountain Park",
  "South Park Blocks",
  "Lan Su Chinese Garden",
] as const;

const TRAIL_PLACES = ["Forest Park trail", "the river trail"] as const;
const WATER_PLACES = ["South Waterfront Greenway", "the river greenway"] as const;
const YARD_PLACES = ["the backyard", "around the block", "the neighborhood loop"] as const;
const OTHER_PLACES = ["a walk downtown", "lunch outside"] as const;

const NOTES = [
  "",
  "",
  "Golden light on the walk back.",
  "",
  "Short one — squeezed it in before work.",
  "",
  "Rained most of the day.",
  "",
  "",
  "Felt good to get out.",
  "",
  "Busy week, barely left the block.",
];

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Build the demo diary.
 *
 * @param endDate the most recent day in the diary (defaults to today, so
 *                the demo always looks current)
 */
export function buildDemoEntries(endDate: DayKey = todayKey()): Entry[] {
  const rng = mulberry32(DEMO_SEED);
  const startDate = addDays(endDate, -(DEMO_SPAN_DAYS - 1));
  const missed = new Set<number>(DEMO_MISSED_DAY_INDEXES);

  // ---- Pass 1: minutes outdoors for every day in the span ----
  // Weekends run higher than weekdays (a realistic rhythm, not a factor
  // the engine is told about), and the final DEMO_DECLINE_DAYS days drop
  // sharply — a real "went out much less this week" stretch.
  const minutes: number[] = [];
  for (let i = 0; i < DEMO_SPAN_DAYS; i++) {
    const date = addDays(startDate, i);
    const dow = new Date(date + "T00:00:00").getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dow === 0 || dow === 6;
    let base = isWeekend ? 75 : 35;
    if (i >= DEMO_SPAN_DAYS - DEMO_DECLINE_DAYS) base *= 0.3;
    let m = base + normal(rng, 0, 20);
    m = clamp(m, 0, 160);
    m = Math.round(m / 5) * 5;
    minutes.push(m);
  }

  // ---- Pass 2: mood (same-day effect) and energy (next-day effect) ----
  // Coefficients tuned so mood@lag0 and energy@lag1 clear the "strong"
  // confidence bar over this span, while mood@lag1 and energy@lag0 stay
  // clearly null — verified in engine.test.ts against these exact planted
  // relationships.
  const mood: number[] = [];
  const energy: number[] = [];
  for (let i = 0; i < DEMO_SPAN_DAYS; i++) {
    const mo = clamp(3 + 0.038 * (minutes[i] - 45) + normal(rng, 0, 0.6), 1, 5);
    mood.push(Math.round(mo));

    const prevMinutes = i > 0 ? minutes[i - 1] : minutes[i];
    const en = clamp(3 + 0.024 * (prevMinutes - 45) + normal(rng, 0, 0.8), 1, 5);
    energy.push(Math.round(en));
  }

  // ---- Pass 3: category + location text (cosmetic, not fed to the engine) ----
  const entries: Entry[] = [];
  for (let i = 0; i < DEMO_SPAN_DAYS; i++) {
    if (missed.has(i)) continue;
    const date = addDays(startDate, i);
    const dow = new Date(date + "T00:00:00").getDay();
    const isWeekend = dow === 0 || dow === 6;
    const m = minutes[i];

    let category: OutdoorCategory | null = null;
    let location = "";
    if (m > 0) {
      if (isWeekend) {
        if (rng() < 0.65) {
          category = "park";
          location = pick(rng, PARK_PLACES);
        } else {
          category = "trail_or_forest";
          location = pick(rng, TRAIL_PLACES);
        }
      } else if (rng() < 0.2) {
        category = "water_or_beach";
        location = pick(rng, WATER_PLACES);
      } else if (rng() < 0.55) {
        category = "yard_or_neighborhood";
        location = pick(rng, YARD_PLACES);
      } else {
        category = "other_outdoor";
        location = pick(rng, OTHER_PLACES);
      }
    }

    entries.push({
      id: `demo-${date}`,
      date,
      createdAt: `${date}T19:00:00.000Z`,
      source: "demo",
      minutesOutdoors: m,
      category,
      location,
      mood: mood[i],
      energy: energy[i],
      note: NOTES[i % NOTES.length],
    });
  }

  return entries;
}
