# How I work with AI

This project was built with Claude Code. The AI wrote most of the code and did most of the Figma work; I set the direction, reviewed, and decided. This page is the working method: what the AI is told, how the work is split, how it is checked, and what stays with me.

## 1. Instructions are layered, not improvised

| Layer | Where | What it holds |
|---|---|---|
| Always-on rules | [`CLAUDE.md`](../CLAUDE.md) | Hard rules (tokens only, accessibility, data display, where code goes), commands, what CI enforces |
| Knowledge | [`docs/design-system/`](design-system/) | Tokens, components and the Figma → code mapping, patterns, accessibility, motion, the Figma file map |
| Procedures | [`.claude/skills/`](../.claude/skills/) | `new-component`, `sync-tokens`, `ui-review`: step-by-step, repeatable |
| Decisions | [`docs/decisions/`](decisions/) | Why things are the way they are; never edited, only superseded |
| Mistakes | [`docs/ai-log.md`](ai-log.md) | What the AI got wrong, how it was caught, the fix, the lesson |

A prompt is a one-off. A rule in the repo applies to every session, every agent, and every human who reads it.

## 2. Plan first, then build

- Anything that touches several files starts as a written plan: context, approach, files, verification. I approve it before code is written.
- Choices that are mine (a new dependency, a product decision, a trade-off) are asked as questions with a recommendation, not decided silently.
- New dependencies need approval every time. The approved stack is written down.

## 3. One orchestrator, small focused agents

- A stronger model plans, briefs, reviews and decides. It does not do the bulk work.
- Up to two smaller agents build in parallel. Each gets a self-contained brief:
  - exact files it owns, and files it must not touch;
  - the rules that apply (tokens only, accessibility, no new dependencies);
  - what to read first;
  - how to verify its own work, and what to report.
- File ownership is disjoint, so parallel agents don't collide. Shared files (`package.json`, CI) belong to one agent or to the orchestrator.
- Figma work follows the same shape: one agent per screen or component, with the kit's component keys and the variable rules in the brief.

## 4. Nothing is trusted until it is checked

- An agent's "all green" is a claim. The orchestrator runs lint, typecheck, tests and builds itself before reporting.
- UI is checked in the running app, not only in tests: screenshots, light and dark, both densities, the purple brand, 375px, keyboard.
- Accessibility is checked by a machine (axe) on real renders. An automated pass on an empty or unstyled page counts as a failure, not a pass.
- Figma writes are followed by a screenshot and an unbound-colour scan. Code ↔ Figma variables are compared by script ([`scripts/figma-verify.js`](../scripts/figma-verify.js)).
- When a check is missing, the fix includes the check. Most gates in CI exist because of an entry in the AI log.

## 5. Mistakes become gates

| What went wrong | Caught by | Now prevented by |
|---|---|---|
| Kit colours failed contrast | Contrast script | Contrast check in `build:tokens`, in CI |
| Confidence colours passed as marks but were used as text | axe on the Claim detail screen | Text pairs added to the contrast check; axe in story and component tests |
| Dark-mode citation highlight too low-contrast | The dark + compact story test pass | Same pass in CI; pair added to the contrast check |
| shadcn CLI wrote raw colours into `globals.css` | Reading the diff | Tailwind default palette removed; `ui-review` skill; diff review after generators |
| `cn()` dropped a custom text size | DOM dump of the story | Token names registered in `src/lib/utils.ts`; skills flag `from "cn"` |
| Axe "passed" on a crashed, empty story | A human opening the story | Stories run as tests: a render error fails |
| Page scrolled sideways from screen-reader-only text | Measuring `scrollWidth` at 375px | "No sideways scroll" check in end-to-end tests |
| "Every component gets stories" drifted (35 of 48 missing) | A review of rules against the repo | `check:stories` and `check:tests` in CI |
| Storybook became a test harness | A human asking what was documentation | Decision 0009: stories show states, tests check behaviour |
| Wrong chart colours after a bulk Figma rebind | Screenshot after the change | Screenshot after every bulk Figma write |
| Parallel agents broke each other's test run | The failing test list | Full suite runs only after parallel work lands; providers shared between app and stories |

Full entries: [`docs/ai-log.md`](ai-log.md).

## 6. What stays human

- Product and design decisions: the domain, what the screens are for, which trade-off to take.
- Reviewing the Figma screens before they are built in code.
- Publishing the Figma library, and every push to `main`.
- Saying no: stopping work that isn't needed, and asking why something exists.

## 7. What I'd tell someone starting

- Write the rules down before the first component. The AI follows a rule it can read much better than a preference it has to guess.
- Make the machine check the rule. If a rule isn't checked, expect it to drift.
- Keep a mistakes log. It is the most honest view of how the AI behaves on your project, and it tells you which gate to build next.
- Ask for the plan, not the code. Most bad outcomes are visible in the plan.
