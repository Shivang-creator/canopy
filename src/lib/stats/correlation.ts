/**
 * Correlation, group-difference and multiple-comparison machinery.
 *
 * Adapted from Skin Diary
 * (`~/Projects/skin-diary/src/lib/stats/correlation.ts`). `mean`,
 * `variance`, `stdDev`, `median`, `pearson`, `rank`, `spearman`,
 * `correlationTest`, `welchTTest`, `benjaminiHochberg` and
 * `classifyConfidence` are carried over essentially verbatim — they are
 * general-purpose statistics with nothing skin-specific about them.
 * `partialCorrelation` (Skin Diary's photo-brightness confound check) was
 * dropped: Canopy has no equivalent confound signal to control for, so
 * keeping unused code around would just be noise. See the Canopy README
 * for the full credit and what changed.
 *
 * Every number Canopy shows a user comes out of this file. It is
 * deliberately plain, deterministic and dependency-free: no model, no
 * LLM, no randomness. Given the same diary you get the same answer, and
 * anyone can read the arithmetic.
 */

import { studentTTwoTailed } from "./distributions";

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Sample variance (n-1 denominator). */
export function variance(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / (n - 1);
}

export function stdDev(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

/* ------------------------------------------------------------------ */
/* Pearson & Spearman                                                  */
/* ------------------------------------------------------------------ */

/** Pearson product-moment correlation coefficient. */
export function pearson(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length) {
    throw new Error("pearson: arrays must be the same length");
  }
  const n = xs.length;
  if (n < 2) return NaN;

  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const denom = Math.sqrt(sxx * syy);
  // Zero variance in either series: correlation is undefined, not zero.
  if (denom === 0) return NaN;
  return sxy / denom;
}

/**
 * Fractional ranks with ties averaged — the standard "midrank" treatment
 * Spearman requires.
 */
export function rank(xs: number[]): number[] {
  const idx = xs.map((v, i) => ({ v, i }));
  idx.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(xs.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].v === idx[i].v) j++;
    // Ranks are 1-based; average the block [i..j].
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[idx[k].i] = avg;
    i = j + 1;
  }
  return ranks;
}

/**
 * Spearman's rank correlation.
 *
 * Canopy's default, for the same reason it was Skin Diary's default:
 * self-reported minutes and 1-5 mood/energy ratings are coarse and
 * occasionally spiky (one big hike day). Rank correlation is robust to
 * those outliers and picks up monotone-but-not-linear relationships,
 * which is what "more time outside tends to go with better mood" actually
 * means.
 */
export function spearman(xs: number[], ys: number[]): number {
  return pearson(rank(xs), rank(ys));
}

export interface CorrelationResult {
  r: number;
  /** Number of paired observations. */
  n: number;
  t: number;
  /** Two-tailed p-value. */
  p: number;
  df: number;
}

/**
 * Significance test for a correlation coefficient, via
 * t = r * sqrt((n-2) / (1 - r^2)) on n-2 degrees of freedom.
 */
export function correlationTest(r: number, n: number): CorrelationResult {
  const df = n - 2;
  if (!Number.isFinite(r) || df < 1) {
    return { r, n, t: NaN, p: NaN, df };
  }
  if (Math.abs(r) >= 1) {
    // Perfect correlation: t is infinite, p is 0.
    return { r, n, t: Infinity * Math.sign(r), p: 0, df };
  }
  const t = r * Math.sqrt(df / (1 - r * r));
  return { r, n, t, p: studentTTwoTailed(t, df), df };
}

/* ------------------------------------------------------------------ */
/* Group differences                                                   */
/* ------------------------------------------------------------------ */

export interface WelchResult {
  meanA: number;
  meanB: number;
  /** meanA - meanB. */
  diff: number;
  nA: number;
  nB: number;
  t: number;
  df: number;
  p: number;
  /** Cohen's d using the pooled standard deviation. */
  cohensD: number;
}

