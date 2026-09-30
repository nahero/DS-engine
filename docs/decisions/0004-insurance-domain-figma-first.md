# 0004 — Explicit insurance domain; screens designed in Figma first

**Status:** accepted · 2026-09-29

## Context
A generic "review queue" hides the hard parts of data-heavy UI. Insurance claims bring real constraints: money, several dates that decide coverage, authority limits, PII, audit, and AI decisions that need explaining.

## Decision
- The product is ClaimDesk, an insurance claims admin where an AI agent pre-processes claims and a handler reviews them.
- Screens are designed in Figma from kit instances first, with decisions written under each screen, then built in code.
- Figma keeps progress visible: v1 (kit parts) is frozen, v2 swaps in the custom DS components.
- Rules applied everywhere:
  - money: currency, right-aligned, tabular figures;
  - the dates that decide coverage are kept distinct;
  - authority limits are stated, not hidden in a disabled button;
  - fraud flags are neutral;
  - revealing PII is logged;
  - missing values show "—" with a label.

## Consequences
- The UI is a concept, not domain expertise. All data is fictional.
