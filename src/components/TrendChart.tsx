"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis/engine";
import { formatDay } from "@/lib/dates";

const WIDTH = 640;
const BAR_HEIGHT = 90;
const LINE_HEIGHT = 110;
const PAD_LEFT = 30;
const PAD_RIGHT = 12;
const PAD_TOP = 10;

/**
 * Two small multiples sharing one x-axis (dates), never a dual-axis
 * chart: outdoor minutes (a bar, its own scale) stacked above mood/energy
 * (a 1-5 line, its own scale). Minutes and a 1-5 rating are different
 * units, so indexing them onto one shared y-axis would be the classic
 * dual-axis mistake — two small multiples instead.
 */
export function TrendChart({ result }: { result: AnalysisResult }) {
  const dates = result.outdoorSeries.points.map((p) => p.date);
  const minutesVals = result.outdoorSeries.points.map((p) => p.value);
  const moodSeries = result.series.find((s) => s.metricId === "mood");
  const energySeries = result.series.find((s) => s.metricId === "energy");
  const [hover, setHover] = useState<number | null>(null);

  const n = dates.length;
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const x = (i: number) => (n <= 1 ? PAD_LEFT + plotWidth / 2 : PAD_LEFT + (i / (n - 1)) * plotWidth);

  const maxMinutes = useMemo(() => Math.max(30, ...minutesVals), [minutesVals]);
  const yBar = (v: number) => BAR_HEIGHT - (v / maxMinutes) * (BAR_HEIGHT - PAD_TOP);

  const yLine = (v: number) => LINE_HEIGHT - PAD_TOP - ((v - 1) / 4) * (LINE_HEIGHT - PAD_TOP - 8) + 4;

  const linePath = (vals: (number | undefined)[]) => {
    let d = "";
    vals.forEach((v, i) => {
      if (v === undefined) return;
      d += `${d ? "L" : "M"}${x(i)},${yLine(v)} `;
    });
    return d.trim();
  };

  if (n === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
        No entries logged yet — the chart appears once you have a few days.
      </p>
    );
  }

  // Tick every ~7 days to avoid label collisions.
  const tickEvery = Math.max(1, Math.ceil(n / 7));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${BAR_HEIGHT + LINE_HEIGHT + 24}`}
        className="w-full min-w-[420px]"
        role="img"
        aria-label="Outdoor minutes and mood/energy ratings over time"
        onMouseLeave={() => setHover(null)}
      >
        {/* ---- Bars: minutes outdoors ---- */}
        <g>
          <text x={0} y={12} fontSize="10" fontFamily="var(--font-data)" fill="var(--ink-faint)">
            minutes outdoors
          </text>
          {minutesVals.map((v, i) => {
            const barW = Math.max(1.5, (plotWidth / n) * 0.6);
            return (
              <rect
                key={i}
                x={x(i) - barW / 2}
                y={PAD_TOP + yBar(v) - PAD_TOP}
                width={barW}
                height={Math.max(0.5, BAR_HEIGHT - yBar(v))}
                rx={1}
                fill={hover === i ? "var(--canopy-strong)" : "var(--canopy)"}
                opacity={hover === null || hover === i ? 1 : 0.55}
              />
            );
          })}
          <line x1={PAD_LEFT} y1={BAR_HEIGHT} x2={WIDTH - PAD_RIGHT} y2={BAR_HEIGHT} stroke="var(--border)" strokeWidth={1} />
        </g>

        {/* ---- Lines: mood + energy ---- */}
        <g transform={`translate(0, ${BAR_HEIGHT + 24})`}>
          <text x={0} y={-10} fontSize="10" fontFamily="var(--font-data)" fill="var(--ink-faint)">
            mood / energy (1–5)
          </text>
          {[1, 3, 5].map((v) => (
            <line
              key={v}
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yLine(v)}
              y2={yLine(v)}
              stroke="var(--border)"
              strokeWidth={0.75}
            />
          ))}
          {moodSeries && (
            <path d={linePath(moodSeries.points.map((p) => p.value))} fill="none" stroke="var(--canopy-bright)" strokeWidth={2} />
          )}
          {energySeries && (
            <path d={linePath(energySeries.points.map((p) => p.value))} fill="none" stroke="var(--amber)" strokeWidth={2} />
          )}
        </g>

        {/* ---- Shared hover layer ---- */}
        {Array.from({ length: n }, (_, i) => (
          <rect
            key={i}
            x={x(i) - plotWidth / n / 2}
            y={0}
            width={plotWidth / n}
            height={BAR_HEIGHT + LINE_HEIGHT + 24}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={0}
            y2={BAR_HEIGHT + LINE_HEIGHT + 24}
            stroke="var(--ink-faint)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}

        {/* ---- X axis date ticks ---- */}
        {dates.map((d, i) =>
          i % tickEvery === 0 ? (
            <text
              key={d}
              x={x(i)}
              y={BAR_HEIGHT + LINE_HEIGHT + 22}
              fontSize="9"
              fontFamily="var(--font-data)"
              fill="var(--ink-faint)"
              textAnchor="middle"
            >
              {formatDay(d)}
            </text>
          ) : null,
        )}
      </svg>

      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--canopy)" }} /> minutes outdoors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "var(--canopy-bright)" }} /> mood
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "var(--amber)" }} /> energy
        </span>
        {hover !== null && (
          <span className="font-data ml-auto" style={{ color: "var(--ink)" }}>
            {formatDay(dates[hover])}: {minutesVals[hover]}m outdoors
            {moodSeries ? `, mood ${moodSeries.points[hover]?.value}` : ""}
            {energySeries ? `, energy ${energySeries.points[hover]?.value}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
