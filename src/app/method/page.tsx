import Link from "next/link";
import { ANALYSIS_CONFIG } from "@/lib/analysis/engine";
import { ResetToDemoButton } from "@/components/ResetToDemoButton";

export const metadata = {
  title: "How Canopy works",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl mb-3" style={{ color: "var(--canopy-strong)" }}>
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed" style={{ color: "var(--ink)" }}>
        {children}
      </div>
    </section>
  );
}

export default function MethodPage() {
  return (
    <>
      <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--bg-sunken)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-baseline justify-between gap-4">
          <Link href="/" className="font-display text-2xl italic" style={{ color: "var(--canopy-strong)" }}>
            Canopy
          </Link>
          <Link href="/" className="text-sm underline decoration-dotted" style={{ color: "var(--ink-muted)" }}>
            ← back to your diary
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10" style={{ background: "var(--bg)" }}>
        <h1 className="font-display text-3xl italic mb-2" style={{ color: "var(--ink)" }}>
          How Canopy works, and where it stops
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--ink-muted)" }}>
          Built for OregonHacks 2026 (&ldquo;help people reconnect with nature or support environmental
          health&rdquo;). This page is the honesty layer — what&rsquo;s real, what&rsquo;s adapted from where, and
          what Canopy deliberately refuses to claim.
        </p>

        <Section title="The problem">
          <p>
            Most nature-and-wellbeing apps ask you to trust a vibe: log some outdoor time, get a green checkmark,
            feel good about it. Two things are usually missing. First, the app never tells you whether outdoor time
            is actually doing anything for <em>you</em> — it just assumes the general finding in the literature
            applies to your life. Second, &ldquo;go outside&rdquo; is generic advice; it doesn&rsquo;t tell you
            where, specifically, near you.
          </p>
          <p>
            Canopy is for someone willing to log a few taps a day who wants two honest things back: a real read on
            whether their own outdoor time tracks their own mood and energy, stated with the confidence their data
            actually supports — and real, mapped green space near them, not a generic suggestion.
          </p>
        </Section>

        <Section title="Fitting the prompt">
          <p>
            The prompt is an &ldquo;or&rdquo;: reconnect with nature, or support environmental health. Canopy does
            both halves rather than picking one. The daily log and mood/energy correlation is the personal-habit
            half — reconnecting with nature, made concrete and measurable instead of a vague wellness goal. The
            live Overpass query against real OpenStreetMap data is the environmental-health half — an actual,
            verifiable claim about the user&rsquo;s real geography (&ldquo;here is a real nature reserve 900m from
            you&rdquo;), not invented content. The two halves are connected, not bolted together: a declining
            outdoor-time trend is what triggers the green-space nudge.
          </p>
        </Section>

        <Section title="The statistics — adapted from Skin Diary">
          <p>
            Every correlation on the signal panel is deterministic arithmetic: Spearman rank correlation, a
            closed-form Student&rsquo;s t-test (hand-rolled incomplete beta function, not a library), Welch&rsquo;s
            t-test for the outdoor-vs-none comparison, and Benjamini-Hochberg false-discovery-rate correction
            across every hypothesis tested in one diary. No LLM and no model touches this number — the same diary
            always produces the same finding, and the arithmetic is auditable in <code>src/lib/stats/</code>.
          </p>
          <p>
            This is carried over from an earlier, more mature project,{" "}
            <strong>Skin Diary</strong> (<code>~/Projects/skin-diary</code>), which solved the same underlying
            problem — honest, sample-size-aware correlation reporting for a personal diary — for skin-tracking
            instead of nature-tracking. <code>src/lib/stats/distributions.ts</code> and{" "}
            <code>src/lib/stats/correlation.ts</code> are adapted close to verbatim (they&rsquo;re general-purpose
            statistics with nothing skin-specific in them); <code>src/lib/analysis/engine.ts</code> keeps the same
            shape — build (factor, outcome, lag) pairs from real calendar dates, correct the whole family, gate on
            sample size — rescoped from Skin Diary&rsquo;s 7-factor, 147-hypothesis search down to Canopy&rsquo;s
            single factor (minutes outdoors) against two outcomes at two lags, plus two group comparisons: at most
            six hypotheses per diary. Skin Diary&rsquo;s photo-brightness confound check (<code>partialCorrelation</code>)
            was dropped — Canopy has no equivalent confound to control for.
          </p>
          <p>
            The honesty rule that matters most: nothing is reported above &ldquo;not enough data&rdquo; below{" "}
            <strong>{ANALYSIS_CONFIG.minPairedObservations} paired days</strong>, however clean the pattern looks
            over fewer. Every claim states its <code>n</code> next to it, and a tree-ring graphic literally draws
            fewer, fainter rings for a thinner sample — so a finding over 3 days cannot visually pass for one over
            30.
          </p>
        </Section>

        <Section title="The green-space query — adapted from Nirog">
          <p>
            The &ldquo;real green space near you&rdquo; panel is a live network call to{" "}
            <code>https://overpass-api.de/api/interpreter</code>, OpenStreetMap&rsquo;s Overpass API — real parks,
            gardens, forests, nature reserves and protected areas, queried by tag (<code>leisure=park</code>,{" "}
            <code>landuse=forest</code>, <code>boundary=protected_area</code>, and similar) within a radius of
            wherever you say you are. Nothing about it is simulated: the query, the response, and the distances are
            real OSM data, parsed and sorted client-side.
          </p>
          <p>
            The query-building and parsing pattern — one union query over a handful of tag/value pairs, filtered by{" "}
            <code>around:&lt;radius&gt;</code>, requesting <code>out center tags</code> so ways and relations come
            back with a computed centroid, then normalising/deduping the elements — is adapted from the{" "}
            <strong>Nirog</strong> patient-app project&rsquo;s <code>healthmap_fetch.py</code> (
            <code>~/Projects/Nirog App/healthmap_fetch.py</code>), which used the identical approach against
            Overpass to pull real PHC/CHC/hospital coordinates across India. Canopy re-targets the same technique at{" "}
            <code>leisure</code>/<code>landuse</code>/<code>natural</code>/<code>boundary</code> tags instead of{" "}
            <code>amenity</code> tags, and ports it from Python to TypeScript, running server-side in a Next.js API
            route.
          </p>
          <p>
            If the live call fails — and the public, unauthenticated Overpass instance genuinely does 504 under
            load; that happened on the very first call made while building this — the app tries a mirror endpoint,
            and only after both fail does it fall back to a bundled snapshot. That snapshot is a real response
            captured live against Portland, OR, not fabricated data, and the UI always discloses which of the three
            happened rather than quietly presenting a fallback as fresh.
          </p>
        </Section>

        <Section title="Honest limits">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>This is not medical or ecological advice.</strong> Mood and energy self-ratings are coarse,
              and Canopy does not diagnose, treat, or claim any clinical effect.
            </li>
            <li>
              <strong>Correlation is not causation.</strong> If your mood tracks your outdoor time, dozens of
              confounds could explain it just as well — weather, day of week, what else was happening that day.
              Canopy reports association, states its sample size, and stops there.
            </li>
            <li>
              <strong>OpenStreetMap completeness varies enormously by region.</strong> A well-mapped city park
              shows up reliably; a rural area or a country with less OSM contributor activity may show far fewer
              features than actually exist on the ground. An empty result near you is a real absence-of-data
              finding, not proof there&rsquo;s no green space nearby.
            </li>
            <li>
              <strong>The demo diary is synthetic, and says so everywhere it appears.</strong> It exists so the
              payoff view is visible on first load; every entry in it is generated with a documented planted signal
              (see <code>src/lib/demo/seed.ts</code>) and never presented as real.
            </li>
          </ul>
        </Section>

        <Section title="Reset">
          <p className="mb-1">
            If you&rsquo;ve started a real log and want to see the demo diary again:
          </p>
          <ResetToDemoButton />
        </Section>
      </main>
      <footer className="py-6 text-center text-xs" style={{ color: "var(--ink-faint)" }}>
        Built for OregonHacks · green-space data © OpenStreetMap contributors (ODbL)
      </footer>
    </>
  );
}
