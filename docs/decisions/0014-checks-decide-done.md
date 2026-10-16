# 0014: Checks decide when work is done, not the agent

**Status:** accepted · 2026-10-16

## Context
CI already blocks the deploy on every gate (README, Quality gates). But inside the agent loop nothing enforced them: the agent decided when it was "done" and CI found out later, sometimes after a push. Adding more agents doesn't fix that, because an orchestrator and a few agents still trust each other's word. What makes the result reliable is a harness: fast feedback on every edit, a gate the agent can't talk its way past, and a reviewer that didn't write the code.

## Decision
- **Hooks in `.claude/settings.json`**, committed so every session and subagent gets them:
  - Before an edit (`guard-generated.mjs`): editing a generated file (`tokens.css`, `tokens.ts`, `tokens/figma/*`) is blocked, with the source to change instead.
  - After a code edit (`after-edit.mjs`, `.ts/.tsx/.js/.mjs`): lint and typecheck; for token files, the token build and the contrast check. Failures go straight back to the agent.
  - Before the agent stops (`before-done.mjs`), over everything since the branch left `origin/main` (commits included, so committing doesn't skip it):
    - deleted tests, stories or baselines, and added `.skip` / `.only` / `.todo` or a11y `'todo'`, block until a person decides;
    - lint, typecheck, story and test coverage;
    - token build, contrast, and generated token files equal to a fresh build (catches hand edits made outside the Edit tool);
    - the Vitest tests related to the changed files; token, config or script changes run all of them.
  - A tree unchanged since the last green run passes at once; hook runs use their own Vite cache.
  - Not on subagents: read-only subagents can't fix a red tree, and parallel ones would race. Their work comes back to the main agent, whose Stop gate covers it.
- **Independent review:** the `ui-reviewer` subagent reviews the diff with fresh context before a PR, and lists every test or story change separately.
- **Rules in CLAUDE.md:** test-first (states and checks are agreed before building), protected tests (never weakened to pass, always called out).
- **Skills** encode the process: `new-component`, `write-stories`, `sync-tokens`, `ui-review`, `a11y-audit`.
- **Harness work goes through PRs.** A ruleset on `main` requires a PR with green `checks`, `e2e` and `build`. Repository admins can bypass it to push small non-harness changes directly; CI still gates the deploy on `main`.

## Consequences
- Every stop with changed source costs 10–90 s of checks. Unchanged trees cost nothing.
- Claude Code ends the turn after 8 consecutive Stop-hook blocks (hooks reference), so a check that can't go green surfaces to the person instead of looping.
- The hooks are guard rails, not a security boundary: an agent with a shell could forge the green stamp or edit around them. The reviewer, CI and branch protection are the backstops.
- e2e, visual regression and Lighthouse stay in CI; they need a production build and take minutes.
