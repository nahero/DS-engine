# Patterns

The product is a concept UI for **human supervision of AI agent work**: an agent pre-processes incoming submissions, a reviewer checks, corrects and approves them. Patterns below apply to both screens. Components are listed in `components.md`; accessibility rules in `accessibility.md`.

## Review queue (dense table)
- **Default sort: needs attention first**: agent failed → low confidence → missing data → stale → the rest, then oldest first. The sort is visible and changeable.
- **Row anatomy:** select checkbox · reference · submitter (truncated) · status badge · confidence · flag reason · received (relative time, absolute on hover) · amount.
- **Numbers:** right-aligned, `tabular-nums`, same decimals per column. Dates in one format.
- **Truncation:** one line, ellipsis, full value in a tooltip and in the accessible name. Never truncate IDs from the left.
- **Scale:** designed for 1,000 rows. Virtualise or paginate; header stays sticky; row height follows density (`h-row`).
- **Filters** (FilterBar): status, confidence band, flag reason, search. Active filters are shown as removable chips with a result count.
- **Bulk approve:** only enabled when every selected row is high confidence; otherwise the action says why it's disabled.
- **Keyboard:** see `accessibility.md`.

## Item detail
- **Extracted fields:** label · value · confidence indicator · citation chip. Low-confidence and missing fields sort to the top or are visibly marked.
- **Citation chip:** opens the source document at the cited passage, highlighted with `highlight.citation` tokens. The chip names the source (page/section), not just an icon.
- **Correct inline:** edit the value in place; the corrected value, the original agent value and who changed it go into the audit trail.
- **Actions:** Approve (primary), Refer (secondary, needs a reason), Correct (per field). Destructive actions confirm.
- **Audit trail:** chronological, agent and human events distinguished by label and icon, not colour.

## Confidence
- Always shown as **number + label + icon** (e.g. `92% · High`), colour (`confidence.*`) is a secondary cue.
- Bands (placeholder until product decision): high ≥ 90%, medium 70–89%, low < 70%.
- Missing confidence renders as "No score", never as 0%.

## States
Every screen and data-bearing component handles all of these. Stories cover each one.

| State | When | Shows | Tokens |
|---|---|---|---|
| Loading | Fetching | Skeleton at final layout size (no spinner-only screens) | `bg.subtle` |
| Empty | No items / no filter matches | What's empty, why, next action (clear filters) | `fg.muted` |
| Error | Request failed | What failed, retry action, detail on demand | `status.danger.*` |
| Agent failed | Agent couldn't process an item | "Agent failed" badge + reason; item needs manual review | `status.danger.*` |
| Low confidence | Score in low band | Confidence indicator + flag reason | `confidence.low`, `status.warning.*` |
| Missing data | Field absent | `—` plus "Missing" label; never blank | `fg.subtle` |
| Stale data | Data older than threshold or source changed | "Updated 3 h ago" + refresh action | `status.neutral.*` |

## Status badges
Text label always present; icon optional; colour from `status.*`. One badge per concept (don't stack status and confidence in one badge).
