"use client";

import { useState } from "react";
import type { AnalysisResult, Finding } from "@/lib/analysis/engine";
import { ANALYSIS_CONFIG } from "@/lib/analysis/engine";
import { CONFIDENCE_LABEL } from "@/lib/stats/correlation";
import { TreeRing } from "./TreeRing";

function FindingRow({ f }: { f: Finding }) {
  return (
    <li className="flex items-start gap-4 py-4 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <TreeRing n={f.n} confidence={f.confidence} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-medium" style={{ color: "var(--ink)" }}>
            {f.sentence}
          </span>
          <span
            className="text-xs font-data px-1.5 py-0.5 rounded"
            style={{
              color:
                f.confidence === "strong" || f.confidence === "moderate"
                  ? "var(--canopy-strong)"
                  : f.confidence === "weak"
                    ? "var(--amber)"
                    : "var(--ink-faint)",
              background: "var(--bg-sunken)",
            }}
          >
            {CONFIDENCE_LABEL[f.confidence]}
          </span>
        </div>
        <p className="font-data text-xs mt-1" style={{ color: "var(--ink-faint)" }}>
          {f.detail}
        </p>
      </div>
    </li>
  );
}

export function SignalPanel({ result }: { result: AnalysisResult }) {
  const [showAll, setShowAll] = useState(false);
  const headline = result.findings.filter((f) => f.confidence === "strong" || f.confidence === "moderate");
  const rest = result.findings.filter((f) => !(f.confidence === "strong" || f.confidence === "moderate"));

  const tooLittleData = result.quality.entryCount < ANALYSIS_CONFIG.minPairedObservations;

  return (
    <section
      className="rounded-2xl border p-5 sm:p-6"
      style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
      aria-labelledby="signal-heading"
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 id="signal-heading" className="font-display text-xl" style={{ color: "var(--ink)" }}>
          Your signal
        </h2>
        <span className="font-data text-xs" style={{ color: "var(--ink-faint)" }}>
          {result.quality.entryCount} {result.quality.entryCount === 1 ? "entry" : "entries"} logged
        </span>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
        Outdoor minutes correlated against mood and energy — deterministic arithmetic, not a model. Every
        claim below states its sample size; nothing is graded above &ldquo;{CONFIDENCE_LABEL.insufficient}&rdquo; below{" "}
        {ANALYSIS_CONFIG.minPairedObservations} paired days.
      </p>

      {tooLittleData ? (
        <div
          className="rounded-xl border border-dashed p-4 text-sm"
          style={{ borderColor: "var(--border-strong)", color: "var(--ink-muted)" }}
        >
          <p className="mb-1" style={{ color: "var(--ink)" }}>
            Not enough data yet to say anything honest.
          </p>
          <p>
            {result.quality.entryCount} of {ANALYSIS_CONFIG.minPairedObservations} days logged. Canopy will not
            report a correlation before that, however clean the trend looks — a pattern over a handful of days is
            noise, not a finding.
          </p>
        </div>
      ) : headline.length > 0 ? (
        <ul className="mb-1">
          {headline.map((f) => (
            <FindingRow key={f.id} f={f} />
          ))}
        </ul>
      ) : (
        <div
          className="rounded-xl border border-dashed p-4 text-sm mb-1"
          style={{ borderColor: "var(--border-strong)", color: "var(--ink-muted)" }}
        >
          No relationship cleared the confidence bar across the {result.hypothesesTested} hypotheses tested. That
          is a real result, not a bug — it means mood and energy are not tracking outdoor time strongly enough
          (or consistently enough) in this log to say so honestly.
        </div>
      )}

      {rest.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm underline decoration-dotted cursor-pointer"
            style={{ color: "var(--ink-muted)" }}
            aria-expanded={showAll}
          >
            {showAll ? "Hide" : "Show"} all {result.hypothesesTested} hypotheses tested (including the misses)
          </button>
          {showAll && (
            <ul className="mt-2">
              {rest.map((f) => (
                <FindingRow key={f.id} f={f} />
              ))}
            </ul>
          )}
        </div>
      )}

      {result.quality.warnings.length > 0 && (
        <ul className="mt-4 space-y-1">
          {result.quality.warnings.map((w, i) => (
            <li key={i} className="text-xs flex gap-1.5" style={{ color: "var(--rust)" }}>
              <span aria-hidden>·</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
