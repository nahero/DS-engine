# DS-Engine

[![Checks and deploy](https://github.com/nahero/DS-engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/nahero/DS-engine/actions/workflows/deploy.yml)

A design system built end to end, from Figma variables to a working product UI, with an AI-assisted workflow (Claude Code). The concept product is **ClaimDesk**, an insurance claims admin where an AI agent pre-processes claims and a human handler reviews, corrects and approves them.

Every part is public:

| Part | Link |
|---|---|
| **Live app (dashboard)** | https://nahero.github.io/DS-engine/ |
| **Storybook** | https://nahero.github.io/DS-engine/storybook/ |
| **Figma: working file** (screens, DS components, decision notes) | [DS-Engine-Main](https://www.figma.com/design/LbYcGPXhnrMBahsdvBJ2HI/DS-Engine-Main) (view only) |
| **Figma: library** (Obra shadcn kit + DS variable collections) | [Obra shadcn kit, team library](https://www.figma.com/design/dbk2ali9ax6GIGOOXNr2gp/Obra-shadcn-ui-kit) (view only) |
| **Design-system docs** | [`docs/design-system/`](docs/design-system/) |
| **Decision records** | [`docs/decisions/`](docs/decisions/) |
| **Case study** (Figma v1 → v2 → code → tested, with images) | [`docs/case-study.md`](docs/case-study.md) |
| **How I work with AI** | [`docs/how-i-work-with-ai.md`](docs/how-i-work-with-ai.md) |
| **AI mistakes log** | [`docs/ai-log.md`](docs/ai-log.md) |

```
Figma variables ⇄ DTCG JSON → Style Dictionary → CSS variables → shadcn/ui (Radix) → Storybook + app → GitHub Pages
```

---

## 🎨 Figma

- **Library built on the Obra shadcn/ui kit** (community edition), published to the team. Designs use library instances only, never detached.
- **Variable collections owned by the design system**, one switch per axis:
  - `DS Brand`: Default / Purple
  - `DS Semantic`: Light / Dark
  - `DS Density`: Comfortable / Compact
  - `DS Component`: card and dialog tokens
- **Kit re-pointed at our tokens.** The kit's own `shadcn colors` variables alias DS tokens, so every kit component follows brand, light/dark and density without being edited.
- **Three dashboard screens** (Overview, Claims queue, Claim detail), with **design decisions written under each screen**.
- **Versioned progress.** v1 is the screens built from kit parts. v2 is the same screens rebuilt with custom DS components (Confidence indicator, Extracted field row, Payout breakdown), each a variant set with its states.
- **No custom colour without a token.** Every custom layer is bound to a variable, confirmed with an unbound-colour scan after each build step.
- File map, collections and mode switching: [`docs/design-system/figma.md`](docs/design-system/figma.md).

## 🧱 Tokens / variables

- **Three tiers:** primitive → semantic → component. Components only use semantic tokens.
- **Source of truth is DTCG JSON** in [`tokens/`](tokens/):
  - hand-owned: semantic, brand, density, motion and component tokens;
  - [`tokens/figma/`](tokens/figma/): primitives exported from Figma, never hand-edited.
- **Style Dictionary** generates `src/styles/tokens.css` (CSS variables per mode) and `tokens.ts`.
- **Modes in code match Figma:**
  - light/dark: `.dark` class;
  - brand: `data-theme`;
  - density: `data-density`.
- **Tailwind only exposes tokens.** The default palette, type scale, radii and shadows are removed, so `bg-blue-500`-style classes don't exist. The `ui-review` skill flags arbitrary values. shadcn's variable names are a thin adapter onto semantic tokens.
- **WCAG contrast is checked on every build** ([`scripts/check-contrast.js`](scripts/check-contrast.js)): 52 text and non-text pairs plus the chart marks × 2 brands × light/dark. Any failure fails the build.
- **Code ↔ Figma sync** without the Enterprise-only Variables API:
  - scripts run through the Figma MCP (Plugin API): export primitives, push the DS collections, and a read-only parity check ([`scripts/figma-verify.js`](scripts/figma-verify.js));
  - last check: all 77 DS variables plus the kit adapter match code.
- **CI fails if the generated token files drift** from the JSON source.
- Details: [`docs/design-system/tokens.md`](docs/design-system/tokens.md), [`motion.md`](docs/design-system/motion.md).

## 📚 Storybook

The component catalogue. **Stories show states; tests check behaviour** ([decision 0009](docs/decisions/0009-stories-document-tests-test.md)).

- **Sections follow the code:**
  - **Foundations:** every token layer, rendered from the token files;
  - **UI:** shadcn primitives restyled to tokens;
  - **Patterns:** design-system composites mirrored in Figma;
  - **Layout:** the app shell;
  - **Claims:** feature components, kept for reuse in future screens.
- **Every component has stories:** 50 components, 355 stories. CI fails if a component has none.
- **Every state:** default, variants, focus, disabled, invalid, loading, empty, error, long content, missing data.
- **Toolbar switches** for theme (light/dark), brand, density and reduced motion: the same attributes the app uses.
- **The catalogue is tested too.** Every story runs in Chromium twice, in light + comfortable and dark + compact, with axe. A violation fails the build.

## 🧪 Tests

| Layer | Tool | What | Count |
|---|---|---|---|
| Unit | Vitest | Domain logic: needs-attention sort, payout and authority limit, filters, PII masking, formatting, data invariants | 73 |
| Stories | Vitest + `@storybook/addon-vitest`, Chromium | Every story renders, axe-clean, in 2 theme/density modes | 710 |
| Component | Vitest browser mode + `vitest-browser-react`, Chromium | Feature components and screens: bulk approve rule, filters, keyboard navigation, inline correction, senior approval, refer, citations, PII reveal, period select; axe in 2 modes | 374 |
| End-to-end | Playwright | Built app: the claim review journey, routing and focus, keyboard-only path, axe on every screen × light/dark × desktop/mobile, no sideways scroll on mobile | 65 |
| Visual | Playwright `toHaveScreenshot` | 3 screens × 2 modes, Linux baselines from CI | 6 |

## ✅ Quality gates (CI)

Nothing deploys unless every check passes ([workflow](.github/workflows/deploy.yml)). Pull requests run the same checks.

| Gate | What it enforces |
|---|---|
| Token drift | Generated `tokens.css` / `tokens.ts` match the JSON source |
| Contrast | 52 text and non-text colour pairs plus chart marks × 2 brands × light/dark meet WCAG AA |
| Lint | oxlint, warnings are errors |
| Typecheck | `tsc -b`, strict |
| Story coverage | Every component has stories |
| Test coverage | Every feature component and screen has component tests |
| Unit, story and component tests | All of the above, in Chromium |
| End-to-end + visual | Playwright against the production build |
| Bundle budget | First-load JS ≤ 145 kB gzip, and the chart library must stay out of it |
| Lighthouse | 3 screens × mobile/desktop: accessibility = 1, best practices ≥ 0.95, layout shift ≤ 0.1; desktop performance ≥ 0.9; mobile LCP ≤ 4 s and blocking time ≤ 600 ms (the mobile score itself is reported, not gated) |

## 📊 The dashboard (ClaimDesk)

Three screens, built from the Figma designs with shadcn/ui on Radix and 1,000 deliberately messy mock claims (long names, missing fields, overdue SLAs).

- **[Overview](https://nahero.github.io/DS-engine/)**
  - KPIs, claims volume by line of business (Recharts, categorical chart tokens, screen-reader data table);
  - "Needs attention" list and recent agent/handler activity.
- **[Claims queue](https://nahero.github.io/DS-engine/#claims-queue)**
  - Sorted by "needs attention" (overdue → agent failed → low confidence → missing data).
  - Filters shown as removable chips, sortable columns with `aria-sort`, pagination for 1,000 rows.
  - Bulk approve is allowed only when every selected claim is High confidence, and the UI says why when it isn't.
  - Full keyboard support: ↑/↓ or j/k to move, x or Space to select, Enter to open.
- **[Claim detail](https://nahero.github.io/DS-engine/#claim-CLM-2026-004817)**
  - Extracted fields with confidence and source citations; a citation opens the cited document.
  - Inline correction: the agent's original value, the editor and the time go into the audit trail.
  - Payout calculation (claimed − deductible, capped at the policy limit).
  - Authority limits: above €10,000 the action becomes "Send for senior approval".
  - Masked PII: revealing it is a logged action.
- **Insurance UI rules applied throughout:**
  - money always has a currency, is right-aligned and uses tabular figures;
  - the dates that decide coverage are kept distinct;
  - fraud flags are worded neutrally;
  - status is never shown by colour alone;
  - a missing value shows "—" with a label.
- **Display menu** in the header (sliders icon): switch theme, brand and density live.

## ⚡ Performance

- **Screens load on demand** (`React.lazy`). The chart library and the 1,000-row dataset are only fetched by the screens that use them.
- **First-load JS: 277.7 kB → 130.4 kB gzip.** The app's own entry file is 22.9 kB.
- **Lighthouse** (median of 3 runs, production build):

| Screen | Desktop performance | Mobile performance | Accessibility | Best practices |
|---|---|---|---|---|
| Overview | 100 | 89 | 100 | 100 |
| Claims queue | 100 | 94 | 100 | 100 |
| Claim detail | 100 | 94 | 100 | 100 |

- Mobile Overview is the one screen below 90: under Lighthouse's 4× CPU throttling the chart costs about 0.8 s to render.
- The mobile score varies between CI machines (0.84 and 0.88 on two runs of the same code), so CI gates on metric budgets instead of the score ([decision 0011](docs/decisions/0011-gate-on-metrics-not-scores.md)).
- Budgets are enforced in CI ([`scripts/check-bundle.js`](scripts/check-bundle.js), [`lighthouserc.json`](lighthouserc.json)).

## ♿ Accessibility

- Target: **WCAG 2.2 AA**.
- Semantic HTML first, full keyboard support, visible focus, labels on every input.
- Status is always shown with text or an icon, never colour alone.
- Checks, all in CI:
  - axe in every story and component test (light and dark);
  - axe on every screen × light/dark × desktop/mobile in end-to-end tests;
  - token contrast.
- Rules and keyboard map: [`docs/design-system/accessibility.md`](docs/design-system/accessibility.md).

## 🤖 AI-assisted workflow

- **Decisions are recorded, not remembered:** [`docs/decisions/`](docs/decisions/) (context, decision, consequences).

- Built with **Claude Code**, driven by written rules rather than one-off prompts:
  - [`CLAUDE.md`](CLAUDE.md): always-on hard rules (tokens only, accessibility, data display, docs updates);
  - [`docs/design-system/`](docs/design-system/): knowledge (tokens, components + Figma→code mapping, patterns, accessibility);
  - [`.claude/skills/`](.claude/skills/): repeatable procedures: `new-component`, `sync-tokens`, `ui-review`.
- **[`docs/ai-log.md`](docs/ai-log.md)** records every notable thing the AI got wrong, how it was caught, and the fix. For example: a contrast check that passed tokens used as text, generator output bypassing tokens, and page overflow from screen-reader-only text.
- Figma work (variables, kit re-pointing, screens, components) is done through the Figma MCP. Figma → code component mapping lives in [`components.md`](docs/design-system/components.md), in place of Code Connect (not available on this plan).

## Stack

Vite · React 19 · TypeScript · Vitest (browser mode) + Playwright (Chromium) · axe-core · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Table · Recharts · Style Dictionary (DTCG) · Storybook 10 (a11y, themes) · Geist · oxlint · GitHub Actions → GitHub Pages

## Repo map

```
tokens/               DTCG JSON (source); tokens/figma/ = exported from Figma
scripts/              contrast check, Figma export / push / verify
src/styles/           generated tokens.css + globals.css (Tailwind theme, shadcn adapter)
src/components/ui/        shadcn primitives, restyled to tokens          (Storybook: UI)
src/components/patterns/  design-system composites, mirrored in Figma   (Storybook: Patterns)
src/components/layout/    app shell: sidebar, header, display menu      (Storybook: Layout)
src/features/claims/      claims feature components + their tests       (Storybook: Claims)
src/screens/              Overview, Claims queue, Claim detail (tested, not storied)
src/lib/                  formatting, claim logic, routes
src/test/                 component-test helpers (render, axe)
e2e/                      Playwright end-to-end, accessibility and visual specs
src/foundations/      token documentation stories
docs/                 design-system docs, decision records, AI log
```

## Run locally

```bash
npm ci
npm run dev            # app at http://localhost:5173/DS-engine/
npm run storybook      # Storybook at http://localhost:6006
npm run build:tokens   # rebuild tokens + contrast check
npm test               # unit, story and component tests
npm run e2e            # Playwright end-to-end (visual checks run on CI Linux)
```

## Constraints and trade-offs

- **Figma Pro, not Enterprise:** no Variables REST API and no Code Connect. Tokens move through Plugin API scripts run via MCP, and the Figma→code mapping is a table in the docs.
- **GitHub Free:** the repo is public so Pages can host the app and Storybook.
- **Concept, not domain expertise:** insurance rules are researched and applied, not claimed as professional practice. All data is fictional.
