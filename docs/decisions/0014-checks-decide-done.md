# 0014: Checks decide when work is done, not the agent

**Status:** accepted · 2026-10-16

## Context
CI already blocks the deploy on 13 gates. But inside the agent loop nothing enforced them: the agent decided when it was "done" and CI found out later, sometimes after a push. Adding more agents doesn't fix that, because an orchestrator and a few agents still trust each other's word. What makes the result reliable is a harness: fast feedback on every edit, a gate the agent can't talk its way past, and a reviewer that didn't write the code.

## Decision
- **Hooks in `.claude/settings.json`**, committed so every session and subagent gets them:
  - Before an edit (`guard-generated.mjs`): editing a generated file (`tokens.css`, `tokens.ts`, `tokens/figma/*`) is blocked, with the source to change instead.
  - After an edit (`after-edit.mjs`): lint and typecheck; for token files, the token build and the contrast check. Failures go straight back to the agent.
  - Before stopping, for the agent and every subagent (`before-done.mjs`): lint, typecheck, story and test coverage, and the Vitest tests related to the changed files. Token or config changes run everything. While red, the agent can't finish.
  - A tree unchanged since the last green run passes at once; hook runs use their own Vite cache.
- **Independent review:** the `ui-reviewer` subagent reviews the diff with fresh context before a PR, and lists every test or story change separately.
- **Rules in CLAUDE.md:** test-first (states and checks are agreed before building), protected tests (never weakened to pass, always called out).
- **Skills** encode the process: `new-component`, `write-stories`, `sync-tokens`, `ui-review`, `a11y-audit`.
- **Harness work goes through PRs** with branch protection on `main`: a PR needs green `checks`, `e2e` and `build`. Admins can still push small non-harness changes directly; CI still gates the deploy.

## Consequences
- Every stop with changed source costs 10–90 s of checks. Unchanged trees cost nothing.
- Claude Code ends the turn after 8 consecutive blocks, so a check that can't go green surfaces to the person instead of looping.
- e2e, visual regression and Lighthouse stay in CI; they need a production build and take minutes.
