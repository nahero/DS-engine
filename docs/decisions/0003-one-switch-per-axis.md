# 0003 — Brand, light/dark and density are independent switches

**Status:** accepted · 2026-09-28

## Context
Themes multiply: 2 brands × 2 modes × 2 densities is 8 combinations. Per-combination files or Figma modes don't scale.

## Decision
- One attribute per axis in code: `.dark`, `[data-theme]` (brand), `[data-density]`. One `tokens.css`, one block per switch.
- The brand layer holds only roles that change per brand (primary, focus, accent), each with a light and a dark value.
- Figma mirrors it with one collection per axis: `DS Brand`, `DS Semantic` (Light/Dark), `DS Density`. A frame sets three modes, never the kit's own mode.

## Consequences
- Adding a brand touches one JSON file and one Figma mode.
- Figma Pro allows 4 modes per collection, so at most 4 brands.
