# Accessibility

Target: **WCAG 2.2 AA**. Stories run addon-a11y with `test: 'error'`: violations show as errors in the Accessibility panel and fail a Storybook test run.

## Contrast
- Text 4.5:1, non-text (focus indicator, input and strong borders, confidence marks) 3:1, in light and dark.
- Enforced by `scripts/check-contrast.js` in `npm run build:tokens`. Add pairs there when a new role carries text or a boundary.
- Fix failures in `tokens/semantic.*.json`, never in `tokens/figma/*` (see `tokens.md`, "Where we differ from the kit").

## Focus
- Every interactive element shows a visible focus ring on `:focus-visible` using `ring` / `border.focus`.
- Don't remove outlines without a replacement. Focus order follows reading order; overlays trap and restore focus (Radix does this, keep it).

## Keyboard
| Where | Keys |
|---|---|
| Everywhere | Tab / Shift+Tab move between controls; Esc closes overlays |
| Review queue | ↑/↓ (or j/k) move the active row · Enter opens the item · x or Space toggles selection · Shift+↑/↓ extends selection |
| Item detail | Tab through fields · Enter edits a field · Esc cancels the edit · shortcut keys for Approve / Refer are shown in their labels |
| Menus, selects, tabs | Radix defaults (arrows, Home/End, typeahead) |

Shortcuts never fire while typing in an input.

## Semantics and labels
- Native elements first (`button`, `a`, `table`, `th scope`, `label`). ARIA only where HTML has no equivalent.
- Every input has a visible label; icon-only buttons have `aria-label`.
- Tables: real `<table>` with header cells; sortable headers expose `aria-sort`.
- Live updates (toasts, bulk results) use a polite live region.

## Colour is never the only signal
Status, confidence, errors and diff highlights always carry text and/or an icon. Check stories in greyscale mentally: is the meaning still there?

## Size and density
- Targets at least 24×24px (WCAG 2.5.8). Compact rows are 32px, controls 32px.
- Text can scale to 200% without loss; sizes are in `rem`.

## Motion
- Durations collapse to 0 under `prefers-reduced-motion` (see `motion.md`). No information conveyed only through animation.

## Exceptions
If an a11y rule must be disabled in a story, disable only that rule on that story, with a comment saying why and what compensates. Log it in `docs/ai-log.md` if AI introduced it.