/**
 * Welch's unequal-variance t-test.
 *
 * Used for Canopy's binary factor — "did you spend any time outdoors
 * today?" — comparing mood/energy on outdoor days against none-logged
 * days. Welch rather than Student because the two groups in a real diary
 * are essentially never the same size or the same variance.
 */
export function welchTTest(a: number[], b: number[]): WelchResult {
  const nA = a.length;
  const nB = b.length;
  const meanA = mean(a);
  const meanB = mean(b);
  const varA = variance(a);
  const varB = variance(b);

  const base: WelchResult = {
    meanA,
    meanB,
    diff: meanA - meanB,
    nA,
    nB,
    t: NaN,
    df: NaN,
    p: NaN,
    cohensD: NaN,
  };
  if (nA < 2 || nB < 2) return base;

  const se2 = varA / nA + varB / nB;
  if (se2 <= 0) return base;

  const t = (meanA - meanB) / Math.sqrt(se2);

  // Welch-Satterthwaite degrees of freedom.
  const df =
    (se2 * se2) /
    ((varA * varA) / (nA * nA * (nA - 1)) + (varB * varB) / (nB * nB * (nB - 1)));

  const pooledSd = Math.sqrt(
    ((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2),
  );
  const cohensD = pooledSd > 0 ? (meanA - meanB) / pooledSd : NaN;

  return { ...base, t, df, p: studentTTwoTailed(t, df), cohensD };
}

/* ------------------------------------------------------------------ */
/* Multiple comparisons                                                */
/* ------------------------------------------------------------------ */

/**
 * Benjamini-Hochberg false discovery rate correction.
 *
 * Canopy tests outdoor minutes against two outcomes (mood, energy) at two
 * lags (same day, next day), plus two outdoor-vs-none group comparisons —
 * six hypotheses from one diary. That is a smaller family than Skin
 * Diary's 147, but the same problem applies at any size: at p < 0.05,
 * roughly one in twenty tests looks "significant" from pure noise.
 * Reporting raw p-values would risk telling a user their mood tracks
 * outdoor time because the dice landed that way.
 *
 * Returns BH-adjusted q-values in the same order as the input, computed
 * with the standard monotonicity enforcement (running minimum from the
 * largest p downward).
 */
export function benjaminiHochberg(pValues: number[]): number[] {
  const valid = pValues
    .map((p, i) => ({ p, i }))
    .filter((e) => Number.isFinite(e.p));

  const m = valid.length;
  const q = new Array<number>(pValues.length).fill(NaN);
  if (m === 0) return q;

  valid.sort((a, b) => a.p - b.p);

  let running = 1;
  for (let k = m - 1; k >= 0; k--) {
    const raw = (valid[k].p * m) / (k + 1);
    running = Math.min(running, raw);
    q[valid[k].i] = running;
  }
  return q;
}

/* ------------------------------------------------------------------ */
/* Effect size labelling                                               */
/* ------------------------------------------------------------------ */

export type Confidence =
  | "insufficient"
  | "none"
  | "weak"
  | "moderate"
  | "strong";

/**
 * The honesty gate.
 *
 * A correlation over four data points is noise. This function is the
 * single place that decides how loudly Canopy is allowed to speak, and it
 * refuses to say anything at all below `minN` observations no matter how
 * large the coefficient looks.
 */
export function classifyConfidence(
  r: number,
  n: number,
  q: number,
  minN = 8,
): Confidence {
  if (!Number.isFinite(r) || n < minN) return "insufficient";
  if (!Number.isFinite(q) || q >= 0.1) return "none";
  const abs = Math.abs(r);
  if (q < 0.05 && abs >= 0.5) return "strong";
  if (abs >= 0.3) return "moderate";
  return "weak";
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  insufficient: "Not enough data",
  none: "No clear signal",
  weak: "Weak signal",
  moderate: "Moderate signal",
  strong: "Strong signal",
};
