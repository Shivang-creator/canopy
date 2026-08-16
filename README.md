# Canopy

**A nature-exposure diary that pairs honest personal tracking with real,
unfabricated environmental data.**

Built for **OregonHacks 2026** — prompt: *"Build technology that helps people
reconnect with nature or supports environmental health."*

Live: _add the deployed URL here after `vercel --prod`_

---

## The problem

Most nature-and-wellbeing apps ask you to trust a vibe: log some outdoor
time, get a green checkmark, feel good about it. Two things are usually
missing. First, the app never tells you whether outdoor time is actually
doing anything for *you* — it just assumes a general finding from the
literature applies to your life. Second, "go outside" is generic advice; it
doesn't say where, specifically, near you.

Canopy is for someone willing to log a few taps a day who wants two honest
things back: a real read on whether their own outdoor time tracks their own
mood and energy, stated with exactly the confidence their data supports —
and real, mapped green space near them, not a generic suggestion.

## How it fits the prompt

The prompt is an "or": reconnect with nature, or support environmental
health. Canopy does both halves rather than picking one:

- **Reconnecting with nature** — a genuinely fast daily log (minutes
  outdoors, an optional place/category, a same-day mood and energy rating)
  and a correlation view that tells you, honestly, whether it's working for
  you.
- **Environmental health** — a live query against OpenStreetMap's Overpass
  API surfaces real parks, forests, gardens, nature reserves and protected
  areas near a location you provide. This is a verifiable claim about your
  actual environment ("here's a real garden 24m away"), not invented
  content.

The two halves are connected, not bolted together: when logged outdoor time
is trending down, the app surfaces a real nearby green space you haven't
logged visiting as the actionable next step.

## What it does

1. **Logs outdoor time in seconds, not minutes.** Tap a minute chip, tap a
   mood face, tap an energy icon, done. Place/category/notes are one click
   away but optional — friction kills this kind of product.
2. **Pulls real green-space data from OpenStreetMap.** A server-side Next.js
   API route POSTs a real Overpass QL query to `overpass-api.de`, falls back
   to a mirror (`overpass.kumi.systems`) if that fails, and only after both
   fail falls back to a bundled snapshot that was itself captured from a
   real live call — and says so on screen, rather than silently presenting
   stale data as fresh.
3. **Correlates outdoor time against mood/energy, honestly.** Spearman rank
   correlation, a closed-form Student's t-test, Welch's t-test for the
   outdoor-vs-none comparison, and Benjamini-Hochberg correction across every
   hypothesis tested in one diary — all deterministic arithmetic, no LLM, no
   model. Nothing is reported above "not enough data" below 8 paired days,
   and every claim states its `n` next to it.
4. **Ships a demo diary so the payoff is visible with zero setup.** A judge
   opens the app cold and sees a real correlation over real-shaped (noisy,
   gappy) synthetic data, and a real live green-space query for the demo's
   location (Portland, OR) — clearly labelled as a demo, with one click to
   start a real personal log instead.

## What's genuinely reused, adapted, and from where

Per the brief for this build: read two existing projects before writing new
statistics or a new Overpass client, and adapt rather than reinvent.

**Statistics engine — from [`skin-diary`](../skin-diary)**
(`~/Projects/skin-diary/src/lib/stats/` and `.../src/lib/analysis/engine.ts`),
a longitudinal skin-tracking diary that solved the same underlying problem —
honest, sample-size-aware correlation reporting for a personal diary — for a
different domain.

- `src/lib/stats/distributions.ts` and `src/lib/stats/correlation.ts` are
  carried over **close to verbatim**: they're general-purpose statistics
  (Lanczos log-gamma, a Lentz continued-fraction incomplete beta function,
  Spearman rank correlation, Welch's t-test, Benjamini-Hochberg FDR
  correction, the `classifyConfidence` honesty gate) with nothing
  skin-specific in them.
- `src/lib/analysis/engine.ts` keeps the **same shape** as Skin Diary's —
  build (factor, outcome, lag) pairs from real calendar dates, correct the
  whole family of hypotheses together, gate every claim on sample size — but
  is rescoped from Skin Diary's 7-factor, 147-hypothesis search down to
  Canopy's single factor (minutes outdoors) against two outcomes at two
  lags, plus two outdoor-vs-none group comparisons: at most 6 hypotheses per
  diary.
- **Dropped:** `partialCorrelation`, Skin Diary's photo-brightness confound
  check. Canopy has no equivalent confound to control for, so it wasn't
  carried over.
