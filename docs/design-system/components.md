# Components

Check this list and `src/components/ui/` before building anything. New components follow the `new-component` skill; update this file when a component is added or changed.

Figma library: **Obra shadcn ui kit (community edition)**, published to the team (file `dbk2ali9ax6GIGOOXNr2gp`). Kit components are suffixed `- Nova`.

## Inventory

| Component | Code | Built on | Figma (Obra) | Status | Stories |
|---|---|---|---|---|---|
| Button | `src/components/ui/button.tsx` | shadcn Button (Radix Slot) | `Button - Nova` | Done: kit sizing, soft destructive, `loading` | Default, Variants, Sizes, WithIcons, Focus, Disabled, Loading, Invalid, LongLabel, AsLink |
| Spinner | `src/components/ui/spinner.tsx` | shadcn Spinner (Lucide) | `Spinner` | Used by Button `loading`; static under reduced motion | via Button/Loading |
| StatusBadge | `components/review/StatusBadge.tsx` | shadcn Badge | `Badge` | Done: claim lifecycle → variant, text always shown | pending |
| ConfidenceIndicator | `components/review/ConfidenceIndicator.tsx` | Icon in `confidence.*` (3:1 mark), text in `status.*.fg` (4.5:1) | DS `Confidence indicator` (`55:61`) | Done | pending |
| SlaIndicator | `components/review/SlaIndicator.tsx` | Icon + text, `status.*` fg | — (text in kit cells) | Done: overdue / due today / due in N d / n.a. | All variants |
| FlagLabel | `components/review/FlagLabel.tsx` | Lucide icon + neutral text | — | Done: 6 flags | All variants |
| ActorBadge | `components/review/ActorBadge.tsx` | shadcn Badge | `Badge` | Done: agent / person / system / policyholder | All variants |
| KpiCard | `components/review/KpiCard.tsx` | shadcn Card + Skeleton | `Card - Nova` (Overview KPI row) | Done: default, danger tone, missing, loading | Default, Danger, MissingValue, Loading, NoHint, LongContent, Row |
| ClaimsVolumeChart | `components/review/ClaimsVolumeChart.tsx` | shadcn Chart (Recharts) stacked bars, `chart.1–4` | `Chart` frame + custom bars | Done: legend, totals, tooltip, data table (screen-reader only; "Show data table" reveals it), reduced motion; description derived from the weeks shown | Default, Loading, Empty, Error, SingleWeek, LargeValues |
| NeedsAttentionList | `components/review/NeedsAttentionList.tsx` | shadcn Card + links | `Card - Nova` | Done | Default, Loading, Empty, Error, Long |
| ActivityFeed | `components/review/ActivityFeed.tsx` | shadcn Card + list | `Card - Nova` | Done; wraps below `sm` | Default, Loading, Empty, Error, Long |
| ExtractedFieldRow, ExtractedFieldsTable | `components/review/` | shadcn Table row + ConfidenceIndicator + CitationChip + Input | DS `Extracted field row` (`60:4629`) | Done: Default, Low confidence, Missing, Agent failed, Editing (Enter/Esc), Corrected (audited) | pending |
| PayoutBreakdown | `components/review/` | `<dl>` rows + Separator, Alert, Skeleton; logic in `claim-utils.ts` | DS `Payout breakdown` (`59:1981`) | Done: all 6 states derived from data | pending |
| CitationChip | `components/review/` | Badge-style button + Tooltip | `Badge` | Done: opens Documents tab, highlights cited doc (`citation.*`) | pending |
| ClaimHeader, ClaimSummary, AgentSummary, AuditTrail, CoverageChecks, DocumentList | `components/review/` | Card, Tabs, Badge, Button | Claim detail frame (`50:77`) | Done: approve / senior approval / refer / request info flows, PII reveal audited | pending |
| ClaimsTable, FilterBar, BulkBar | `components/review/` (+ `queue-utils.ts`) | shadcn Table + TanStack Table v9, Input, Select, Checkbox, Pagination | `Table Header` / `Table Cell`, `Input - Nova`, `Select` | Done: needs-attention sort, filters + chips, selection, bulk rules, ↑/↓ j/k x Enter keys, 25/50/100 pages | pending |
| AppShell, AppSidebar, AppHeader, DisplayMenu | `components/app/` | shadcn Sidebar, Breadcrumb, Input, DropdownMenu, Avatar | Sidebar parts, `Breadcrumb`, `Input - Nova` | Done. DisplayMenu (theme / brand / density) is code-only, for demoing tokens | AppSidebar ×5, AppHeader ×3, DisplayMenu ×2, AppShell ×3 |
| StateBlock | `components/review/StateBlock.tsx` | Icon + title + description + action | — | Done: one empty / error block (`role="alert"` on error), `size` sm (in cards) / md (whole region), `framed` | pending |
| TruncatedText | `components/review/TruncatedText.tsx` (+ `hooks/use-truncated.ts`) | shadcn Tooltip | — | Done: ellipsis; only when cut off it takes focus and shows the full text | pending |
| PageHeader | `components/app/PageHeader.tsx` | h1 (`text-heading-md`) + subtitle + actions | — | Done: the one h1 size for every screen; optional badges, `titleClassName` (mono claim #) | pending |
| UnavailableButton | `components/app/UnavailableButton.tsx` | Button + Tooltip | — | Done: demo-only controls (Export, bell). `aria-disabled`, stays focusable, tooltip "Not available in this demo" opens on focus | pending |
| UserAvatar | `components/app/UserAvatar.tsx` (+ `data/current-user.ts`) | shadcn Avatar | `Avatar` | Done: `decorative` hides it, otherwise `role="img"` named after the user | pending |
| useDisplaySettings | `lib/use-display-settings.ts` | — | — | Sets `.dark`, `data-theme`, `data-density` on `<html>`, persisted; `index.html` applies it before paint | — |
| Toast | `components/ui/` | shadcn Sonner | `Sonner` | Planned | — |

Screens: `screens/Overview.tsx` (done, stories: Default, Loading, Empty, Error, Stale, Mobile), `screens/ClaimsQueue.tsx`, `screens/ClaimDetail.tsx` (done, stories pending). Routing is hash-based in `App.tsx`; hrefs come from `lib/routes.ts` (`#overview`, `#claims-queue`, `#claim-<id>`). Shared bits for review components: `components/review/shared.ts` (`NBSP`, `ViewState`). Missing data reads "—" + "Missing"; "Not applicable" is only for SLA on closed claims.
shadcn primitives restyled to tokens (card, badge, input, select, sidebar, sheet, breadcrumb, dropdown-menu, avatar, skeleton, tooltip, chart, table, checkbox, pagination, tabs, alert): stories pending (paused by Igor 2026-09-29).

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
