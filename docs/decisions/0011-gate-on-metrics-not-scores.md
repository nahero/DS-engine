# 0011 — Gate mobile performance on metric budgets, not the Lighthouse score

**Status:** accepted · 2026-10-06 · supersedes the mobile performance thresholds in [0010](0010-performance-budgets.md)

## Context
0010 gated deploy on the Lighthouse performance score, with mobile Overview at ≥ 0.85. The first CI run scored it 0.84 and blocked the deploy; the next run of the same code scored 0.88. Locally it is 0.88–0.89. The score depends on the machine, and a one-point margin makes the gate fail at random.

## Decision
- **Mobile:** the performance score is a warning (measured and reported at ≥ 0.9). Hard gates are metric budgets with real headroom:

| Metric | Budget | Measured in CI (median of 3) |
|---|---|---|
| Largest contentful paint | ≤ 4,000 ms | Overview 3,267 · Queue 2,739 · Detail 2,742 |
| Total blocking time | ≤ 600 ms | Overview 125 · Queue 41 · Detail 19 |
| Cumulative layout shift | ≤ 0.1 | 0 on all three |

- The LCP and blocking-time budgets are the edge of Lighthouse's "poor" range: the app must never enter it.
- **Desktop:** performance score ≥ 0.9 stays a hard gate (it measures 1.00, so the margin is wide).
- **Unchanged everywhere:** accessibility = 1, best practices ≥ 0.95, the first-load bundle budget.
- The Lighthouse report is uploaded as a CI artifact on every run.

## Consequences
- Deploys no longer depend on runner speed; regressions in load time, blocking time or layout shift still fail.
- The mobile Overview score (0.84–0.89) stays visible in the report and the README. Improving it means cutting the shell's first-paint cost or the chart's render cost.
