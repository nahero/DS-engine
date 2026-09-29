# Figma file map

Read this before any Figma work; update it after any session that changes the files. Tokens and the push/export flow: `tokens.md`. Figma → code component mapping: `components.md`.

## Files
| File | Key | Role |
|---|---|---|
| Obra shadcn ui kit (community edition), team copy | `dbk2ali9ax6GIGOOXNr2gp` | Library: kit components + all variable collections. Published to the team ("New Team", Pro). |
| DS-Engine-Main | `LbYcGPXhnrMBahsdvBJ2HI` | Working file: designs built from library instances. One page (`Page 1`). |

Access: Figma MCP (`plugin:figma:figma`), `whoami` = igor023@gmail.com, Full seat. Load the `figma-use` skill before `use_figma`.

## Variable collections (library file)
| Collection | Modes | Owner | Notes |
|---|---|---|---|
| `raw tailwind colors` | 1 | Kit | Primitives (`tw-raw/<hue>/<step>`). Exported to `tokens/figma/primitive.json` (selected hues only). |
| `spacing`, `border radii`, `typography`, `shadows` | 1 | Kit | Primitives. Exported. |
| `shadcn colors` | shadcn, shadcn-dark | Kit, **re-pointed by us** | Adapter: 26 variables (`general/*`, `focus/ring`, `sidebar/*`) alias DS Semantic / DS Component in both modes. `alpha/*` overlays and `focus/ring error` keep kit values. Pre-rebind values: `scripts/figma-kit-colors-backup.json`. |
| `theme` | 1 | Kit | Neutral ramp + chart colours; untouched. |
| DS Brand | Default, Purple | Us | Per-theme roles; hidden from pickers. |
| DS Semantic | Light, Dark | Us | All semantic colours. Code syntax = CSS variable. |
| DS Density | Comfortable, Compact | Us | `control/height`, `row/height`, `space/*`, `font/size/body`. |
| DS Component | Default | Us | `card/*`, `dialog/*`. |

Written by `scripts/figma-push.js` (DS collections + adapter); read by `scripts/figma-export.js` (primitives).

## Switching modes on a frame
| Switch | Set on the frame |
|---|---|
| Brand | DS Brand → Default / Purple |
| Light / dark | DS Semantic → Light / Dark **and** `shadcn colors` → shadcn / shadcn-dark (kit components use kit `alpha/*` overlays that follow the kit mode) |
| Density | DS Density → Comfortable / Compact |

Verified 2026-09-29: `Button - Nova` Primary/Secondary/Outline/Ghost/Destructive render correctly in all four brand × mode combinations.

## Kit components in use
Kit component names end in `- Nova`; names starting with `.` are internal parts.

| Component | Library page (id) | Properties |
|---|---|---|
| `Button - Nova` | Button & Icon Button (`1953:9005`) | Size, Variant (Primary/Secondary/Outline/Ghost/Destructive/Link), State, icons, spinner |
| `Card - Nova` | Card (`1953:9007`) | Show header/content/footer, Slot count 1–3; parts `.Card Section - Nova` (Slot, Spacing Default/Small/None, Background, Show border) |
| `Dialog - Nova` | Dialog (`1953:9013`) | Slot, Type (Desktop, Desktop scrollable, Mobile, Mobile full screen scrollable); parts `.Dialog Header - Nova`, `.Dialog Footer - Nova` |
| `Badge` | Badge (`1953:9003`) | Variant (Primary/Secondary/Outline/Ghost/Destructive), State, Label, icons, spinner |

Other relevant pages: Alert Dialog `1953:9001`, Field `1953:9016`, Input `1953:9018`, Progress `1953:9023`, Separator `1953:9028`, Table `1953:9036`, Data Table `1999:6573`, Sonner `2047:14487`, Sheet `1953:9029`.

## Designs in DS-Engine-Main
| Node | What | Code |
|---|---|---|
| `8:864` | `Card - Nova` instance (in progress) | — |

## Rules for designs
- Use library instances; don't detach.
- Custom layers: bind colours to DS Semantic / DS Component, spacing to DS Density, radius to DS Component or kit radii. No raw hex.
