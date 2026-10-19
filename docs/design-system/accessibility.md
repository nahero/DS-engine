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
- Lint: oxlint's `jsx-a11y` rules run on every edit and in CI. Two rules are off in `.oxlintrc.json` with the reason there (`prefer-tag-over-role`, `control-has-associated-label`); focusable scroll regions (`role="region"` + `tabIndex={0}`) are allowed.

## Colour is never the only signal
Status, confidence, errors and diff highlights always carry text and/or an icon. Check stories in greyscale mentally: is the meaning still there?

## Size and density
- Targets at least 24×24px (WCAG 2.5.8). Compact rows are 32px, controls 32px.
- Text can scale to 200% without loss; sizes are in `rem`.

## Motion
- Durations collapse to 0 under `prefers-reduced-motion` (see `motion.md`). No information conveyed only through animation.

## Manual checks (per release)
Automated checks (lint, axe in every story and screen, keyboard e2e) can't judge whether names make sense, reading order feels right or announcements are timely. Before a release, a person does two passes on one key flow (default: Claims queue → open a claim → correct a field → send for senior approval), in the Purple brand, light and dark. Record the date, browser and findings in the release notes.

**Keyboard only** (no mouse or trackpad):
- [ ] Every control is reachable with Tab / Shift+Tab, in reading order, with a visible focus ring.
- [ ] Enter / Space activate; Esc closes overlays and focus returns to the trigger.
- [ ] Row shortcuts (↑/↓, j/k, x, Enter) work and never fire while typing.
- [ ] Nothing traps focus except open dialogs and sheets.

**VoiceOver** (macOS Safari; VO = Ctrl+Option):
- [ ] VO+U rotor: headings form an outline; landmarks are named; form controls all have labels.
- [ ] Table: column headers are read with each cell; sort state is announced.
- [ ] Status, confidence and SLA are read as words, not only colour.
- [ ] Live updates (bulk result, follow-up done, correction saved) are announced once.
- [ ] Truncated values read the full text; icon-only buttons read their purpose.

Anything found by hand gets a test or story that would have caught it (`a11y-audit` skill), so it is checked automatically from then on.

## Exceptions
If an a11y rule must be disabled, disable only that rule on that story or line, with a comment saying why and what compensates. Lint exceptions are `oxlint-disable-next-line <rule> -- <reason>`; unused ones fail the lint. Log it in `docs/ai-log.md` if AI introduced it.
