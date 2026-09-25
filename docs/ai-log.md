# AI log

Notable things AI got wrong, how they were caught, and the fix.

## Pages base path casing
- **What went wrong:** Asked to set the Pages base to "ds-engine", the AI applied `/ds-engine/` literally even though it knew the GitHub repo is `DS-engine`. Pages paths are case-sensitive, so assets would have 404'd. It flagged the problem afterwards instead of matching the repo name up front.
- **How it was caught:** The AI raised it after the edit. The human confirmed the intent was to match GitHub.
- **Fix:** Checked the exact repo name via the GitHub API and set `base: '/DS-engine/'`.
- **Lesson:** When a value must match an external system, verify it against that system before editing, not after.
