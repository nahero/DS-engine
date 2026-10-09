# Patterns

The product is a concept **insurance claims admin**: an AI agent pre-processes incoming claims, a handler checks, corrects and approves them. Patterns below apply to both screens. Components are listed in `components.md`; accessibility rules in `accessibility.md`.

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

## Worklist (My assigned)
The handler's own caseload. It answers "what do I do next, and what am I waiting for?". Logic lives in `src/lib/worklist.ts`.

- **Groups, in order:**
  - **Act now:** it is my move, and the deadline is today or past, a follow-up is due, or something just came back.
  - **Ready for you:** my move, not urgent.
  - **Waiting on others:** collapsed by default.
- **Row anatomy:** policyholder (bold) + "New" marker · claim # and line of business (muted) · next action · deadline · stage · payable amount (bold, right-aligned) · the whole row opens the claim.
- **Next-action vocabulary** (always a verb phrase, with an icon):

| Situation | Text |
|---|---|
| New claim | Call the policyholder (first contact) |
| Agent failed | Enter fields manually (agent failed) |
| Fields to fix | Verify 2 low-confidence fields, 1 missing |
| Payable above the handler's limit | Send for senior approval |
| Ready to decide | Decide payout €5,950.00 |
| Approved | Release payment €360.00 |
| Something came back | Review new document: discharge letter · Review senior approval decision · Review policyholder reply |
| Waiting, follow-up due | Chase discharge letter · follow-up 2 Oct |
| Waiting | Awaiting discharge letter from policyholder · since 3 d · Awaiting senior approval · sent 2 d ago |

- **Deadlines name the clock:** "First contact due in 1 d", "Decision overdue 2 d", "Payment due today".
- **Stage:** five steps with a text label (Assigned, Coverage, Assessment, Decision, Payment).
- **Today strip:** four counts that toggle a filter (Overdue, Due today, Ready for you, Waiting on others) and one workload line. No charts.
- **Side panels:** "Since you were last here" (events on my claims, new first) and "Follow-ups" (dated reminders: Done, Snooze 2 d).
- **No decisions inline.** Approve, deny and refer happen on the claim, next to the evidence.
- **States:** loading, no claims assigned, all caught up (only waiting claims left), error, missing amount ("—" + "Missing").

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
