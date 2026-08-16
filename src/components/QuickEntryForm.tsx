"use client";

import { useId, useState } from "react";
import {
  CATEGORY_LABEL,
  OUTDOOR_CATEGORIES,
  type Entry,
  type OutdoorCategory,
} from "@/lib/domain";
import { todayKey } from "@/lib/dates";

const MINUTE_CHIPS = [0, 15, 30, 45, 60, 90, 120] as const;
const RATING = [1, 2, 3, 4, 5] as const;
const MOOD_FACE = ["😞", "🙁", "😐", "🙂", "😄"];
const ENERGY_FACE = ["🪫", "🔋", "🔋", "🔋", "⚡"];

export function QuickEntryForm({
  existing,
  onSubmit,
}: {
  /** If today already has an entry, pre-fill it — logging again edits it. */
  existing?: Entry | null;
  onSubmit: (entry: Entry) => void;
}) {
  const uid = useId();
  const [minutes, setMinutes] = useState<number | null>(existing?.minutesOutdoors ?? null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(existing?.energy ?? null);
  const [category, setCategory] = useState<OutdoorCategory | null>(existing?.category ?? null);
  const [location, setLocation] = useState(existing?.location ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [expanded, setExpanded] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const effectiveMinutes = customMinutes !== "" ? Number(customMinutes) : minutes;
  const canSubmit = effectiveMinutes !== null && !Number.isNaN(effectiveMinutes) && mood !== null && energy !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || effectiveMinutes === null || mood === null || energy === null) return;

    const date = existing?.date ?? todayKey();
    const entry: Entry = {
      id: existing?.id ?? `user-${date}-${Date.now()}`,
      date,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      source: "user",
      minutesOutdoors: Math.max(0, Math.round(effectiveMinutes)),
      category,
      location: location.trim(),
      mood,
      energy,
      note: note.trim(),
    };
    onSubmit(entry);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border p-5 sm:p-6 shadow-[var(--shadow)]"
      style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
      aria-label="Log today"
    >
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>
          {existing ? "Update today" : "Log today"}
        </h2>
        <span className="font-data text-xs" style={{ color: "var(--ink-faint)" }}>
          takes ~10 seconds
        </span>
      </div>

      <fieldset className="mb-4">
        <legend className="text-sm font-medium mb-2" style={{ color: "var(--ink-muted)" }}>
          Minutes outdoors today
        </legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Minutes outdoors">
          {MINUTE_CHIPS.map((m) => (
            <button
              type="button"
              key={m}
              aria-pressed={minutes === m && customMinutes === ""}
              onClick={() => {
                setMinutes(m);
                setCustomMinutes("");
              }}
              className="px-3 py-1.5 rounded-full text-sm font-data border transition-colors cursor-pointer"
              style={
                minutes === m && customMinutes === ""
                  ? { background: "var(--canopy)", color: "var(--bg-raised)", borderColor: "var(--canopy)" }
                  : { background: "transparent", color: "var(--ink)", borderColor: "var(--border-strong)" }
              }
            >
              {m === 0 ? "none" : `${m}m`}
            </button>
          ))}
          <input
            type="number"
            min={0}
            max={1440}
            inputMode="numeric"
            placeholder="other"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            aria-label="Custom minutes outdoors"
            className="w-20 px-3 py-1.5 rounded-full text-sm font-data border"
            style={{ background: "transparent", borderColor: "var(--border-strong)", color: "var(--ink)" }}
          />
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <fieldset>
          <legend className="text-sm font-medium mb-2" style={{ color: "var(--ink-muted)" }}>
            Mood
          </legend>
          <div className="flex gap-1" role="group" aria-label="Mood, 1 to 5">
            {RATING.map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={mood === v}
                aria-label={`Mood ${v} of 5`}
                onClick={() => setMood(v)}
                className="flex-1 aspect-square rounded-lg text-lg border transition-colors cursor-pointer"
                style={
                  mood === v
                    ? { background: "var(--canopy-wash)", borderColor: "var(--canopy-bright)" }
                    : { background: "transparent", borderColor: "var(--border-strong)" }
                }
              >
                {MOOD_FACE[v - 1]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium mb-2" style={{ color: "var(--ink-muted)" }}>
            Energy
          </legend>
          <div className="flex gap-1" role="group" aria-label="Energy, 1 to 5">
            {RATING.map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={energy === v}
                aria-label={`Energy ${v} of 5`}
                onClick={() => setEnergy(v)}
                className="flex-1 aspect-square rounded-lg text-lg border transition-colors cursor-pointer"
                style={
                  energy === v
                    ? { background: "var(--amber-wash)", borderColor: "var(--amber)" }
                    : { background: "transparent", borderColor: "var(--border-strong)" }
                }
              >
                {ENERGY_FACE[v - 1]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {expanded ? (
        <div className="mb-4 space-y-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <fieldset>
            <legend className="text-sm font-medium mb-2" style={{ color: "var(--ink-muted)" }}>
              Where (optional)
            </legend>
            <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Category">
              {OUTDOOR_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => setCategory(category === c ? null : c)}
                  className="px-3 py-1 rounded-full text-xs border transition-colors cursor-pointer"
                  style={
                    category === c
                      ? { background: "var(--canopy)", color: "var(--bg-raised)", borderColor: "var(--canopy)" }
                      : { background: "transparent", color: "var(--ink-muted)", borderColor: "var(--border-strong)" }
                  }
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <label htmlFor={`${uid}-loc`} className="sr-only">
              Place name
            </label>
            <input
              id={`${uid}-loc`}
              type="text"
              placeholder="e.g. Laurelhurst Park, or just “the block”"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: "transparent", borderColor: "var(--border-strong)", color: "var(--ink)" }}
            />
          </fieldset>
          <div>
            <label htmlFor={`${uid}-note`} className="text-sm font-medium mb-2 block" style={{ color: "var(--ink-muted)" }}>
              Note (optional)
            </label>
            <input
              id={`${uid}-note`}
              type="text"
              placeholder="anything worth remembering"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: "transparent", borderColor: "var(--border-strong)", color: "var(--ink)" }}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm mb-4 underline decoration-dotted cursor-pointer"
          style={{ color: "var(--ink-muted)" }}
        >
          + add a place or note
        </button>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-2.5 rounded-full font-medium text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition-opacity"
          style={{ background: "var(--canopy)", color: "var(--bg-raised)" }}
        >
          {existing ? "Update entry" : "Log it"}
        </button>
        {justSaved && (
          <span className="text-sm font-data" style={{ color: "var(--canopy-bright)" }} role="status">
            saved
          </span>
        )}
      </div>
    </form>
  );
}
