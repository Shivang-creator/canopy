"use client";

export function DemoBanner({ entryCount, onStartRealLog }: { entryCount: number; onStartRealLog: () => void }) {
  return (
    <div
      className="rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
      style={{ background: "var(--amber-wash)", borderColor: "var(--amber)" }}
    >
      <span style={{ color: "var(--ink)" }}>
        <strong>Demo diary</strong> — {entryCount} generated days, clearly labelled, not your data. It exists so
        the correlation and green-space panels have something honest to show on first load.
      </span>
      <button
        type="button"
        onClick={onStartRealLog}
        className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer"
        style={{ background: "var(--canopy)", color: "var(--bg-raised)" }}
      >
        Start my real log →
      </button>
    </div>
  );
}
