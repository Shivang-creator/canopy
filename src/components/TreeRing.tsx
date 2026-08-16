import type { Confidence } from "@/lib/stats/correlation";

/**
 * The signature visual: a cross-section of growth rings.
 *
 * Ring COUNT encodes sample size (one ring per ANALYSIS_CONFIG.
 * minPairedObservations-worth of logged days — literally more days,
 * more rings, the way a real tree works). Ring COLOR/WEIGHT encodes
 * statistical confidence, independent of count. The two are deliberately
 * decoupled: a wide, pale ring (a lot of data with no real signal) reads
 * differently from a narrow, dark one (a strong signal from thin data) —
 * which is exactly the distinction the acceptance criteria ask for
 * ("n=3 must visibly read as weaker than n=30").
 *
 * This is decorative reinforcement, never the only carrier of the claim
 * — the numeral and the confidence word are always printed alongside it.
 */

const CONFIDENCE_STROKE: Record<Confidence, string> = {
  insufficient: "var(--border-strong)",
  none: "var(--ink-faint)",
  weak: "var(--amber)",
  moderate: "var(--canopy-bright)",
  strong: "var(--canopy-strong)",
};

const CONFIDENCE_WIDTH: Record<Confidence, number> = {
  insufficient: 1,
  none: 1.5,
  weak: 2,
  moderate: 2.5,
  strong: 3,
};

export function TreeRing({
  n,
  confidence,
  perRing = 8,
  maxRings = 6,
  size = 56,
}: {
  n: number;
  confidence: Confidence;
  perRing?: number;
  maxRings?: number;
  size?: number;
}) {
  const rings = Math.max(1, Math.min(maxRings, Math.ceil(n / perRing) || 1));
  const stroke = CONFIDENCE_STROKE[confidence];
  const width = CONFIDENCE_WIDTH[confidence];
  const dashed = confidence === "insufficient";
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - width;

  const circles = Array.from({ length: rings }, (_, i) => {
    const r = maxR * ((i + 1) / rings);
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeDasharray={dashed ? "2 3" : undefined}
        opacity={0.45 + 0.55 * ((i + 1) / rings)}
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${confidence} confidence, ${n} observations`}
    >
      <circle cx={cx} cy={cy} r={1.5} fill={stroke} />
      {circles}
    </svg>
  );
}
