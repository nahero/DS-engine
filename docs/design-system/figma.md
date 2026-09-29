# Figma file map

Read this before any Figma work; update it after any session that changes the files. Tokens and the push/export flow: `tokens.md`. Figma → code component mapping: `components.md`.

## Files
| File | Key | Role |
|---|---|---|
| Obra shadcn ui kit (community edition), team copy | `dbk2ali9ax6GIGOOXNr2gp` | Library: kit components + all variable collections. Published to the team ("New Team", Pro). |
| DS-Engine-Main | `LbYcGPXhnrMBahsdvBJ2HI` | Working file: designs built from library instances. Pages: `Page 1`, `Insurance admin` (`26:50`, v1, frozen), `Insurance admin v2 — DS components` (`50:32`), `DS components` (`50:856`). |

Access: Figma MCP (`plugin:figma:figma`), `whoami` = igor023@gmail.com, Full seat. Load the `figma-use` skill before `use_figma`.

## Variable collections (library file)
| Collection | Modes | Owner | Notes |
|---|---|---|---|
| `raw tailwind colors` | 1 | Kit | Primitives (`tw-raw/<hue>/<step>`). Exported to `tokens/figma/primitive.json` (selected hues only). |
| `spacing`, `border radii`, `typography`, `shadows` | 1 | Kit | Primitives. Exported. |
| `shadcn colors` | shadcn, shadcn-dark | Kit, **re-pointed by us** | Adapter: 26 variables (`general/*`, `focus/ring`, `sidebar/*`) alias DS Semantic / DS Component in both modes. The 40 mode-dependent overlays (`alpha/*/switch/*`, `alpha/white/outline-bg`, `focus/ring error`) alias hidden DS Semantic `kit/*` variables, so this collection's mode no longer matters. Pre-rebind values: `scripts/figma-kit-colors-backup.json`. |
| `theme` | 1 | Kit | Neutral ramp + chart colours; untouched. |
| DS Brand | Default, Purple | Us | Per-theme roles; hidden from pickers. |
| DS Semantic | Light, Dark | Us | All semantic colours. Code syntax = CSS variable. Plus hidden Figma-only `kit/*` overlays (not in code; the push ignores them). |
| DS Density | Comfortable, Compact | Us | `control/height`, `row/height`, `space/*`, `font/size/body`. |
| DS Component | Default | Us | `card/*`, `dialog/*`. |

Written by `scripts/figma-push.js` (DS collections + adapter); read by `scripts/figma-export.js` (primitives).

## Switching modes on a frame
| Switch | Set on the frame |
|---|---|
| Brand | DS Brand → Default / Purple |
| Light / dark | DS Semantic → Light / Dark |
| Density | DS Density → Comfortable / Compact |

One collection per switch; the kit's own `shadcn colors` mode has no effect. Verified 2026-09-29: `Button - Nova` Primary/Secondary/Outline/Ghost/Destructive render correctly in all four brand × mode combinations with only DS Brand and DS Semantic set.

## Kit components in use
Kit component names end in `- Nova`; names starting with `.` are internal parts.

| Component | Library page (id) | Properties |
|---|---|---|
| `Button - Nova` | Button & Icon Button (`1953:9005`) | Size, Variant (Primary/Secondary/Outline/Ghost/Destructive/Link), State, icons, spinner |
| `Card - Nova` | Card (`1953:9007`) | Show header/content/footer, Slot count 1–3; parts `.Card Section - Nova` (Slot, Spacing Default/Small/None, Background, Show border) |
| `Dialog - Nova` | Dialog (`1953:9013`) | Slot, Type (Desktop, Desktop scrollable, Mobile, Mobile full screen scrollable); parts `.Dialog Header - Nova`, `.Dialog Footer - Nova` |
| `Sidebar Item / Expanded / 1st Level - Nova`, `Sidebar Group Label - Nova`, `Sidebar Badge - Nova` | Sidebar (`2047:13020`) | `Sidebar - With Children` can't be re-populated (not a slot) → compose from these parts |
| `Table Header`, `Table Cell` | Data Table (`1999:6573`) | Content Text/Sortable/Checkbox/Slot; compose rows as frames of cells |
| `Chart`, `Legend` | Chart (`1999:12481`) | `Bar chart` Stacked is fixed at 2 series → custom bars in the `Chart` content slot |
| `Tabs (segmented) - Nova`, `Tab (segmented) - Nova` | Tabs (`1953:9037`) | Slot of Tab instances, counter boolean |
| `Badge` | Badge (`1953:9003`) | Variant (Primary/Secondary/Outline/Ghost/Destructive), State, Label, icons, spinner |

Other relevant pages: Alert Dialog `1953:9001`, Field `1953:9016`, Input `1953:9018`, Progress `1953:9023`, Separator `1953:9028`, Table `1953:9036`, Data Table `1999:6573`, Sonner `2047:14487`, Sheet `1953:9029`.

## Designs in DS-Engine-Main
| Node | What | Code |
|---|---|---|
| `8:864` | `Card - Nova` instance (in progress, `Page 1`) | — |
| `28:433` | Insurance admin / 01 Overview | — |
| `37:1673` | Insurance admin / 02 Claims queue | — |
| `38:560` | Insurance admin / 03 Claim detail | — |
| `37:2811`, `37:2814`, `37:2817` | Decision notes under each screen | — |
| `50:32` page | v2: duplicate of v1 with DS components swapped in (03 fields table + payout card, 02 confidence column); notes `50:341/344/347` | — |
| `55:61` | DS `Confidence indicator` set (page `DS components`) | planned |
| `60:4629` | DS `Extracted field row` set | planned |
| `59:1981` | DS `Payout breakdown` set | planned |

v1 (`26:50`) is kept as-is to show progress; changes go to v2.

Screens 02 and 03 are clones of 01: shell = `Sidebar` + `Main` (`Header`, `Body`); screen content lives in `Body`. Modes set explicitly per frame (DS Semantic Light, DS Density Comfortable, DS Brand Default).

## Rules for designs
- Use library instances; don't detach.
- Custom layers: bind colours to DS Semantic / DS Component, spacing to DS Density, radius to DS Component or kit radii. No raw hex.
- `figma.createAutoLayout()` frames get an unbound white fill: set `fills = []` on layout frames.
- Kit slots (Card, Breadcrumb) keep placeholder children: remove them before appending.
- TEXT props can't bind to text inside nested kit instances: expose the nested instance instead (`isExposedInstance`).
- A variant set's default is the top-left variant by position.
