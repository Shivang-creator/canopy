/**
 * The insight engine.
 *
 * Adapted from Skin Diary's `~/Projects/skin-diary/src/lib/analysis/engine.ts`.
 * The shape is the same — build (factor, outcome, lag) pairs from real
 * calendar dates, test each, correct the whole family with
 * Benjamini-Hochberg, and gate every claim on sample size — but Canopy's
 * domain is much smaller: ONE logged factor (minutes spent outdoors)
 * against TWO outcomes (mood, energy) at TWO lags (same day, next day),
 * plus two "did you go outside at all" group comparisons. Where Skin
 * Diary searches 147 hypotheses across 7 factors, Canopy searches at most
 * 6. The dropped machinery (photo-brightness confound checks, product
 * change-point tests, per-factor grids) doesn't have a Canopy equivalent,
 * so it was not carried over. See the Canopy README for the full credit.
 *
 * The same three rules apply, for the same reason:
 *
 *   1. NO LLM, NO MODEL, NO RANDOMNESS. Every number is arithmetic you
 *      can follow by hand. The same diary always produces the same
 *      findings, and a user can check our working.
 *
 *   2. EVERY CLAIM CARRIES ITS SAMPLE SIZE. A finding over 9 days and a
 *      finding over 40 days do not get to look alike on screen.
 *
 *   3. WE COUNT OUR OWN TESTS. Two metrics x two lags x one group check
 *      each is up to 6 hypotheses. Every p-value is Benjamini-Hochberg
 *      corrected across the family actually run, and the family size is
 *      shown to the user.
 */

import {
  METRICS,
  METRIC_LABEL,
  type Entry,
  type MetricId,
} from "../domain";
import { addDays, daysBetween, type DayKey } from "../dates";
import {
  benjaminiHochberg,
  classifyConfidence,
  correlationTest,
  mean,
  spearman,
  stdDev,
  welchTTest,
  type Confidence,
} from "../stats/correlation";

/* ------------------------------------------------------------------ */
/* Tunables — stated here so they can be shown in the UI                */
/* ------------------------------------------------------------------ */

export const ANALYSIS_CONFIG = {
  /** Lags tested, in days. Minutes outdoors on day D is matched to
   * mood/energy on day D+lag. */
  lags: [0, 1] as const,
  /** Below this many paired observations we refuse to report a finding.
   * This is the number the acceptance criteria mean by "never overclaims
   * on small n" — nothing is graded above "insufficient" below it. */
  minPairedObservations: 8,
  /** Minimum observations in EACH group of the outdoors-vs-none test. */
  minGroupObservations: 4,
  /** BH false-discovery-rate threshold used for the "signal" cutoff. */
  fdr: 0.1,
  /** Window size (days) used for the recent-vs-prior trend check that
   * decides whether to surface nearby green space as a nudge. */
  trendWindowDays: 7,
  /** Minimum observations in EACH window of the trend check. */
  minTrendObservations: 4,
} as const;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Finding {
  id: string;
  metricId: MetricId;
  lag: number;
  kind: "correlation" | "group";
  /** Paired observations backing this finding. Always displayed. */
  n: number;
  /** Spearman rho for correlations; Cohen's d for group differences. */
  effect: number;
  /** Raw two-tailed p-value. */
  p: number;
  /** Benjamini-Hochberg corrected q-value across the whole family. */
  q: number;
  confidence: Confidence;
  /** Positive = the metric is HIGHER with more outdoor time. */
  direction: 1 | -1 | 0;
  /** Plain-language claim. Template-generated, never model-generated. */
  sentence: string;
  /** The arithmetic behind the claim. */
  detail: string;
  groups?: { outMean: number; noneMean: number; nOut: number; nNone: number };
}

export interface MetricSeries {
  metricId: MetricId;
  points: Array<{ date: DayKey; value: number }>;
  mean: number;
  sd: number;
  n: number;
}

export interface TrendSignal {
  /** Whether both windows had enough data to compare at all. */
  computable: boolean;
  recentMean: number;
  priorMean: number;
  recentN: number;
  priorN: number;
  /** True only when computable AND recent minutes are meaningfully below
   * prior minutes (>15% relative drop). This is what triggers the
   * "here's a real park nearby" nudge in the UI. */
  declining: boolean;
}

export interface DataQuality {
  entryCount: number;
  firstDate: DayKey | null;
  lastDate: DayKey | null;
  spanDays: number;
  missedDays: number;
  warnings: string[];
}

