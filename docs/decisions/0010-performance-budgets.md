# 0010 — Performance budgets in CI

**Status:** accepted · 2026-10-03

## Context
The whole app shipped as one 952 kB JavaScript file (277.7 kB gzip): the chart library and the 1,000-row dataset loaded on every screen. Nothing measured performance, so it could only get worse unnoticed.

## Decision
- Screens are lazy-loaded (`React.lazy` + a skeleton fallback). Recharts lives only in the Overview chunk, and the claims data in its own chunk.
- **Bundle budget:** first-load JS (entry + preloaded chunks) ≤ 145 kB gzip, and it must not contain the chart library (`scripts/check-bundle.js`).
- **Lighthouse CI:**
  - runs against the production build for Overview, Claims queue and Claim detail, mobile and desktop, median of 3 runs;
  - thresholds: performance ≥ 0.9, accessibility = 1, best practices ≥ 0.95;
  - reports stay in the CI artifact (no third-party upload).
- **One recorded exception:** mobile Overview performance is asserted at ≥ 0.85 (it measures 0.88–0.89).
  - Cause: under 4× CPU throttling the app shell takes about 2.1 s to first paint and the chart adds about 0.8 s.
  - Tried: lazy-loading the chart inside the Overview (made LCP worse) and build-target changes (no change).

## Consequences
- First-load JS is 130.4 kB gzip (was 277.7 kB); the entry file itself is 22.9 kB.
- Lighthouse: desktop 100 on all three screens; mobile 89 / 94 / 94; accessibility and best practices 100.
- Lighthouse adds a few minutes to CI.
- To lift the mobile Overview exception: reduce the shell's first-paint cost (fewer Radix primitives in the shell, smaller CSS) or render the chart without a charting library.
