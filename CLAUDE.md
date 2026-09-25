# CLAUDE.md

Project context and build order: `docs/HANDOFF.md`. Read it at the start of a new task.

## Communication
- Report only the bare minimum of what was done. No explanations of code unless asked.
- Use plan mode for multi-file or structural changes. Wait for approval.
- Ask before adding dependencies not listed in HANDOFF.md.

## Commands
- `npm run dev`: app dev server (base `/DS-engine/`)
- `npm run build`: typecheck + app build to `dist/`
- `npm run lint`: oxlint
- `npm run storybook` / `npm run build-storybook`: CI builds Storybook into `dist/storybook`
- `npm run build:tokens`: `tokens/*.json` → `src/styles/tokens.css` (commit the result; CI fails if it drifts)
- Add shadcn components: `npx shadcn@latest add <name>`

## Hard rules
- **Tokens only.** No hardcoded colors, spacing, radii, font sizes or shadows. Use semantic tokens; never primitives in components.
- **Never edit `src/styles/tokens.css`.** It is generated. Change `tokens/*.json` and rebuild.
- **Reuse before creating.** Check `src/components/ui/` and `docs/design-system/components.md` first. Build on shadcn/Radix, never from scratch when a primitive exists.
- **Every component** gets Storybook stories covering all states (default, hover/focus, disabled, loading, empty, error, long content) in light/dark and both densities.
- **Accessibility:** semantic elements, full keyboard support, visible focus, labels on all inputs, status never communicated by color alone. Stories must pass addon-a11y.
- **Data-heavy UI:** right-align numbers, tabular figures, truncate with full value available, design for 1,000 rows and missing fields.
- After adding or changing a component, update `docs/design-system/components.md`.
- Log notable AI mistakes (yours included) in `docs/ai-log.md`: what went wrong, how it was caught, fix.

## Pointers
- Tokens: `docs/design-system/tokens.md`
- Components + Figma→code mapping: `docs/design-system/components.md`
- Patterns: `docs/design-system/patterns.md`
- Accessibility: `docs/design-system/accessibility.md`
- Skills: `.claude/skills/` (new-component, sync-tokens, ui-review)
