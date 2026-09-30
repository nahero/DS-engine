# 0008 — Stories are tests

**Status:** accepted · 2026-09-30

## Context
CLAUDE.md required stories for every component and axe-clean stories, but nothing enforced it: CI only checked token drift, contrast and the build. Rules that aren't enforced drift, especially with AI writing code.

## Decision
- Vitest with two projects:
  - `unit` for domain logic (sorting, payout, filters, masking);
  - `storybook` via `@storybook/addon-vitest`, where every story runs in Chromium.
- addon-a11y runs in each story test, and a violation fails it. Play functions are interaction tests for the key flows.
- CI gates deploy on: token drift, contrast, lint, typecheck, unit tests and story tests.
- No hosted visual-testing service (Chromatic rejected); visual regression, if added, stays in-repo.

## Consequences
- Slower CI (a browser install per run, cached).
- A component without stories, or with an accessibility violation, can't reach the live site.