export interface AnalysisResult {
  series: MetricSeries[];
  outdoorSeries: MetricSeries;
  findings: Finding[];
  trend: TrendSignal;
  quality: DataQuality;
  /** How many hypotheses were tested — shown to the user. */
  hypothesesTested: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function byDate(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function indexByDate(entries: Entry[]): Map<DayKey, Entry> {
  const m = new Map<DayKey, Entry>();
  for (const e of entries) m.set(e.date, e);
  return m;
}

function lagPhrase(lag: number): string {
  if (lag === 0) return "the same day";
  return lag === 1 ? "the next day" : `${lag} days later`;
}

function fmt(n: number, dp = 1): string {
  return Number.isFinite(n) ? n.toFixed(dp) : "—";
}

function fmtSigned(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(dp)}`;
}

function fmtP(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.001) return "< 0.001";
  return p.toFixed(3);
}

/**
 * Build (minutes outdoors on day D, metric on day D+lag) pairs.
 *
 * Uses real calendar dates rather than array positions, so a gap in the
 * diary never silently shifts a "next day" comparison onto the wrong day.
 */
function buildPairs(
  entries: Entry[],
  byDay: Map<DayKey, Entry>,
  metricId: MetricId,
  lag: number,
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];

  for (const e of entries) {
    const target = lag === 0 ? e : byDay.get(addDays(e.date, lag));
    if (!target) continue;
    const y = target[metricId];
    if (typeof y !== "number" || !Number.isFinite(y)) continue;
    xs.push(e.minutesOutdoors);
    ys.push(y);
  }
  return { xs, ys };
}

/* ------------------------------------------------------------------ */
/* Main entry point                                                    */
/* ------------------------------------------------------------------ */

export function analyse(rawEntries: Entry[]): AnalysisResult {
  const entries = byDate(rawEntries);
  const byDay = indexByDate(entries);

  /* ---------------- Series (for the sparkline) ---------------- */

  const outdoorSeries: MetricSeries = (() => {
    const points = entries.map((e) => ({ date: e.date, value: e.minutesOutdoors }));
    const values = points.map((p) => p.value);
    return { metricId: "mood", points, mean: mean(values), sd: stdDev(values), n: values.length };
  })();

  const series: MetricSeries[] = METRICS.map((metricId) => {
    const points = entries.map((e) => ({ date: e.date, value: e[metricId] }));
    const values = points.map((p) => p.value);
    return { metricId, points, mean: mean(values), sd: stdDev(values), n: values.length };
  });

  /* ---------------- Candidates: correlation + group ---------------- */

  interface Candidate {
    metricId: MetricId;
    lag: number;
    kind: "correlation" | "group";
    n: number;
    effect: number;
    p: number;
    groups?: Finding["groups"];
  }

  const candidates: Candidate[] = [];

  for (const metricId of METRICS) {
    for (const lag of ANALYSIS_CONFIG.lags) {
      const { xs, ys } = buildPairs(entries, byDay, metricId, lag);
      if (xs.length < ANALYSIS_CONFIG.minPairedObservations) continue;
      const r = spearman(xs, ys);
      if (!Number.isFinite(r)) continue;
      const test = correlationTest(r, xs.length);
      if (!Number.isFinite(test.p)) continue;
      candidates.push({ metricId, lag, kind: "correlation", n: xs.length, effect: r, p: test.p });
    }

    // Group comparison, lag 0 only: "any outdoor time logged" vs "none".
    const { xs, ys } = buildPairs(entries, byDay, metricId, 0);
    const yOut = ys.filter((_, i) => xs[i] > 0);
    const yNone = ys.filter((_, i) => xs[i] === 0);
    if (
      yOut.length >= ANALYSIS_CONFIG.minGroupObservations &&
      yNone.length >= ANALYSIS_CONFIG.minGroupObservations
    ) {
      const w = welchTTest(yOut, yNone);
      if (Number.isFinite(w.p)) {
        candidates.push({
          metricId,
          lag: 0,
          kind: "group",
          n: yOut.length + yNone.length,
          effect: w.cohensD,
          p: w.p,
          groups: { outMean: w.meanA, noneMean: w.meanB, nOut: w.nA, nNone: w.nB },
        });
      }
    }
  }

  // One BH family across every test we ran — the honest denominator.
  const qs = benjaminiHochberg(candidates.map((c) => c.p));

  const findings: Finding[] = candidates.map((c, i) => {
    const q = qs[i];
    // Group differences are graded on Cohen's d, correlations on rho; d
    // can exceed 1, so it's scaled onto comparable footing for the gate.
    const gradeEffect = c.kind === "group" ? Math.tanh(Math.abs(c.effect) / 2) : c.effect;
    const confidence = classifyConfidence(gradeEffect, c.n, q, ANALYSIS_CONFIG.minPairedObservations);
    const direction = c.effect > 0 ? 1 : c.effect < 0 ? -1 : 0;
    const metric = METRIC_LABEL[c.metricId];

    let sentence: string;
    let detail: string;

    if (c.kind === "group" && c.groups) {
      const g = c.groups;
      const higher = g.outMean > g.noneMean;
      sentence = `Your ${metric.toLowerCase()} is ${fmt(Math.abs(g.outMean - g.noneMean))} points ${
        higher ? "higher" : "lower"
      } on days with any outdoor time logged, versus none.`;
      detail = `Outdoors: ${fmt(g.outMean)} (n = ${g.nOut}) vs none: ${fmt(g.noneMean)} (n = ${
        g.nNone
      }) · Welch p = ${fmtP(c.p)} · corrected q = ${fmtP(q)} · Cohen's d = ${fmtSigned(c.effect)}`;
    } else {
      const more = c.effect > 0 ? "higher" : "lower";
      sentence = `Your ${metric.toLowerCase()} tends to be ${more} ${lagPhrase(
        c.lag,
      )} after more time outdoors.`;
      detail = `Spearman ρ = ${fmtSigned(c.effect)} across ${c.n} paired days · p = ${fmtP(
        c.p,
      )} · corrected q = ${fmtP(q)}`;
    }

