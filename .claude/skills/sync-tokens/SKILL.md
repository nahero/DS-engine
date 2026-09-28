---
name: sync-tokens
description: Re-export DS-Engine design tokens from the Obra Figma kit into tokens/figma/, rebuild tokens.css/tokens.ts, run the contrast check and verify the shadcn/Tailwind mapping. Use when Figma variables changed, when asked to sync/refresh/re-export tokens, or after editing hand-owned token JSON.
---

# Sync tokens

Background: `docs/design-system/tokens.md`. Figma is read-only here; nothing is written to Figma.

## 1. Export from Figma (skip if only hand-owned JSON changed)
1. Load the `figma-use` skill (MCP resource `skill://figma/figma-use/SKILL.md`) before calling `use_figma`.
2. Run `use_figma` on the library file `dbk2ali9ax6GIGOOXNr2gp` with the full contents of `scripts/figma-export.js` as `code` (it ends with `return JSON.stringify(...)`).
   - If the result is cut off (tool output limit ≈ 20 kB), export in parts: temporarily change the last line to return one key (`primitive`, `kit.light`, `kit.dark`) per call and merge.
3. Save the returned JSON verbatim to the scratchpad, then `node scripts/write-figma-tokens.js <file>`.
4. New hue needed by a semantic token? Add it to `HUES` in `scripts/figma-export.js` and re-export; don't hand-add primitives.

## 2. Build and check
- `npm run build:tokens`: Style Dictionary (warnings fatal) then `scripts/check-contrast.js`.
- Contrast failure → fix in `tokens/semantic.light.json` / `semantic.dark.json` (never in `tokens/figma/`), add a row to the "Where we differ from the kit" table in `tokens.md`, log it in `docs/ai-log.md`.
- Collision or unresolved reference → a Figma rename; update the semantic alias, don't rename the export.

## 3. Verify the mapping
- `git diff src/styles/tokens.css`: look for removed or renamed `--ds-*` variables.
- Every `var(--ds-…)` in `src/styles/globals.css` must still exist in `tokens.css`:
  `for v in $(grep -oE -- 'var\(--ds-[a-z0-9-]+' src/styles/globals.css | sed 's/var(//' | sort -u); do grep -q -- "$v:" src/styles/tokens.css || echo "MISSING $v"; done`
- Kit roles added/removed → update `tokens.md` and, if shadcn uses them, `globals.css`.
- `npm run build` and `npm run build-storybook`; glance at *Foundations/Tokens* in both themes and densities.

## 4. Commit
Commit `tokens/**`, `src/styles/tokens.css`, `src/styles/tokens.ts` together (CI fails on drift). Message says what changed in Figma.
