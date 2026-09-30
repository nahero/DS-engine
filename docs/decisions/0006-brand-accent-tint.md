# 0006 — Brand accent tint

**Status:** accepted · 2026-09-29

## Context
With the purple brand, only buttons and focus rings changed. Selected rows, the active sidebar item and menu hover stayed grey, so the brand barely showed.

## Decision
- Brand roles `accent` / `accent-fg` → semantic `bg.accent` / `fg.accent` → shadcn `--accent`, `--sidebar-accent`; selected table rows use `bg-accent`.
- The default brand keeps them neutral, so its look is unchanged.
- Contrast pairs added for text on `bg.accent`.

## Consequences
- One extra pair of roles per brand. It is a tint, not a second brand colour.
