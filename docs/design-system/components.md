# Components

Check this list and `src/components/ui/` before building anything. New components follow the `new-component` skill; update this file when a component is added or changed.

Figma library: **Obra shadcn ui kit (community edition)**, published to the team (file `dbk2ali9ax6GIGOOXNr2gp`). Kit components are suffixed `- Nova`.

## Inventory

| Component | Code | Built on | Figma (Obra) | Status | Stories |
|---|---|---|---|---|---|
| Button | `src/components/ui/button.tsx` | shadcn Button (Radix Slot) | `Button - Nova` | Done: kit sizing, soft destructive, `loading` | Default, Variants, Sizes, WithIcons, Focus, Disabled, Loading, Invalid, LongLabel, AsLink |
| Spinner | `src/components/ui/spinner.tsx` | shadcn Spinner (Lucide) | `Spinner` | Used by Button `loading`; static under reduced motion | via Button/Loading |
| StatusBadge | `components/review/` | shadcn Badge | `Badge` | Planned | — |
| ConfidenceIndicator | `components/review/` | Token-styled meter (Radix Progress if it fits) | — (compose) | Planned | — |
| CitationChip | `components/review/` | shadcn Badge + HoverCard/Popover | `Badge`, `Hover Card` | Planned | — |
| DataTable | `components/review/` | shadcn Table + TanStack Table | `Table - Nova`, `Data Table` page | Planned | — |
| FilterBar | `components/review/` | Input, Select, ToggleGroup, Button | `Input - Nova`, `Select`, `Toggle Group` | Planned | — |
| SidePanel | `components/review/` | shadcn Sheet | `Sheet` | Planned | — |
| Toast | `components/ui/` | shadcn Sonner | `Sonner` | Planned | — |

## Figma → code mapping
Code Connect needs an Org/Enterprise plan, so this table does its job: how a Figma instance's properties translate into code.

### Button (`Button - Nova` → `<Button>`)
| Figma property | Figma value | Code |
|---|---|---|
| Variant | Primary / Secondary / Outline / Ghost / Destructive / Link | `variant="default"` / `"secondary"` / `"outline"` / `"ghost"` / `"destructive"` / `"link"` |
| Size | Large / Default / Small / Extra small | `size="default"` in comfortable / `size="default"` in compact / `"sm"` / `"xs"` |
| State | Hover & Active · Focus · Disabled · Invalid | `:hover`/`:active` · `:focus-visible` · `disabled` · `aria-invalid` |
| Show left icon / Show right icon + icon swap | on/off, Lucide icon | Lucide icon as a child before/after the label |
| Show spinner | on/off | `loading` (also disables, sets `aria-busy`; ignored with `asChild`) |

Sizing. The code's `default` size follows density and covers both kit Large and Default:

| Code size | Kit size | Height | Padding x | Gap | Radius | Text |
|---|---|---|---|---|---|---|
| `default`, comfortable | Large | 36px (`h-control`) | 10px | 6px | 10px `rounded-control` | 14px `text-label` |
| `default`, compact | Default | 32px (`h-control`) | 10px | 6px | 10px | 14px |
| `sm` | Small | 28px | 10px | 6px | 10px (kit 8px) | 14px |
| `xs` | Extra small | 22px | 8px | 6px | 10px (kit 8px) | 12px `text-xs` |
| `icon`, `icon-sm`, `icon-xs` | Icon Button | square, same heights | | | | |

There is no separate `lg`: kit Large is the comfortable default. Small sizes use the control radius (10px) instead of the kit's 8px, since no radius role maps to 8px.

Differences from the kit, on purpose:
- **Hover** uses the `action.*.hover` tokens instead of the kit's 90%/80% opacity.
- **Destructive** follows the kit's soft style (red tint, red text) but with darker text (`action.danger-soft.*`), because the kit's red-600 on the tint is 3.81:1.
- **Focus** is a solid 3px `ring`; shadcn's 50% ring works out to ≈ 1.9:1.
- **Invalid**: 1px `destructive` border + 2px `status.danger.border` ring (kit: `ring error`, same colours).

Icon-only buttons map to `Icon Button - Nova`.
