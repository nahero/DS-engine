# 0015: Accessibility lint, tokens-only check and token validation

**Status:** accepted · 2026-10-16

## Context
The rules "tokens only" and "accessible markup" lived in CLAUDE.md and in the `ui-review` skill: a reviewer had to remember them. Tailwind's default palette was already removed, but `p-[13px]` or `bg-[#f00]` still compiled. Token JSON was only checked indirectly, when Style Dictionary failed or a colour pair failed contrast.

## Decision
- **oxlint `jsx-a11y` plugin** (no ESLint: one fast linter, already in use). Two rules are off, with the reason in `.oxlintrc.json`. Both are off in jsx-a11y's recommended set too, and turning them on found no real issue:
  - `prefer-tag-over-role` would swap working ARIA for worse markup: `<output>` for `role="status"` (weaker live-region support), `<img>` for text initials, `<a>` for the disabled-link pattern (`role="link"` + `aria-disabled`);
  - `control-has-associated-label` only flags decorative swatches in token tables.
- Focusable scroll regions (`role="region"` + `tabIndex={0}`) are allowed, as axe requires them.
- The other findings were fixed: the sheet story's scroll list is now a labelled region. The disabled badge story now uses the disabled-link pattern. Where a finding is intended (delegated key handlers, a tooltip trigger that is focusable only when truncated, shadcn passing children through props), there is an inline `oxlint-disable-next-line <rule> -- <reason>`. Unused disables fail the lint.
- **`scripts/check-token-usage.js`** (`npm run check:token-usage`), scoped to `src/components`, `src/features` and `src/screens`:
  - fails on Tailwind arbitrary values for visual utilities and arbitrary properties (`[padding:8px]`), on colour literals in value positions, and on literal, named-colour or computed inline styles;
  - passes `var(--…)`, layout units (`60ch`, `100dvh`, `50%`), non-visual arbitrary values (`grid-cols-[1fr_auto]`, `transition-[width]`, `data-[state=open]:`), unitless 0/1, and text like "Claim #10482";
  - a deliberate exception is `// token-usage-ignore-next-line: <reason>`; one without a reason, or unused, fails;
  - `src/App.tsx`, `src/lib`, `src/hooks` and the foundations stories are out of scope: they hold no component styling, or show token values on purpose.
- **`scripts/validate-tokens.js`** runs first in `npm run build:tokens`:
  - every token has a known `$type` and a value of the right shape, shadow members included;
  - every reference, also inside composite values, resolves in every mode, without cycles, to a token (not a group) of the right type;
  - no token is defined twice in one mode; light/dark, comfortable/compact and every brand define the same tokens;
  - brand file names match what the build picks up.
- **The checks are tested** (`scripts/*.test.js`, in the unit project): every rule has a case that must fail and a case that must pass.
- **`strict: true`** is explicit in both tsconfigs (it was only the TypeScript 6 default).
- All of these run in CI and in the agent hooks (on edit and before stopping, ADR 0014).

## Consequences
- A design-system violation fails in seconds, on the edit that caused it, without a human review.
- The token-usage check is a scan, not a parser. It misses class names or style objects built elsewhere and passed in by variable, and shadcn constants such as the sidebar width; the reviewer and the visual tests are the backstop.
- A new brand file must define every role of `brand.default.json` before the build passes.
