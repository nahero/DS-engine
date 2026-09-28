---
name: new-component
description: Build or rework a UI component in DS-Engine (shadcn/Radix base, semantic tokens only, matched to the Obra Figma kit, full-state Storybook stories, a11y clean, components.md updated). Use for any new component in src/components/ui or src/components/review, or when changing an existing one's API or styling.
---

# New component

Follow in order. Stop and ask if a step reveals a decision that is the user's (API shape, a new dependency, deviating from the kit).

## 1. Check what exists
- Read `docs/design-system/components.md` (inventory + Figma mapping) and list `src/components/ui/`.
- If the component or a close one exists, extend it instead of creating a new one.
- Read `docs/design-system/patterns.md` for where it's used and which states it needs.

## 2. Read the Figma component
- Library: Obra shadcn kit, file `dbk2ali9ax6GIGOOXNr2gp`, library key in `docs/HANDOFF.md` / memory. Kit components end in `- Nova`.
- Find it: `search_design_system` (one query per call) or `use_figma` read-only on the library page (load the `figma-use` skill first).
- Record: variant properties and options, per-size height / padding / gap / radius / font size, bound variables (which `shadcn colors/*`, `radius-*`, typography vars).
- Never write to the library file.

## 3. Build on a primitive
- If shadcn has it: `npx shadcn@latest add <name>`. Otherwise compose Radix primitives. Never from scratch when a primitive exists.
- Project composites go in `src/components/review/`, generic ones in `src/components/ui/`.
- New npm dependency not in HANDOFF.md → ask first.

## 4. Style with tokens only
- Semantic utilities from `docs/design-system/tokens.md` (`bg-surface`, `text-fg-muted`, `h-control`, `rounded-control`, `duration-fast`…). shadcn names (`bg-primary`) are fine inside shadcn files.
- No hex, rgb, arbitrary values (`[13px]`), primitive colours, numeric `duration-*`, or Tailwind default palette.
- Match the kit's sizing from step 2. If a kit size has no token, prefer the nearest token and note the difference in `components.md`; ask if the gap is visible.
- Density: use `h-control` / `h-row` / `px-cell` / `text-body` where size should follow density.
- Data display: numbers right-aligned + `tabular-nums`; truncate with the full value in a tooltip and accessible name; handle missing values (`—` + "Missing").

## 5. Accessibility
- Semantic element, full keyboard support, visible `:focus-visible` ring, label or `aria-label`, status never by colour alone. See `docs/design-system/accessibility.md`.
- New text/boundary colour role → add pairs to `scripts/check-contrast.js`.

## 6. Stories (`<name>.stories.tsx` next to the component)
- One story per state: Default, Hover/Focus (use `parameters.pseudo` if available, else a play function that focuses), Disabled, Loading, Empty, Error, Long content (long labels, 1,000 rows for tables), Missing data where relevant. Plus every variant and size.
- Light/dark and both densities come from the toolbar; check each. Reduced motion via the Motion toolbar if it animates.
- `npm run storybook`: Accessibility panel must show no violations.

## 7. Document and verify
- Update `docs/design-system/components.md`: inventory row (status, stories) and the Figma → code mapping table for the component.
- `npm run lint`, `npm run build`, `npm run build-storybook`.
- Run the `ui-review` skill on the diff and fix findings.
- Log notable AI mistakes in `docs/ai-log.md`.
