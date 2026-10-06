# AI log

Notable things AI got wrong, how they were caught, and the fix.

## Pages base path casing
- **What went wrong:** Asked to set the Pages base to "ds-engine", the AI applied `/ds-engine/` literally even though it knew the GitHub repo is `DS-engine`. Pages paths are case-sensitive, so assets would have 404'd. It flagged the problem afterwards instead of matching the repo name up front.
- **How it was caught:** The AI raised it after the edit. The human confirmed the intent was to match GitHub.
- **Fix:** Checked the exact repo name via the GitHub API and set `base: '/DS-engine/'`.
- **Lesson:** When a value must match an external system, verify it against that system before editing, not after.

## Token name collision (font weights)
- **What went wrong:** The AI named semantic font weights `regular` and `medium`, the same paths as the primitives (`font.weight.regular`), so the tokens overwrote each other.
- **How it was caught:** Style Dictionary's collision check failed the build (warnings are configured as errors).
- **Fix:** Renamed the semantic weights to roles (`body`, `label`, `strong`, `heading`).
- **Lesson:** Semantic names describe roles, never scale steps. Keep build warnings fatal.

## Placeholder palette failed contrast
- **What went wrong:** In the first hand-written light theme, `fg.subtle` on `bg.subtle` measured 4.34:1, below WCAG AA 4.5:1.
- **How it was caught:** A contrast script checked every fg/bg, action and status pair in both modes before anything was committed.
- **Fix:** Moved light `fg.muted` and `fg.subtle` one step darker (neutral 700/600). All pairs now pass.
- **Lesson:** Don't trust "looks fine" palettes. Check contrast as part of the token build (planned for the `sync-tokens` skill).

## Figma kit colours failed contrast
- **What went wrong:** Mapping our semantic tokens straight onto the Obra shadcn kit's variables produced 8 WCAG failures: light `muted-foreground` on `muted` (4.35:1, hitting `fg.muted` and `fg.subtle`), the focus `ring` in both modes (1.48:1 light, 1.46:1 dark), and white text on the dark-mode `destructive` button (2.77:1). The AI predicted the first two while planning; it missed the destructive one.
- **How it was caught:** `scripts/check-contrast.js`, now part of `npm run build:tokens`, failed the build with each pair and ratio.
- **Fix:** Overrides in `tokens/semantic.*.json` only (Figma export stays untouched): `fg.muted`/`fg.subtle` neutral-700/600, focus neutral-500 (light) / neutral-400 (dark), dark danger text neutral-950.
- **Lesson:** A popular UI kit is not an accessibility baseline. Keep the export faithful and fix in the layer we own, with the check in CI.

## Accessibility pass on an unstyled page
- **What went wrong:** The AI ran axe on every Button story in headless Chrome and reported "no violations". The local Chrome is version 96, which doesn't support CSS `@layer` (needs 99) or Tailwind v4 (needs 111), so every story rendered with browser-default styles. The pass only covered names and roles, not how the buttons actually look.
- **How it was caught:** The AI took screenshots to compare against the kit, and they showed native grey buttons.
- **Fix:** Reported the axe result as limited to structure; colour contrast is covered by the token check; visual review happens in a current browser. Checking the page as rendered also exposed the next bug.
- **Lesson:** Check the render before trusting an automated pass on it. Check the tool's browser version.

## `cn()` silently dropped a custom text size
- **What went wrong:** shadcn's `cn` package (tailwind-merge engine) treated `text-label` as a text colour and removed it next to `text-primary-foreground`. It also didn't resolve `rounded-control` against `rounded-md`. Nothing errored; the class just vanished.
- **How it was caught:** A DOM dump of the rendered story showed the class missing from the button.
- **Fix:** `src/lib/utils.ts` configures `cn` with our token names (text, radius, shadow, spacing), all components import from there, and the `new-component` and `ui-review` skills flag `from "cn"`.
- **Lesson:** Custom Tailwind theme names need registering with the class merger too.

## Button `asChild` crashed after adding `loading`
- **What went wrong:** The `loading` prop put `{loading && <Spinner />}` next to `children` for every render, including `asChild`. Radix Slot needs exactly one child element, so the Button-as-link crashed ("Slot failed to slot onto its children"). That broke the AsLink story and the app's home page. The AI's axe run still reported "no violations": the crashed story rendered nothing, and axe found nothing to flag.
- **How it was caught:** The human opened the AsLink story in the deployed Storybook.
- **Fix:** `asChild` now renders `<Slot.Root>{children}</Slot.Root>` with no extra nodes; `loading` only applies to the native button. The story check now counts a render error or empty root as a failure (verified: it flags AsLink on the old build).
- **Lesson:** "No violations" from an empty page means nothing. Automated checks must first assert that the thing rendered.

## shadcn CLI wrote raw colours into globals.css
- **What went wrong:** `npx shadcn add sidebar` appended hard-coded `hsl(...)` sidebar colours under `.dark` in `globals.css`, bypassing the token adapter. It also stopped on an interactive "overwrite button.tsx?" prompt.
- **How it was caught:** Reviewing `git diff` after the CLI ran.
- **Fix:** Reverted `globals.css`; run the CLI with `yes n |` so it never overwrites our components; check the diff of `globals.css` after every `shadcn add`.
- **Lesson:** Generators write outside the files you asked for. Diff everything they touch.