- **Written fresh for Canopy:** the domain model (`src/lib/domain.ts`), the
  trend/decline detector that drives the green-space nudge, and the
  ground-truth demo diary generator (`src/lib/demo/seed.ts` — same
  mulberry32-PRNG-plus-Box-Muller *pattern* as Skin Diary's demo generator,
  but the actual planted signals, coefficients, and narrative content are
  new).

**Green-space query — from the Nirog patient-app project's `healthmap_fetch.py`**
(`~/Projects/Nirog App/healthmap_fetch.py`), a script that pulled real
PHC/CHC/hospital coordinates across India from OpenStreetMap's Overpass API.

- The **pattern** — one union query over a handful of tag/value pairs
  filtered by `around:<radius>,<lat>,<lon>`, requesting `out center tags` so
  ways/relations come back with a computed centroid, then
  normalising/deduping the elements and trying a mirror endpoint before
  giving up — is adapted directly, in `src/lib/overpass/query.ts`,
  `parse.ts`, and `client.ts`.
- **Re-targeted:** Nirog queried `amenity` values for health facilities;
  Canopy queries `leisure`/`landuse`/`natural`/`boundary` values for green
  space, and adds a `protect_class` requirement on `boundary=protected_area`
  that Nirog's domain never needed (see below).
- **Ported:** Python → TypeScript, running server-side in a Next.js API
  route instead of a standalone fetch script.

## A real bug this caught (and the fix)

While building this, a live query against Portland, OR returned **Pioneer
Courthouse** — a federal courthouse building — tagged as a "protected area."
It turns out OSM uses `boundary=protected_area` for both real protected
*nature* and unrelated heritage/cultural protection (the courthouse is
National-Register-listed). Real protected nature areas carry an IUCN
`protect_class` tag alongside the boundary; heritage sites don't. The query
and the parser were both updated to require `protect_class` for
`protected_area` (not for `national_park`, which is unambiguous on its own),
with a regression test (`overpass.test.ts`) reproducing the exact tag set
that caused it. This is the kind of thing that only shows up against real
data — it's also why the app never fabricates a fallback: real data has real
edge cases a synthetic dataset wouldn't surface.

## Honest limits

- **Not medical or ecological advice.** Mood/energy self-ratings are coarse;
  Canopy does not diagnose, treat, or claim any clinical effect.
- **Correlation is not causation.** If mood tracks outdoor time, weather,
  day of week, and dozens of other confounds could explain it equally well.
  Canopy reports association with its sample size and stops there.
- **OpenStreetMap completeness varies enormously by region.** A well-mapped
  city shows real results reliably; a rural area or a country with less OSM
  contributor activity may show far fewer features than actually exist. An
  empty result is a real absence-of-data finding, not proof there's nothing
  nearby.
- **The demo diary is synthetic**, and says so everywhere it appears —
  clearly labelled, with a one-click path to a real, empty personal log.

Full method page (built into the app): `/method`.

## Stack

Next.js 16 (App Router, TypeScript, Turbopack) + Tailwind CSS v4, deployed to
Vercel. No login, no server-side database — entries live in the browser's
`localStorage`; the only server-side code is two thin API routes that proxy
Overpass and Nominatim (to control the `User-Agent` header and avoid browser
CORS friction).

## Tests

```
npm test
```

**88 tests, all passing** (Vitest), covering:

- `src/lib/stats/stats.test.ts` (48 tests) — reference-value tests for every
  statistics function (closed-form identities, hand-computable examples,
  the small-n honesty gate).
- `src/lib/analysis/engine.test.ts` (18 tests) — **ground-truth** tests: the
  demo diary is generated from a documented table of planted true and null
  relationships, and the engine is asserted to rediscover the true ones (in
  the right direction, at the right lag) and invent nothing for the null
  ones — plus edge cases (empty diary, single entry, below-minimum sample
  size, calendar-date-aligned lag pairing across gaps).
- `src/lib/overpass/overpass.test.ts` (22 tests) — query-building
  (coordinate/radius validation, the `protect_class` regression guard) and
  response-parsing (classification, deduping, distance-sorting, the bundled
  real-data fallback fixture, and the Pioneer-Courthouse regression case
  above).

## Real Overpass verification

A live query was run against real coordinates (Portland, OR — 45.5152,
-122.6784) while building this. It returned real, named OSM features:
Governor Tom McCall Waterfront Park, Couch Park, Lan Su Chinese Garden,
Chapman Square, Lownsdale Square, Jamison Square, Duniway Park, Tanner
Springs Park, Keller Fountain Park, Mill Ends Park, South Park Blocks, and
more — 138 raw elements, well over a hundred after classification. The exact
response is bundled as the honest offline fallback in
`src/lib/overpass/fallback-fixture.ts` (used only if both live endpoints
fail) and is not fabricated data.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 88 tests
npm run build    # production build
```
