---
name: a11y-audit
description: Accessibility audit of a DS-Engine screen or component in a real browser - axe in both themes, a keyboard-only pass, focus, names and roles, reflow at 375px and 200% zoom. Use after building or changing a screen, before a release, or when asked to check accessibility.
---

# Accessibility audit

Automated checks catch about a third of issues. This skill adds the browser passes a gate can't do. Rules: `docs/design-system/accessibility.md`.

## 1. Automated (must be green first)
- Component: `npx vitest run --project components --project components-dark <Name>.browser.test.tsx` and the story tests.
- Screen: `npx playwright test e2e/a11y.spec.ts` (axe per screen, Default and Purple, light and dark).

## 2. In the browser
Open the app (`npm run build && npm run preview`, or the Playwright MCP / the desktop app's browser) on the screen.
- **Keyboard only:** Tab through the whole screen. Every control is reachable, in reading order, with a visible focus ring. Enter/Space activate; Esc closes overlays and focus returns to the trigger. Shortcut keys (↑/↓, j/k) don't fire while typing in an input.
- **Names and roles:** read the accessibility tree. Every button, link and input has a name that makes sense out of context. Headings form an outline. Tables have header cells. Live regions announce changes (bulk results, follow-up done).
- **Colour:** status, confidence and SLA always have text or an icon besides colour.
- **Reflow:** 375px wide and 200% zoom: no sideways page scroll, nothing cut off, targets at least 24×24.
- **Motion:** with reduced motion on, nothing animates that carries meaning.

## 3. Report
`screen/component: issue → WCAG criterion → fix`, worst first. Missing automated coverage for an issue found by hand → propose the test or story that would have caught it.

Manual screen-reader pass (VoiceOver) is done by a person, per the checklist in `accessibility.md`.
