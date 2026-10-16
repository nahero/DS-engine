# 0015: Accessibility lint, tokens-only check and token validation

**Status:** accepted · 2026-10-16

## Context
The rules "tokens only" and "accessible markup" lived in CLAUDE.md and in the `ui-review` skill: a reviewer had to remember them. Tailwind's default palette was already removed, but `p-[13px]` or `bg-[#f00]` still compiled. Token JSON was only checked indirectly, when Style Dictionary failed or a colour pair failed contrast.

## Decision
- **oxlint `jsx-a11y` plugin** (no ESLint: one fast linter, already in use). Two rules are off, with the reason in `.oxlintrc.json`:
  - `prefer-tag-over-role` isn't in jsx-a11y's recommended set, and its swaps (`<output>` for `role="status"`, `<img>` for text initials) have weaker assistive-technology support;
  - `control-has-associated-label` is off in the recommended set too, because it can't see text rendered through components.
- Focusable scroll regions (`role="region"` + `tabIndex={0}`) are allowed, as axe requires them.
- The other findings were fixed: the sheet story's scroll list is now a labelled region. Where a finding is intended (delegated key handlers, a tooltip trigger that is focusable only when truncated, the disabled-link pattern, shadcn passing children through props), there is an inline `oxlint-disable-next-line <rule> -- <reason>`. Unused disables fail the lint.
- **`scripts/check-token-usage.js`** (`npm run check:token-usage`): fails on Tailwind arbitrary values for visual utilities, colour literals and literal inline styles in `src/components`, `src/features` and `src/screens`. `var(--…)` and non-visual arbitrary values (`grid-cols-[1fr_auto]`, `data-[state=open]:`) pass. Named exceptions need a reason in the script.
- **`scripts/validate-tokens.js`** runs first in `npm run build:tokens`:
  - every token has a known `$type` and a value of the right shape;
  - every reference resolves in every mode, without cycles, to a token of the same type;
  - light/dark, comfortable/compact and every brand define the same tokens.
- **`strict: true`** is explicit in both tsconfigs (it was only the TypeScript 6 default).
- All of these run in CI and in the agent hooks (on edit and before stopping, ADR 0014).

## Consequences
- A design-system violation fails in seconds, on the edit that caused it, without a human review.
- The token-usage check is a regex scan, not a parser. It can miss class names built at runtime; the reviewer and the visual tests are the backstop.
- A new brand file must define every role of `brand.default.json` before the build passes.
