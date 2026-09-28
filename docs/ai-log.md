# AI log

Notable things AI got wrong, how they were caught, and the fix.

## Pages base path casing
- **What went wrong:** Asked to set the Pages base to "ds-engine", the AI applied `/ds-engine/` literally even though it knew the GitHub repo is `DS-engine`. Pages paths are case-sensitive, so assets would have 404'd. It flagged the problem afterwards instead of matching the repo name up front.
- **How it was caught:** The AI raised it after the edit. The human confirmed the intent was to match GitHub.
- **Fix:** Checked the exact repo name via the GitHub API and set `base: '/DS-engine/'`.
- **Lesson:** When a value must match an external system, verify it against that system before editing, not after.

## Token name collision (font weights)
- **What went wrong:** The AI named semantic font weights `regular` and `medium`, the same paths as the primitives (`font.weight.regular`), so the tokens overwrote each other.
- **How it was caught:** Style Dictionary's collision check failed the build (warnings are configured as errors).
- **Fix:** Renamed the semantic weights to roles (`body`, `label`, `strong`, `heading`).
- **Lesson:** Semantic names describe roles, never scale steps. Keep build warnings fatal.

## Placeholder palette failed contrast
- **What went wrong:** In the first hand-written light theme, `fg.subtle` on `bg.subtle` measured 4.34:1, below WCAG AA 4.5:1.
- **How it was caught:** A contrast script checked every fg/bg, action and status pair in both modes before anything was committed.
- **Fix:** Moved light `fg.muted` and `fg.subtle` one step darker (neutral 700/600). All pairs now pass.
- **Lesson:** Don't trust "looks fine" palettes. Check contrast as part of the token build (planned for the `sync-tokens` skill).

## Figma kit colours failed contrast
- **What went wrong:** Mapping our semantic tokens straight onto the Obra shadcn kit's variables produced 8 WCAG failures: light `muted-foreground` on `muted` (4.35:1, hitting `fg.muted` and `fg.subtle`), the focus `ring` in both modes (1.48:1 light, 1.46:1 dark), and white text on the dark-mode `destructive` button (2.77:1). The AI predicted the first two while planning; it missed the destructive one.
- **How it was caught:** `scripts/check-contrast.js`, now part of `npm run build:tokens`, failed the build with each pair and ratio.
- **Fix:** Overrides in `tokens/semantic.*.json` only (Figma export stays untouched): `fg.muted`/`fg.subtle` neutral-700/600, focus neutral-500 (light) / neutral-400 (dark), dark danger text neutral-950.
- **Lesson:** A popular UI kit is not an accessibility baseline. Keep the export faithful and fix in the layer we own, with the check in CI.
