# 0002 — Three token tiers; shadcn names are an adapter

**Status:** accepted · 2026-09-29

## Context
shadcn/ui and the Obra Figma kit both speak shadcn variable names (`--primary`, `--accent`…). Using them as the system's vocabulary would tie meaning to a vendor and mix roles (e.g. `--accent` means "hover" in shadcn).

## Decision
- Tiers: **primitive** (from Figma) → **semantic** (ours: `bg.*`, `fg.*`, `action.*`, `status.*`, `confidence.*`, `chart.*`) → **component** (ours, only where a component needs its own knob: card, dialog).
- Components use semantic tokens only. shadcn names are a thin adapter onto semantic/component tokens, in `globals.css` and in Figma (the kit's `shadcn colors` alias DS variables).
- Tailwind's default palette, type scale, radii and shadows are removed, so only token-backed utilities exist.

## Consequences
- shadcn and kit components follow our tokens without edits.
- Where a kit value fails WCAG, the semantic layer overrides it (see `docs/ai-log.md`).
