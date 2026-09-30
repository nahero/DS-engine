# 0007 — Hash routing instead of a router dependency

**Status:** accepted · 2026-09-29

## Context
GitHub Pages serves static files under `/DS-engine/` with no server rewrites. The app has three screens and a claim route.

## Decision
- Hash routes (`#overview`, `#claims-queue`, `#claim-<id>`), built through one helper (`src/lib/routes.ts`).
- On navigation, `document.title` updates and focus moves to `<main>`. Unknown hashes (e.g. the skip link's `#main`) don't change the page.

## Consequences
- No 404 handling or deep-link rewrites needed on Pages, and no router dependency.
- Revisit if the app gains nested routes or data loading per route.
