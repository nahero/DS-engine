---
name: ui-review
description: Audit a DS-Engine UI diff (or given files) for design-system violations - hardcoded values, primitive tokens in components, missing story states, accessibility gaps, data-display rules. Use after building or changing a component or screen, or when asked to review UI code. Reports findings; edits only when asked.
---

# UI review

Scope: the working-tree diff (`git diff` + untracked files under `src/`) unless files or a commit range are given. Skip generated files (`src/styles/tokens.css`, `src/styles/tokens.ts`, `tokens/figma/*`).

## Checks

### Tokens
Search changed `src/**/*.{tsx,ts,css}` (excluding generated files):
- Hardcoded colours: `#[0-9a-fA-F]{3,8}\b`, `rgb\(`, `hsl\(`, `oklch\(`
- Arbitrary values: `-\[[^\]]+\]` (e.g. `text-[13px]`, `w-[312px]`, `bg-[#…]`). Allowed only for non-token geometry (e.g. `grid-cols-[auto_1fr]`) with a reason.
- Primitive tokens in components: `--ds-color-(neutral|red|blue|green|amber|violet|white|black)`, `--ds-kit-`, `--ds-space-[0-9]`, `--ds-radius-(sm|md|lg|xl|px-)`
- Numeric motion: `duration-[0-9]`, `delay-[0-9]`, raw `ms` in `transition`
- Inline `style={{` with literal sizes or colours
- shadcn opacity modifiers on tokens (`bg-primary/90`) are acceptable in shadcn files but prefer the `*-hover` token in project components.
- Opacity modifiers on focus or text colours (`ring-ring/50`, `text-fg/70`): the contrast check validated the solid colour, so a modifier can silently drop it below 3:1 / 4.5:1. Flag as a11y.

### Stories
For each changed component: does `<name>.stories.tsx` cover Default, Hover/Focus, Disabled, Loading, Empty, Error, Long content (and Missing data for data display), plus every variant and size? List the missing ones.

### Accessibility (`docs/design-system/accessibility.md`)
- Clickable non-button/non-link elements (`onClick` on `div`/`span`)
- Inputs without label / icon-only buttons without `aria-label`
- Status or confidence conveyed by colour only (no text/icon)
- Focus styles removed (`outline-none` without a `focus-visible:` replacement)
- Custom keyboard handling that blocks Tab or fires while typing

### Data display (`docs/design-system/patterns.md`)
- Numbers not right-aligned or missing `tabular-nums`
- Truncation (`truncate`, `line-clamp`) without the full value available (tooltip/title/accessible name)
- Missing-value handling (blank cells, `0` for unknown)

### Docs
Component added or changed but `docs/design-system/components.md` not updated.

## Output
A list ordered by severity (a11y and hardcoded values first):
`file:line: problem → fix`
End with the missing stories per component. No edits unless the user asks; then fix and re-run.
