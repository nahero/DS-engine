# Components

Check this list and `src/components/ui/` before building anything. New components follow the `new-component` skill; update this file when a component is added or changed.

Figma library: **Obra shadcn ui kit (community edition)**, published to the team (file `dbk2ali9ax6GIGOOXNr2gp`). Kit components are suffixed `- Nova`.

## Inventory

| Component | Code | Built on | Figma (Obra) | Status | Stories |
|---|---|---|---|---|---|
| Button | `src/components/ui/button.tsx` | shadcn Button (Radix Slot) | `Button - Nova` | Exists. Colours/type follow tokens; **sizing not aligned** with the kit yet | Placeholder (Default, Disabled) |
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
| Size | Default / Small / Large / Extra small | `size="default"` / `"sm"` / `"lg"` / `"xs"` |
| State | Hover & Active · Focus · Disabled · Invalid | `:hover`/`:active` · `:focus-visible` · `disabled` · `aria-invalid` |
| Show left icon / Show right icon + icon swap | on/off, Lucide icon | Lucide icon as a child before/after the label |
| Show spinner | on/off | Planned `loading` prop (not built) |

Kit sizing (not yet in code):

| Size | Height | Padding (y / x) | Gap | Radius | Text |
|---|---|---|---|---|---|
| Large | 36px | 8 / 10px | 6px | 10px (`control`) | 14px |
| Default | 32px | 6 / 10px | 6px | 10px (`control`) | 14px |
| Small | 28px | 4 / 10px | 6px | 8px | 14px |
| Extra small | 22px | 3 / 8px | 6px | 8px | 12px |

Icon-only buttons map to `Icon Button - Nova`.
