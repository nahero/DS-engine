# 0001 — Code is the source of truth; Figma mirrors it

**Status:** accepted · 2026-09-28

## Context
Figma Pro has no Variables REST API and no Code Connect (both Enterprise/Org). Tokens still have to exist in both places, and drift between them is the most common design-system failure.

## Decision
- Hand-owned DTCG JSON in `tokens/` is the source of truth. Only primitives come from Figma (`tokens/figma/`, never hand-edited).
- Scripts run through the Figma MCP (Plugin API): `figma-export.js` (primitives out), `figma-push.js` (DS collections in, idempotent, never deletes), `figma-verify.js` (read-only parity check).
- The Figma → code component mapping is a table in `docs/design-system/components.md` instead of Code Connect.

## Consequences
- Sync is a deliberate step, not automatic. It is run after every token change, and the verify script must report zero mismatches.
- CI can't reach Figma, so parity is checked by the verify script, and code-side drift (JSON vs generated CSS) is checked in CI.
