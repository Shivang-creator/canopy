import { describe, it, expect } from "vitest";
import { analyse, rankConfidence, ANALYSIS_CONFIG } from "./engine";
import {
  buildDemoEntries,
  PLANTED_SIGNALS,
  NULL_RELATIONSHIPS,
  DEMO_SPAN_DAYS,
  DEMO_MISSED_DAY_INDEXES,
} from "../demo/seed";
import type { Entry } from "../domain";
import { addDays } from "../dates";

/**
 * Ground-truth tests, not snapshot tests — same discipline as Skin
 * Diary's engine.test.ts (this suite is adapted from it; see the README
 * for the credit).
 *
 * The demo diary is generated from a documented set of planted
 * relationships (PLANTED_SIGNALS) plus two relationships with
 * deliberately NO effect (NULL_RELATIONSHIPS). The engine is given no
 * knowledge of either table. So these assertions check the two things
 * that actually matter in a product that reports a correlation to a
 * real person:
 *
 *   1. It finds what is really there.
 *   2. It does NOT find what is not there.
 */

const FIXED_END = "2026-08-16";

function makeEntry(date: string, overrides: Partial<Entry> = {}): Entry {
  return {
    id: `t-${date}`,
    date,
    createdAt: `${date}T09:00:00.000Z`,
    source: "user",
    minutesOutdoors: 0,
    category: null,
    location: "",
    mood: 3,
    energy: 3,
    note: "",
    ...overrides,
  };
}