    return {
      id: `${c.metricId}:${c.lag}:${c.kind}`,
      metricId: c.metricId,
      lag: c.lag,
      kind: c.kind,
      n: c.n,
      effect: c.effect,
      p: c.p,
      q,
      confidence,
      direction,
      sentence,
      detail,
      groups: c.groups,
    };
  });

  /* ---------------- Trend (drives the "go here" nudge) ---------------- */

  const trend = computeTrend(entries);

  /* ---------------- Data quality ---------------- */

  const quality = assessQuality(entries);

  return {
    series,
    outdoorSeries,
    findings: rankFindings(findings),
    trend,
    quality,
    hypothesesTested: candidates.length,
  };
}

const CONFIDENCE_RANK: Record<Confidence, number> = {
  strong: 4,
  moderate: 3,
  weak: 2,
  none: 1,
  insufficient: 0,
};

export function rankConfidence(c: Confidence): number {
  return CONFIDENCE_RANK[c];
}

/**
 * Order findings for display: strongest evidence first, then largest
 * effect. Deliberately NOT sorted by effect size alone — a large
 * coefficient over nine days should not outrank a modest one over forty.
 */
function rankFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const c = rankConfidence(b.confidence) - rankConfidence(a.confidence);
    if (c !== 0) return c;
    const e = Math.abs(b.effect) - Math.abs(a.effect);
    if (Math.abs(e) > 1e-9) return e;
    return a.q - b.q;
  });
}

/** Findings worth putting at the top of the payoff screen. */
export function headlineFindings(result: AnalysisResult, limit = 3): Finding[] {
  return result.findings
    .filter((f) => f.confidence === "strong" || f.confidence === "moderate")
    .slice(0, limit);
}

function computeTrend(entries: Entry[]): TrendSignal {
  const n = entries.length;
  const w = ANALYSIS_CONFIG.trendWindowDays;
  if (n < ANALYSIS_CONFIG.minTrendObservations * 2) {
    return { computable: false, recentMean: NaN, priorMean: NaN, recentN: 0, priorN: 0, declining: false };
  }
  const recent = entries.slice(-w);
  const prior = entries.slice(Math.max(0, entries.length - 2 * w), entries.length - w);
  if (
    recent.length < ANALYSIS_CONFIG.minTrendObservations ||
    prior.length < ANALYSIS_CONFIG.minTrendObservations
  ) {
    return { computable: false, recentMean: NaN, priorMean: NaN, recentN: recent.length, priorN: prior.length, declining: false };
  }
  const recentMean = mean(recent.map((e) => e.minutesOutdoors));
  const priorMean = mean(prior.map((e) => e.minutesOutdoors));
  // "Declining" requires prior activity to have actually existed (avoid
  // divide-by-zero reading a flat zero baseline as a "decline") and a
  // drop of more than 15% relative to it.
  const declining = priorMean > 5 && recentMean < priorMean * 0.85;
  return { computable: true, recentMean, priorMean, recentN: recent.length, priorN: prior.length, declining };
}

function assessQuality(entries: Entry[]): DataQuality {
  const warnings: string[] = [];
  const n = entries.length;
  const firstDate = n ? entries[0].date : null;
  const lastDate = n ? entries[n - 1].date : null;
  const spanDays = firstDate && lastDate ? daysBetween(firstDate, lastDate) + 1 : 0;
  const missedDays = Math.max(0, spanDays - n);

  if (n < ANALYSIS_CONFIG.minPairedObservations) {
    warnings.push(
      `Only ${n} ${n === 1 ? "entry" : "entries"} so far. Canopy will not report any correlation until it has at least ${ANALYSIS_CONFIG.minPairedObservations}.`,
    );
  }
  if (missedDays > 0 && spanDays > 0) {
    warnings.push(
      `${missedDays} of the last ${spanDays} days have no entry. Gaps weaken the next-day comparisons most.`,
    );
  }

  return { entryCount: n, firstDate, lastDate, spanDays, missedDays, warnings };
}
