# Tokens

Source of truth: DTCG JSON in `tokens/`. `npm run build:tokens` turns it into `src/styles/tokens.css` (CSS custom properties, prefix `--ds-`) and `src/styles/tokens.ts` (motion values for JS), then runs the contrast check. `globals.css` maps the result to Tailwind utilities and shadcn variables.

## Tiers

| Tier | Example | File | Owner |
|---|---|---|---|
| Primitive | `color.neutral.900`, `space.4`, `radius.lg` | `tokens/figma/primitive.json` | Figma (Obra shadcn kit), exported |
| Semantic | `color.action.primary.base`, `radius.control` | `tokens/semantic*.json`, `density.*.json`, `motion.json`, `brand.<theme>.json` | Us, hand-edited |
| Component | `card.bg`, `dialog.radius` | `tokens/component.json` (selective) | Us, hand-edited |

- Primitive → semantic → component. Each tier references only the tier above it; components use semantic or component tokens, never primitives.
- Brand (`brand.<theme>.json`) holds only the roles that change per theme (primary action base/hover/fg, focus), each with a light and a dark value. Semantic `action.primary.*`, `fg.on-action` and `border.focus` alias `brand.<mode>.*`, so theme and light/dark switch independently. Brand values alias primitives.
- `tokens/figma/*` is never hand-edited; re-export with the `sync-tokens` skill. Motion and density are designed in code; Figma doesn't have them.

### shadcn adapter
`globals.css` maps shadcn variable names (`--background`, `--primary`, `--card` …) onto semantic tokens, or component tokens where they exist (`--card` → `--ds-card-bg`, `--popover` → `--ds-dialog-bg`). It is an adapter, not a tier. In Figma, the kit's `shadcn colors` variables alias DS Semantic / DS Component the same way (see `figma.md`).

## Naming
- Pattern: `<category>.<role>.<variant>.<state>`, e.g. `color.action.primary.hover`, `color.status.warning.bg`. Names describe a **role**, never a value or scale step: `font.weight.heading`, not `font.weight.medium`. Reusing a primitive's path overwrites it (see `docs/ai-log.md`, font weight collision).
- Component tokens: `<component>.<property>`, e.g. `card.bg`, `dialog.radius` (CSS: `--ds-card-bg`).
- Colour roles: `bg.*` (canvas, surface, surface-raised, subtle, inverse, accent), `fg.*` (default, muted, subtle, inverse, on-action, accent), `border.*` (default, strong, focus), `action.{primary,secondary,danger}.{base,hover,fg}`, `status.{info,success,warning,danger,neutral}.{bg,fg,border}`, `confidence.{high,medium,low}` (marks only, 3:1; confidence text uses `status.*.fg`), `chart.1–4` (categorical series: blue, amber, green, violet), `highlight.citation.{bg,border}`.
- Size roles: `radius.{inner,control,surface,overlay}`, `shadow.{raised,overlay}`, `font.size.{label,caption,body,body-lg,heading-sm,heading-md,heading-lg,display}`, `control.height` (36px comfortable = kit Large, 32px compact = kit Default), `row.height`, `space.{inset,stack,cell}`.
- New utility names for text size, radius, shadow or spacing must also be registered in `src/lib/utils.ts`, or `cn()` mis-merges them.

## Component token policy
- Add one only where a component needs its own setting or a place to theme it independently of other components.
- They reference semantic tokens only, never primitives.
- Currently: `card` and `dialog`.

## Modes
| Mode | Selector | Source |
|---|---|---|
| Light + comfortable (default) | `:root` | `semantic.light`, `component`, `density.comfortable` |
| Dark | `.dark` on `<html>` | `semantic.dark` |
| Compact | `[data-density="compact"]` | `density.compact` |
| Brand theme | `[data-theme="<name>"]` on `<html>`; none = default | `brand.<name>` (default: `brand.default`) |
| Reduced motion | `prefers-reduced-motion` or `[data-motion="reduced"]` | `globals.css` (see `motion.md`) |

Override blocks only contain tokens whose value differs from `:root`. Values are CSS references (`var(--ds-color-bg-surface)`), so a `.dark` override of a semantic token also changes every component token that points at it. This relies on `.dark` sitting on `<html>`, as addon-themes and the app do.

Every switch is independent: each block redefines only its own variables, in one `tokens.css`. A new theme is a new `tokens/brand.<name>.json`; the build adds its block and the contrast check covers it in both modes automatically.

## Figma collections (code → Figma)
Our layers live in the Obra library file next to the kit's collections, which stay untouched:

| Collection | Modes | Contents |
|---|---|---|
| DS Brand | Default, Purple (one per `brand.*.json`; Pro plan allows 4) | `light/*`, `dark/*` brand roles; hidden from pickers |
| DS Semantic | Light, Dark | all `color.*` semantic roles, aliasing primitives or DS Brand |
| DS Density | Comfortable, Compact | `control/height`, `row/height`, `space/*`, `font/size/body` |
| DS Component | Default | `card/*`, `dialog/*`, aliasing DS Semantic / DS Density; `dialog.shadow` is code-only (Figma has no shadow variables) |

- Designers set the three moded collections on a frame (Layer panel → variable modes).
- Each variable's Dev Mode code syntax is its CSS variable (`var(--ds-color-bg-canvas)`); scopes limit pickers (fills, text, stroke, gap, size).
- Push after changing hand-owned tokens: `node scripts/figma-push-payload.js > <payload.json>`, then run `scripts/figma-push.js` via `use_figma` with the payload in place of `__PAYLOAD__`. It creates or updates by name, never deletes, and reports orphans and literal values. Then publish the library in Figma.
- The push also re-points the kit's `shadcn colors` variables at DS tokens (the adapter), from the same mapping as `globals.css`.
- Not yet in Figma: radius, type, shadow and motion roles (except card/dialog radius via DS Component).
- Mode switching and file details: `figma.md`.

## Tailwind utilities
Tailwind's default palette, type scale, radii, shadows and easings are removed (`--*: initial` in `globals.css`), so only token-backed utilities exist.

| Need | Utilities |
|---|---|
| Surfaces | `bg-canvas`, `bg-surface`, `bg-surface-raised`, `bg-subtle`, `bg-inverse` |
| Text | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-inverse`, `text-fg-on-action` |
| Borders | `border-border`, `border-border-strong`, `ring-border-focus` |
| Actions | `bg-action-primary`, `hover:bg-action-primary-hover`, `text-action-primary-fg` (same for `secondary`, `danger`, `danger-soft`) |
| Status | `bg-status-warning-bg`, `text-status-warning-fg`, `border-status-warning-border` (info, success, warning, danger, neutral) |
| Confidence, citation, charts | `bg-confidence-high/medium/low`, `bg-citation-bg`, `border-citation-border`, `fill-chart-1…4` / `var(--chart-1…4)` |
| Density-aware sizes | `h-control`, `h-row`, `p-inset`, `gap-stack`, `px-cell`, `text-body` |
| Type | `text-label` (controls, fixed 14px), `text-caption`, `text-body`, `text-body-lg`, `text-heading-sm/md/lg`, `text-display`; `font-normal/medium/semibold/bold` (role weights) |
| Radius, shadow | `rounded-inner`, `rounded-control`, `rounded-surface`, `rounded-overlay`; `shadow-raised`, `shadow-overlay` |
| Spacing scale | `p-4` etc. still work: `--spacing` is `space.1` (4px) |

shadcn components keep their own names (`bg-primary`, `text-muted-foreground`, `rounded-md` …). `globals.css` points those variables at semantic tokens, so shadcn code needs no edits to follow the tokens. Tailwind's `rounded-sm/md/lg/xl` resolve to inner/control/surface/overlay.

## Where we differ from the kit
The Obra kit's values are the starting point; these differences live in our semantic layer and are enforced by `scripts/check-contrast.js` (text 4.5:1, non-text 3:1, both modes).

| Role | Obra kit default | Ours | Why |
|---|---|---|---|
| `fg.muted`, `fg.subtle` (light) | neutral-500 | neutral-700 / 600 | 4.35:1 on `bg.subtle` |
| `border.focus` | ring: neutral-300 / 700 | neutral-500 / 400 | Kit ring ≈ 1.5:1 |
| `action.danger.fg` (dark) | white | neutral-950 | 2.77:1 on red-400 |
| shadcn `--input` | neutral-200 | `border.strong` (neutral-500) | Input boundaries need 3:1 (WCAG 1.4.11) |

## Changing tokens
- **Hand-owned** (semantic, component, density, motion): edit the JSON, `npm run build:tokens`, commit JSON and generated files. CI fails if the generated files drift or contrast fails.
- **From Figma**: `sync-tokens` skill.
- New role: add it to both `semantic.light.json` and `semantic.dark.json`, map a utility in `globals.css`, add pairs to `scripts/check-contrast.js` if it carries text or a boundary, update this file.

## Brand accent
`brand.*.accent` / `accent-fg` → `bg.accent` / `fg.accent` → shadcn `--accent` and `--sidebar-accent`. Used for menu hover, the active sidebar item and selected table rows. Default brand keeps these neutral (same as `bg.subtle`), Purple uses purple 50/900 (light) and 950/100 (dark).
