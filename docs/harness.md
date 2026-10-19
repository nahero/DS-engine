# The harness: checks decide when work is done

AI agents write most of the code in this repo. What makes the result trustworthy is not the agents but the harness around them: checks that run on every edit, a gate that reruns the checks before the agent may finish, a reviewer that didn't write the code, and CI that blocks the merge and the deploy. Decisions: [0014](decisions/0014-checks-decide-done.md)–[0018](decisions/0018-visual-regression-per-component.md).

## The loop

```mermaid
flowchart LR
  E[Agent edits a file] --> G{Generated file?}
  G -- yes --> B1[Blocked: change the source]
  G -- no --> A[After-edit hook<br/>format · lint · typecheck · tokens only<br/>token build + contrast]
  A -- red --> E
  A -- green --> S[Agent wants to stop]
  S --> D[Stop gate<br/>protected tests · lint · types · coverage<br/>token drift · related tests]
  D -- red --> E
  D -- green --> R[ui-reviewer subagent<br/>fresh context, diff only<br/>a CLAUDE.md rule, not enforced]
  R -- findings --> E
  R -- ready --> C[git commit<br/>pre-commit on staged files]
  C -- red --> E
  C --> P[Pull request<br/>CI: every gate + e2e + visual + Lighthouse]
  P -- red --> E
  P -- green --> M[Merge to main<br/>ruleset requires green checks]
  M --> L[Deploy to GitHub Pages]
```

## Layers

| Layer | Where | Runs | Catches | Time |
|---|---|---|---|---|
| Guard: generated files | `PreToolUse` hook | before every edit | hand edits to `tokens.css`, `tokens.ts`, `tokens/figma/*` | instant |
| Guard: hook bypass | `PreToolUse` hook on Bash | before every shell command | the common bypasses: no-verify flag, `git commit -n`, `SKIP_SIMPLE_GIT_HOOKS`, `core.hooksPath` (a heuristic over the command text) | instant |
| After edit | `PostToolUse` hook | after every edit | format; for code: lint (incl. jsx-a11y) and types; in components, features and screens: hardcoded visual values; for token files: validation, build, contrast | 1–5 s |
| Stop gate | `Stop` hook | when the agent wants to finish, if code, tokens or config changed since the branch left `main` (commits included) | deleted tests, stories or baselines and unconditional skips, `.only`, `.todo`; format, lint, types, tokens only, story and test coverage; token build and drift when token files changed; the tests related to the changes (all of them for token or config changes) | 10–90 s |
| Independent review | `ui-reviewer` subagent | before a PR | design-system rules, accessibility, weakened tests, bugs in the gates themselves | 2–4 min |
| Pre-commit | `simple-git-hooks` + `lint-staged` | every commit, by anyone | format, lint, types, tokens only, token drift + contrast | seconds |
| CI | GitHub Actions | every PR, and pushes to `main` | token validation, drift, contrast, format, lint, types, tokens only, coverage; unit tests; component and story tests in light and dark; e2e, axe on every screen, visual regression (screens + components), bundle budget, Lighthouse | 10–20 min |
| Branch protection | ruleset on `main` | merge | a PR whose `checks`, `e2e` and `build` aren't green (repository admins can bypass) | — |
| Manual | [accessibility.md](design-system/accessibility.md#manual-checks-per-release) | per release | keyboard-only and VoiceOver pass on one key flow | 20 min |

Every layer is cheaper than the next, so most problems are fixed seconds after they are made. CI is the backstop, not the first line.

## Why not just an orchestrator and a few agents?

| | Orchestrator + agents | Harness |
|---|---|---|
| Who decides "done" | the agent that did the work, or the orchestrator reading its summary | checks that ran on the actual files |
| When problems show up | at review or in CI, after a push | on the edit that caused them |
| A wrong claim ("tests pass") | trusted | the Stop gate reruns the checks; after 8 blocks in a row the turn ends and a person takes over |
| Weakening a test to pass | invisible in a summary | deleted or switched-off tests are blocked until a person decides; a loosened tolerance or removed assertion is the reviewer's job (it lists every test change) |
| Review | another agent that shares the context and the assumptions | a reviewer with fresh context and only the diff |
| Rules | in prompts, followed when remembered | mostly in hooks, CI and branch protection; the rest (independent review, test-first) are CLAUDE.md rules |
| Adding more agents | more output to check | each agent hits the same gates |

The agents are interchangeable. The harness is what the team owns.

## Evidence from building it

The harness was built with the same agents it now constrains (PRs #2–#8), and it caught them:

- **The reviewer found 47 issues in six PRs** (#2–#7; each PR description lists them), in harness code the author had tested. Among them: the Stop gate passed once work was committed, token validation skipped references inside shadows, the tokens-only scan stopped at `//` inside a URL, adding test reporters silently dropped GitHub annotations.
- **The after-edit hook** stopped a lint error in a new script one edit after it was written ([ai-log](ai-log.md)).
- **The Stop gate** refused to let a turn end over conditional `test.skip` calls; the agent asked instead of loosening the rule, and the rule was narrowed with tests on Igor's call.
- **The Stop gate** caught an intermittent test failure the agent had called fixed, which led to an honest record of what is and isn't known ([ai-log](ai-log.md)).
- **The Bash guard** blocked the agent's own docs edit that only mentioned the no-verify flag: a false positive, fixed and now covered by tests (`.claude/hooks/guard-bash.test.mjs`).

## Demos

Three branches show the gates live. Each has one commit that breaks something; open a PR from it, watch CI, then push the fix.

1. **Accessibility gate** (`demo/a11y-gate`): the header's Display settings icon button loses its accessible name. The story tests that render it (DisplayMenu, AppHeader, AppShell) fail on axe `button-name` in light and dark; CI's checks job shows **Blocked** and the e2e job doesn't start. Fix: `git revert HEAD` and push; the checks go green.
2. **Token change → visual diffs** (`demo/token-diff`): one semantic token changes, `radius.control` from 10px (`radius.lg`) to square corners (`radius.none`), with the rebuilt token files (pre-commit refuses a token change whose rebuilt files aren't staged). Every check up to e2e stays green; the visual regression fails on the components whose first story shows a control (buttons, inputs, selects, tabs…) and on the screens, and the `playwright-report` artifact holds expected / actual / diff images for each. To accept a deliberate change: run the Update screenshots workflow on the branch, download its artifact, copy its two folders into `e2e/`, commit.
3. **CI blocks the deploy** (`demo/ci-blocks-deploy`): a formatting change rounds money to whole euros. Unit and component tests fail; the PR can't merge without an admin bypass, and nothing deploys. Fix with `git revert HEAD`; the merge button turns green.