## Confidence text passed the contrast check but failed WCAG
- **What went wrong:** `confidence.*` colours were validated as non-text marks (3:1), but `ConfidenceIndicator` used them for the label text too (3.18–3.98:1).
- **How it was caught:** A subagent's axe run on the Claim detail screen.
- **Fix:** Icons keep `confidence.*`; the text uses `status.*.fg`. Added `status.*.fg` on `bg.surface` and on `status.warning.bg` to `check-contrast.js`.
- **Lesson:** A contrast check is only as good as its pairs: list how each token is actually used, not how it was meant to be used.

## Wrong series colours after rebinding the Figma chart
- **What went wrong:** Mapping the kit chart colours 1/2/3/5 to the new `chart/1–4` by number made Motor violet and Travel amber, because the Figma bars had used the kit colours in a different order than the code.
- **How it was caught:** Screenshot of the v2 Overview after the rebind.
- **Fix:** Remapped by series (Motor 1 blue, Property 2 amber, Health 3 green, Travel 4 violet) to match the code.
- **Lesson:** Map by meaning, not by index; screenshot after bulk rebinding.

## Horizontal page scroll from screen-reader-only text
- **What went wrong:** The Claim detail page was 694px wide at a 375px viewport although the fields table scrolled inside its own container. `sr-only` spans are `position: absolute`; their containing block was outside the scroll container, so they extended the page.
- **How it was caught:** Measuring `scrollWidth` at 375px in the browser, then walking overflow ancestors.
- **Fix:** Scroll containers (`ExtractedFieldsTable`, tabs list) are `relative`.
- **Lesson:** Any `overflow-x-auto` wrapper that contains `sr-only` content needs to be a positioned element.

## Rules without enforcement drifted
- **What went wrong:** CLAUDE.md required stories for every component and axe-clean stories, but 35 of 48 components had none after two screens were built "stories later", and CI only checked tokens and the build. The AI followed the instruction of the moment over the standing rule without flagging the growing gap.
- **How it was caught:** A review of what outside reviewers would check (rules vs repo).
- **Fix:** `scripts/check-stories.js` (fails on any component without stories), Vitest + `@storybook/addon-vitest` (every story is a test, a11y violations fail), and CI gates deploy on lint, typecheck, story coverage, unit and story tests. Decision 0008.
- **Lesson:** A rule that isn't checked by a machine is a wish. When a request contradicts a standing rule, say so and record the debt.

## Parallel agents broke each other's test run
- **What went wrong:** While one agent refactored components, the test-infrastructure agent's first story run failed 21 of 76 stories. Half the failures came from a missing `TooltipProvider` that only the app mounted, not Storybook.
- **How it was caught:** The failing story list in the infrastructure agent's report.
- **Fix:** A global `TooltipProvider` decorator in `.storybook/preview.tsx`; the full suite was re-run after both agents finished (76/76).
- **Lesson:** Stories must render in the same providers as the app; run the whole suite only once parallel work has landed.

## Storybook turned into a test harness
- **What went wrong:** To enforce "every component has tests", the AI made every story a test and put multi-step flows (bulk approve, inline correction, senior approval) into story play functions, plus screen stories. Storybook grew to about 400 stories, many of them tests rather than documentation.
- **How it was caught:** The human asked which stories were documentation and which were there only as a place to test.
- **Fix:** Storybook sections follow the code (Foundations, UI, Patterns, Layout, Claims); stories show states only. Flows moved to Vitest browser tests next to components and Playwright end-to-end tests. `check:tests` gates feature components and screens. Decision 0009.
- **Lesson:** Choose the right tool for each gate. Coverage pressure pushed tests into the docs tool because it was already wired up.

## Coverage script counted its own test files
- **What went wrong:** After `*.browser.test.tsx` files were added next to components, `check-stories.js` treated them as components without stories.
- **How it was caught:** The orchestrator's full local gate run listed a test file as missing stories.
- **Fix:** The script skips `*.test.tsx`.
- **Lesson:** When a new file kind lands in an existing folder, re-run every check that scans the folder.

## A performance gate with a one-point margin blocked a deploy
- **What went wrong:** The AI set the mobile Lighthouse performance gate at 0.85 for a page that measured 0.88–0.89 locally. On the CI runner it scored 0.84 and the deploy was skipped. The report upload also silently produced nothing, because the artifact step ignores hidden folders (`.lighthouseci/`).
- **How it was caught:** The first CI run after the push failed; the orchestrator had flagged the risk before the result came in.
- **Fix:** Mobile performance score is a warning; hard gates are metric budgets with headroom (LCP, blocking time, layout shift) set from the numbers measured in CI. `include-hidden-files: true` on the artifact step. Decision 0011.
- **Lesson:** Gate on things that are deterministic or have real margin. Measure on the machine that enforces the gate before choosing the threshold.
