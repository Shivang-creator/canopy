"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyse } from "@/lib/analysis/engine";
import type { Entry } from "@/lib/domain";
import { todayKey } from "@/lib/dates";
import {
  getEntries,
  getLocation,
  hasStartedRealLog,
  setLocation as persistLocation,
  startRealLog,
  upsertEntry,
  type StoredLocation,
} from "@/lib/storage";
import type { GreenSpaceQueryResult } from "@/lib/overpass/types";
import { QuickEntryForm } from "./QuickEntryForm";
import { SignalPanel } from "./SignalPanel";
import { GreenSpacePanel } from "./GreenSpacePanel";
import { TrendChart } from "./TrendChart";
import { EntryHistory } from "./EntryHistory";
import { DemoBanner } from "./DemoBanner";

export function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [location, setLocationState] = useState<StoredLocation | null>(null);
  const [greenSpace, setGreenSpace] = useState<GreenSpaceQueryResult | null>(null);
  const [greenSpaceLoading, setGreenSpaceLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setEntries(getEntries());
    setIsDemo(!hasStartedRealLog());
    setLocationState(getLocation());
  }, []);

  // Reading localStorage has to happen client-side, after mount — the
  // server render knows nothing about it. This is the standard "hydrate
  // from a browser-only store" effect, not a derivable render-time value.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    setMounted(true);
  }, [refresh]);

  const fetchGreenSpace = useCallback(async (lat: number, lon: number) => {
    setGreenSpaceLoading(true);
    try {
      const res = await fetch(`/api/greenspace?lat=${lat}&lon=${lon}`);
      const json = (await res.json()) as GreenSpaceQueryResult;
      setGreenSpace(json);
    } catch {
      setGreenSpace(null);
    } finally {
      setGreenSpaceLoading(false);
    }
  }, []);

  // Fetching in response to a state change (the chosen location) is
  // exactly what effects are for — this queries the real Overpass API, an
  // external system, not something derivable during render. Deliberately
  // keyed on lat/lon rather than `location` (and `fetchGreenSpace`,
  // stable via useCallback) so this only re-fires when the coordinates
  // actually change, not on every location-label update.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (location) fetchGreenSpace(location.lat, location.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon]);

  const result = useMemo(() => analyse(entries), [entries]);
  const todayEntry = useMemo(() => entries.find((e) => e.date === todayKey()) ?? null, [entries]);
  const visitedNames = useMemo(
    () => new Set(entries.map((e) => e.location.trim().toLowerCase()).filter(Boolean)),
    [entries],
  );

  function handleEntrySubmit(entry: Entry) {
    upsertEntry(entry);
    refresh();
  }

  function handleStartRealLog() {
    startRealLog();
    refresh();
  }

  async function handleSearch(query: string) {
    setLocationError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLocationError(body.error ?? "Place not found.");
        return;
      }
      const { lat, lon, displayName } = (await res.json()) as {
        lat: number;
        lon: number;
        displayName: string;
      };
      const next: StoredLocation = { lat, lon, label: displayName, source: "geocoded" };
      persistLocation(next);
      setLocationState(next);
    } catch {
      setLocationError("Couldn't reach the geocoder — try again in a moment.");
    }
  }

  function handleUseMyLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("This browser doesn't support geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: StoredLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "your current location",
          source: "geolocation",
        };
        persistLocation(next);
        setLocationState(next);
      },
      () => setLocationError("Location permission denied — search a place name instead."),
    );
  }

  if (!mounted || !location) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "var(--ink-faint)" }}>
        Loading your diary…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {isDemo && <DemoBanner entryCount={entries.length} onStartRealLog={handleStartRealLog} />}

      {/*
        Keyed on mode + date (NOT on todayEntry?.id — see below) so the
        form's internal state (location, note, category, all initialised
        once from `existing` and not re-synced on every render) resets
        exactly when it needs to and no more.

        Caught in QA: without any key, clicking "Start my real log" while
        today's demo entry was showing left the form's *location* field
        holding onto the demo place name (its useState initializer had
        already run against the demo entry before the switch), so a
        visitor's first real entry could silently inherit demo text they
        never typed. Keying on mode+date fixes that: demo -> real changes
        the key, forcing a fresh mount with existing=null.

        Keying on todayEntry?.id instead was tried first and reverted: an
        id-based key also changes the instant a submit succeeds (no entry
        -> a real id), forcing an unwanted remount immediately after
        saving and silently swallowing the "saved" confirmation and the
        just-typed field values. Mode+date doesn't change on submit, so
        editing today's entry again keeps the same instance, which is the
        behavior you want.
      */}
      <QuickEntryForm
        key={`${isDemo ? "demo" : "real"}:${todayKey()}`}
        existing={todayEntry}
        onSubmit={handleEntrySubmit}
      />

      <SignalPanel result={result} />

      {locationError && (
        <p className="text-sm px-1" style={{ color: "var(--rust)" }}>
          {locationError}
        </p>
      )}

      <GreenSpacePanel
        result={greenSpace}
        loading={greenSpaceLoading}
        location={location}
        trend={result.trend}
        visitedNames={visitedNames}
        onSearch={handleSearch}
        onUseMyLocation={handleUseMyLocation}
      />

      <section
        className="rounded-2xl border p-5 sm:p-6"
        style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
      >
        <h2 className="font-display text-xl mb-3" style={{ color: "var(--ink)" }}>
          Over time
        </h2>
        <TrendChart result={result} />
      </section>

      <EntryHistory entries={entries} />
    </div>
  );
}