describe("demo diary generation", () => {
  it("is deterministic — same input, same diary, every time", () => {
    const a = buildDemoEntries(FIXED_END);
    const b = buildDemoEntries(FIXED_END);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("produces a six-week diary with realistic gaps", () => {
    const e = buildDemoEntries(FIXED_END);
    expect(e.length).toBe(DEMO_SPAN_DAYS - DEMO_MISSED_DAY_INDEXES.length);
    expect(e[e.length - 1].date).toBe(FIXED_END);
    expect(e[0].date).toBe(addDays(FIXED_END, -(DEMO_SPAN_DAYS - 1)));
  });

  it("gives every entry mood and energy ratings in range", () => {
    for (const entry of buildDemoEntries(FIXED_END)) {
      expect(entry.mood).toBeGreaterThanOrEqual(1);
      expect(entry.mood).toBeLessThanOrEqual(5);
      expect(entry.energy).toBeGreaterThanOrEqual(1);
      expect(entry.energy).toBeLessThanOrEqual(5);
      expect(entry.minutesOutdoors).toBeGreaterThanOrEqual(0);
    }
  });

  it("labels every demo entry as demo data", () => {
    for (const entry of buildDemoEntries(FIXED_END)) {
      expect(entry.source).toBe("demo");
    }
  });
});

describe("analysis of the demo diary", () => {
  const entries = buildDemoEntries(FIXED_END);
  const result = analyse(entries);

  it("reports how many hypotheses it actually tested", () => {
    // 2 metrics x 2 lags (correlation) + 2 metrics x 1 group comparison
    // = up to 6, less anything that fails the minimum-n gate.
    expect(result.hypothesesTested).toBeGreaterThan(0);
    expect(result.hypothesesTested).toBeLessThanOrEqual(6);
  });

  it("recovers the planted signals, in the right direction, at the right lag", () => {
    for (const planted of PLANTED_SIGNALS) {
      const found = result.findings.find(
        (f) => f.metricId === planted.metricId && f.lag === planted.lag && f.kind === "correlation",
      );
      expect(found, `${planted.metricId}@lag${planted.lag}`).toBeDefined();
      expect(
        Math.sign(found!.effect),
        `${planted.metricId}@lag${planted.lag} direction`,
      ).toBe(planted.direction);
      expect(
        found!.confidence === "strong" || found!.confidence === "moderate",
        `${planted.metricId}@lag${planted.lag} should clear the confidence bar, got ${found!.confidence} (r=${found!.effect}, n=${found!.n})`,
      ).toBe(true);
    }
  });

  it("invents NOTHING for the relationships planted with no real effect", () => {
    // This is the assertion that matters most. mood@lag1 and energy@lag0
    // were generated with zero coefficient on minutes outdoors. Across
    // both, the engine must not claim a moderate-or-stronger signal.
    for (const nullRel of NULL_RELATIONSHIPS) {
      const found = result.findings.find(
        (f) => f.metricId === nullRel.metricId && f.lag === nullRel.lag && f.kind === "correlation",
      );
      if (!found) continue; // gated out entirely is also an acceptable "found nothing"
      expect(
        found.confidence === "strong" || found.confidence === "moderate",
        `${nullRel.metricId}@lag${nullRel.lag} should NOT read as a real signal, got ${found.confidence} (r=${found.effect})`,
      ).toBe(false);
    }
  });

  it("attaches a sample size to every single finding", () => {
    for (const f of result.findings) {
      expect(f.n).toBeGreaterThanOrEqual(ANALYSIS_CONFIG.minGroupObservations);
      expect(f.detail).toMatch(/n = \d+|paired days/);
    }
  });

  it("detects the planted decline in the final stretch", () => {
    expect(result.trend.computable).toBe(true);
    expect(result.trend.declining).toBe(true);
    expect(result.trend.recentMean).toBeLessThan(result.trend.priorMean);
    expect(result.trend.recentN).toBeGreaterThan(0);
    expect(result.trend.priorN).toBeGreaterThan(0);
  });

  it("notices the gaps in the diary", () => {
    expect(result.quality.entryCount).toBe(DEMO_SPAN_DAYS - DEMO_MISSED_DAY_INDEXES.length);
    expect(result.quality.spanDays).toBe(DEMO_SPAN_DAYS);
    expect(result.quality.missedDays).toBe(DEMO_MISSED_DAY_INDEXES.length);
  });

  it("ranks strong findings ahead of weaker ones", () => {
    for (let i = 1; i < result.findings.length; i++) {
      expect(
        rankConfidence(result.findings[i - 1].confidence),
      ).toBeGreaterThanOrEqual(rankConfidence(result.findings[i].confidence));
    }
  });

  it("builds a series for both metrics and outdoor minutes, in date order", () => {
    expect(result.series).toHaveLength(2);
    for (const s of result.series) {
      const dates = s.points.map((p) => p.date);
      expect([...dates].sort()).toEqual(dates);
    }
    expect(result.outdoorSeries.points.length).toBe(result.quality.entryCount);
  });
});

describe("small and degenerate diaries", () => {
  it("reports nothing at all from a single entry", () => {
    const r = analyse([makeEntry("2026-08-16", { minutesOutdoors: 40, mood: 4 })]);
    expect(r.findings).toHaveLength(0);
    expect(r.hypothesesTested).toBe(0);
    expect(r.quality.entryCount).toBe(1);
    expect(r.quality.warnings.join(" ")).toContain("Only 1 entry");
    expect(r.trend.computable).toBe(false);
  });

  it("reports nothing from an empty diary without throwing", () => {
    const r = analyse([]);
    expect(r.findings).toHaveLength(0);
    expect(r.quality.entryCount).toBe(0);
    expect(r.quality.spanDays).toBe(0);
    expect(r.series.every((s) => s.n === 0)).toBe(true);
  });

  it("refuses to correlate below the minimum sample size", () => {
    // Seven days of a perfect, noiseless relationship -- still not enough.
    // This is the exact scenario the acceptance criteria describe: a
    // small n must never be allowed to look confident.
    const entries: Entry[] = [];
    for (let i = 0; i < 7; i++) {
      entries.push(
        makeEntry(addDays("2026-08-01", i), {
          minutesOutdoors: 10 + i * 10,
          mood: 1 + Math.min(4, i),
        }),
      );
    }
    const r = analyse(entries);
    expect(
      r.findings.filter((f) => f.confidence !== "insufficient"),
    ).toHaveLength(0);
  });

  it("aligns lags by calendar date, not by array position", () => {
    // A diary with a hole in it. If lag-1 were computed by array index,
    // the 2nd and 3rd logged entries would be wrongly treated as
    // consecutive days.
    const entries: Entry[] = [
      makeEntry("2026-08-01", { minutesOutdoors: 10, mood: 2 }),
      makeEntry("2026-08-02", { minutesOutdoors: 20, mood: 3 }),
      // 2026-08-03 deliberately missing
      makeEntry("2026-08-04", { minutesOutdoors: 30, mood: 4 }),
    ];
    const r = analyse(entries);
    // Not enough data to report, but the pairing logic must not crash and
    // must not manufacture a pair across the gap.
    expect(r.quality.missedDays).toBe(1);
    expect(r.quality.spanDays).toBe(4);
    expect(r.hypothesesTested).toBe(0);
  });

  it("survives entries with a flat metric (zero variance) without crashing", () => {
    const entries: Entry[] = [];
    for (let i = 0; i < 20; i++) {
      entries.push(
        makeEntry(addDays("2026-08-01", i), {
          minutesOutdoors: i % 3 === 0 ? 0 : 10 + i,
          mood: 3, // perfectly flat — correlation is undefined, not zero
        }),
      );
    }
    expect(() => analyse(entries)).not.toThrow();
    const r = analyse(entries);
    const moodFindings = r.findings.filter((f) => f.metricId === "mood" && f.kind === "correlation");
    expect(moodFindings).toHaveLength(0);
  });

  it("does not report a group comparison below the minimum per-group size", () => {
    // 20 outdoor days, only 2 "none" days -- below minGroupObservations.
    const entries: Entry[] = [];
    for (let i = 0; i < 22; i++) {
      entries.push(
        makeEntry(addDays("2026-08-01", i), {
          minutesOutdoors: i < 2 ? 0 : 30,
          mood: i < 2 ? 2 : 4,
        }),
      );
    }
    const r = analyse(entries);
    expect(r.findings.some((f) => f.kind === "group" && f.metricId === "mood")).toBe(false);
  });
});
