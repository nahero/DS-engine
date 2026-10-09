/**
 * Sidebar badge counts as plain numbers, so the sidebar never imports the 1,000-row dataset.
 * `src/data/assigned.test.ts` fails when they drift from the data:
 * - queue: claims with status New, In review, Info requested or Reopened
 * - myAssigned: `assignedClaims.length`
 * - referred: open claims (not Paid, Denied or Closed) flagged "Referred for review"
 */
export const navCounts = { queue: 711, myAssigned: 17, referred: 17 } as const
