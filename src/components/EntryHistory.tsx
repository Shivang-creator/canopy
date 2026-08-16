"use client";

import { useState } from "react";
import type { Entry } from "@/lib/domain";
import { CATEGORY_LABEL } from "@/lib/domain";
import { formatDay } from "@/lib/dates";

export function EntryHistory({ entries }: { entries: Entry[] }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const visible = showAll ? sorted : sorted.slice(0, 6);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border p-5 sm:p-6"
      style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
      aria-labelledby="history-heading"
    >
      <h2 id="history-heading" className="font-display text-xl mb-3" style={{ color: "var(--ink)" }}>
        Log
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ color: "var(--ink-faint)" }}>
              <th className="text-left font-normal pb-2 pr-3">Date</th>
              <th className="text-left font-normal pb-2 pr-3">Outdoors</th>
              <th className="text-left font-normal pb-2 pr-3">Where</th>
              <th className="text-left font-normal pb-2 pr-3">Mood</th>
              <th className="text-left font-normal pb-2">Energy</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="py-2 pr-3 font-data whitespace-nowrap" style={{ color: "var(--ink)" }}>
                  {formatDay(e.date)}
                </td>
                <td className="py-2 pr-3 font-data" style={{ color: "var(--ink)" }}>
                  {e.minutesOutdoors}m
                </td>
                <td className="py-2 pr-3" style={{ color: "var(--ink-muted)" }}>
                  {e.location || (e.category ? CATEGORY_LABEL[e.category] : e.minutesOutdoors === 0 ? "—" : "unspecified")}
                </td>
                <td className="py-2 pr-3" style={{ color: "var(--ink)" }}>
                  {e.mood}/5
                </td>
                <td className="py-2" style={{ color: "var(--ink)" }}>
                  {e.energy}/5
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-sm underline decoration-dotted mt-3 cursor-pointer"
          style={{ color: "var(--ink-muted)" }}
        >
          {showAll ? "Show fewer" : `Show all ${sorted.length} entries`}
        </button>
      )}
    </section>
  );
}
