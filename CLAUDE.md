# CLAUDE.md

Project context, status and decisions live in the Obsidian vault: `/Users/igor/Documents/OBSIDIAN/MinDian/Projects/DS-Engine/overview.md`. Read it at the start of a new task and update it as work lands.

## Communication
- Report only the bare minimum of what was done. No explanations of code unless asked.
- Use plan mode for multi-file or structural changes. Wait for approval.
- Ask before adding dependencies not listed under Stack in the vault overview.

## Commands
- `npm run dev`: app dev server (base `/DS-engine/`)
- `npm run build`: typecheck + app build to `dist/`
- `npm run lint`: oxlint (CI runs `--deny-warnings`)
- `npm run typecheck`: `tsc -b`
- `npm test`: all Vitest projects. `npm run test:unit`: logic (`src/**/*.test.ts`). `npm run test:components`: feature components and screens (`*.browser.test.tsx`, Chromium, light + dark/compact, axe). `npm run test:stories`: every story in Chromium (axe), light + dark/compact
- `npm run e2e`: Playwright against the built app: flows, routing, keyboard, axe per screen, visual regression (Linux baselines; `update-screenshots` workflow regenerates them)
- `npm run check:stories` / `npm run check:tests`: fail if a component has no stories / a feature component or screen has no `*.browser.test.tsx`
- `npm run storybook` / `npm run build-storybook`: CI builds Storybook into `dist/storybook`
- `npm run build:tokens`: `tokens/**/*.json` → `src/styles/tokens.css` + `tokens.ts`, then WCAG contrast check (commit the result; CI fails if it drifts or contrast fails)
- Add shadcn components: `npx shadcn@latest add <name>`

## Hard rules
- **Tokens only.** No hardcoded colors, spacing, radii, font sizes or shadows. Use semantic tokens; never primitives in components.
- **Never edit `src/styles/tokens.css`, `src/styles/tokens.ts` or `tokens/figma/*`.** They are generated (the last from Figma). Change hand-owned `tokens/*.json` or re-export from Figma, then rebuild.
- **Reuse before creating.** Check `src/components/ui/` and `docs/design-system/components.md` first. Build on shadcn/Radix, never from scratch when a primitive exists.
- **Where code goes:** `components/ui` (shadcn primitives), `components/patterns` (design-system composites, mirrored in Figma; may import `ui`, `lib`, data *types* only), `components/layout` (app shell), `features/<domain>` (feature components), `screens` (pages, no stories), `lib` (shared logic and formatting).
- **Stories document, tests test.** Every component in ui / patterns / layout / features gets stories for its states (default, focus, disabled, loading, empty, error, long content, missing data); no multi-step flows in stories. Feature components and screens get `*.browser.test.tsx` for behaviour and flows; cross-screen journeys go in `e2e/`.
- **Accessibility:** semantic elements, full keyboard support, visible focus, labels on all inputs, status never communicated by color alone. Stories must pass addon-a11y.
- **Data-heavy UI:** right-align numbers, tabular figures, truncate with full value available, design for 1,000 rows and missing fields.
- After adding or changing a component, update `docs/design-system/components.md`.
- Log notable AI mistakes (yours included) in `docs/ai-log.md`: what went wrong, how it was caught, fix.
- Notable decisions get a record in `docs/decisions/` (context, decision, consequences); never edit an old one, supersede it.
- CI (`.github/workflows/deploy.yml`) blocks deploy on: token drift, contrast, lint, typecheck, story coverage, unit tests, story tests. Run the same locally before committing.

## Pointers
- Tokens: `docs/design-system/tokens.md`, motion: `docs/design-system/motion.md`
- Components + Figma→code mapping: `docs/design-system/components.md`
- Figma files, collections, mode switching, kit components: `docs/design-system/figma.md` (read before Figma work, update after)
- Patterns: `docs/design-system/patterns.md`
- Accessibility: `docs/design-system/accessibility.md`
- Skills: `.claude/skills/` (new-component, sync-tokens, ui-review)
