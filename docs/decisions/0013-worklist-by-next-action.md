# 0013 — "My assigned" is organised by next action, not by status

**Status:** accepted · 2026-10-09 · exception to the Figma-first order in [0004](0004-insurance-domain-figma-first.md)

## Context
A claims handler owns a caseload from assignment to closure. The Claims queue answers "which claims need someone?". The handler's own page has to answer "what do I do next, and what am I waiting for?". A status such as "In review" doesn't say whose move it is, so a list sorted by status makes the handler re-open claims to find out.

Their day runs in a fixed order: what is overdue or due today, what came back overnight, the claims where the next step is theirs, the follow-ups due on claims stuck with someone else, and a glance at workload.

## Decision
- The caseload is a worklist in three groups: **Act now** (overdue, due today, or something just came back), **Ready for you** (your move, not urgent), **Waiting on others** (collapsed until something is due).
- Every row states the next action in words, derived from what the agent found: "Verify 2 low-confidence fields", "Send for senior approval", "Chase discharge letter · follow-up 2 Oct", "Awaiting senior approval · sent 2 d ago".
- Deadlines name the clock: first contact, decision or payment.
- Four counts at the top (Overdue, Due today, Ready for you, Waiting on others) are filters, not decoration. No charts on a work page.
- "Since you were last here" lists events on the handler's own claims. "Follow-ups" is the diary: dated reminders with Done and Snooze.
- No approve or deny here. A decision needs the evidence, so the row opens the claim. Only safe actions are inline.
- The logic is pure and unit-tested (`src/lib/worklist.ts`); the sidebar count comes from the same data as the page.
- Built in code first and reviewed on a static page with real screenshots, because the review was remote. The Figma frame follows.

## Consequences
- The page needs data a plain claim list doesn't have: who we are waiting for, since when, follow-up dates, and what changed. The mock caseload is curated (17 claims) rather than generated.
- Left out on purpose: reassigning and out-of-office cover, a team view, reserves, saved views.
