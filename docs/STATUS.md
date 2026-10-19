# Project status

The current state of DS-Engine: what is built, what is in sync, the known differences and the open work. Read this first when picking the project up on another machine. Update it when work lands.

Last updated: 2026-10-19 · harness PR 8 in progress

## Built and live

| Part | State | Where |
|---|---|---|
| Tokens | Primitive (from Figma) → semantic → component; brands Default and Purple; light/dark; comfortable/compact | `tokens/`, [tokens.md](design-system/tokens.md) |
| Figma library | DS variable collections match the token files (`scripts/figma-verify.js`: 129 checked, 0 mismatches). Published. | [figma.md](design-system/figma.md) |
| Figma working file | v1 and v2 pages frozen. v3 (Purple brand) has all four screens: Overview, Claims queue, Claim detail, My assigned, each with decision notes. DS components page has 6 sets: Confidence indicator, Extracted field row, Payout breakdown, Stage indicator, Next action, Stat filter. | [figma.md](design-system/figma.md) |
| App | Overview, Claims queue, Claim detail, My assigned | https://nahero.github.io/DS-engine/ |
| Storybook | Every component in ui, patterns, layout and features | https://nahero.github.io/DS-engine/storybook/ |
| Tests | unit 139 · story 830 · component 544 · e2e 95 · visual 8 baselines | [README](../README.md#-tests) |
| CI | All gates pass before deploy (`.github/workflows/deploy.yml`) | [README](../README.md#-quality-gates-ci) |
| Decisions | 0001–0013 | [decisions/](decisions/README.md) |

## In sync

- Code ↔ GitHub: `main` is pushed, CI green, site deployed.
- Tokens ↔ Figma variables: no token change since the last push to the library.
- Code ↔ Figma screens: v3 matches the app, except the differences below.

## Known differences

**Figma vs code** (small; not worth fixing unless they bother you)
- Header search is centred in Figma (the kit Header uses space-between); in code it sits next to the action icons.
- Stat filter count has no tabular figures in Figma (the Plugin API can't set font features).
- Stat filter focus ring is a layer in Figma, an outline in code.
- My assigned: Done / Snooze buttons sit about 10px further right in Figma (no negative margin in auto layout).
- Claims queue: claimed amount is medium weight in Figma, bold in code (the kit has no bold mono text style).
- Text properties on DS component sets hold one default for the whole set, so the variant gallery shows the same text in every variant; instances override it.

**Inside the code**
- Intermittent: a component-test run sometimes fails to import `src/test/setup.ts` in 12–13 files ("Unexpected token '}'" from a half-written Vite dep file); seen 2026-10-14, 10-16 and 10-18. Every case reused a Vite cache after dependencies or config changed; empty-cache runs (all of CI, every cold local run) never failed. Pre-bundling two runtime deps (PR 4) did not cure it. The agent's Stop gate now always starts from an empty cache (same ~60 s). Locally, if you see it: `rm -rf node_modules/.vite` and re-run. Root cause in Vite/Vitest still open.

## Open work, in order

1. **Harness upgrade** (goal: checks, not the agent, decide when work is done). One PR per step; Igor's go-ahead between PRs. Decisions (2026-10-16/17): PRs for harness work with branch protection (admin bypass for small direct pushes), oxlint `jsx-a11y` (no ESLint), Prettier + Tailwind plugin, exact versions for new dependencies only, visual regression on the first story of each component in Purple light/dark (every story × 4 modes measured at ~50 MB).
   - [x] Step 0: ruleset on `main` (PR + green `checks`, `e2e`, `build`)
   - [x] PR 1: deterministic tests (not reproducible; separate Vite cache for hook runs, see above)
   - [x] PR 2: agent hooks, reviewer subagent, skills, CLAUDE.md rules (ADR 0014)
   - [x] PR 3: jsx-a11y lint, tokens-only check, token validation, explicit strict (ADR 0015)
   - [x] PR 4: Prettier (ADR 0016); pre-bundle fix for the component-test flake
   - [x] PR 5: pre-commit (ADR 0017)
   - [x] PR 6: visual regression per component (ADR 0018)
   - [x] PR 7: CI reporting (job summary table, JUnit and Playwright reports); runners pinned to ubuntu-24.04
   - [ ] PR 8 (in progress): [harness.md](harness.md), manual a11y checklist, demo branches. After it the harness is complete.
2. Igor's review of My assigned (review page: https://claude.ai/artifact/PauGqVydaexSeuU2Gk6Xix). Open question from it: the four counts could be a slimmer strip.
3. Igor's review of the wording in [how-i-work-with-ai.md](how-i-work-with-ai.md).
4. CHANGELOG and a contribution guide.
5. 3-minute walkthrough video.

## Harness audit (Phase 1, 2026-10-14; status updated per PR)

| Layer | Status | Gap |
|---|---|---|
| Types | Present | `strict` explicit (PR 3) |
| Lint | Present | oxlint + `jsx-a11y` (PR 3); Prettier with Tailwind class sorting (PR 4) |
| Token use | Present | `check:token-usage` blocks arbitrary values, colour literals, literal inline styles (PR 3) |
| Tokens | Present | DTCG validation (PR 3), Style Dictionary build, contrast check, drift check |
| Unit / component / stories | Present | `DisplayMenu` and `AppShell` have only 2 stories each |
| Accessibility | Present | addon-a11y set to `error`, axe in component tests and per screen in e2e; manual keyboard + VoiceOver checklist per release (PR 8) |
| Visual regression | Present | 4 screens × 2 modes, plus the first story of 56 components and the Tokens page × Purple light/dark (PR 6) |
| E2E | Present | navigation, claim review, keyboard, My assigned, a11y, visual |
| Pre-commit | Present | simple-git-hooks + lint-staged on staged files (PR 5) |
| CI | Present | runs on push and PR; deploy waits for every job; ruleset on `main`; gate table in the job summary; JUnit, Playwright and Lighthouse reports uploaded (PR 7) |
| Agent harness | Present | hooks (edit → lint/typecheck/token usage, stop → checks + related tests), `ui-reviewer` subagent, protected-test and test-first rules (PR 2) |
| Skills | Present | own: `new-component`, `write-stories`, `sync-tokens`, `ui-review`, `a11y-audit` (`.claude/skills/`) |

Target harness: static checks (strict TS, a11y lint, formatter, hardcoded-value check) · token validation and contrast · unit · stories for every state with `play` interactions · axe fails the run · visual diffs per story across light/dark × densities, so a token change shows every affected component · 2–3 e2e flows · pre-commit · CI blocks deploy · agent hooks so the agent can't report done while checks are red · independent reviewer subagent · manual keyboard + VoiceOver checklist in [accessibility.md](design-system/accessibility.md).

Demo to support at the end: a component change that fails the a11y gate and passes after the fix; a token change that shows visual diffs across many components; CI blocking deploy until all checks are green.

## Working rules

- Harness work: one PR per step, merged when green and Igor agrees. Other work: commit on `main`, push only after Igor confirms.
- Plan mode for multi-file or structural changes; wait for approval.
- Ask before adding a dependency that isn't in the Stack list in the [README](../README.md#stack).
- Igor reviews remotely: share results as artifact pages with screenshots, not localhost.
- The rest is in [CLAUDE.md](../CLAUDE.md).

## Setting up on another machine

```bash
git clone https://github.com/nahero/DS-engine.git && cd DS-engine
npm ci                       # also installs the pre-commit hook
npx playwright install chromium
npm run dev
```

- Node ≥ 22.22.1 (`engines`; CI uses the latest 22).
- Visual baselines are Linux-only; locally `npm run e2e` skips them. Regenerate them with the `Update screenshots` workflow.
- Figma: use the claude.ai Figma connector (`use_figma`). Token scripts in `scripts/` (`figma-export.js`, `figma-push.js`, `figma-verify.js`) run through it. Node ids and frames are in [figma.md](design-system/figma.md).
- The Obsidian vault (project notes, build log) is on Igor's main machine only. This file is the portable summary.
