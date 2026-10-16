---
name: write-stories
description: Write or extend Storybook stories for a DS-Engine component - one story per state, play functions for single interactions, no flows. Use before building a component (the agreed state list comes first), when a component gains a state, or when ui-review lists missing stories.
---

# Write stories

Stories document states. Tests test behaviour (ADR 0009). Every story also runs as a test in light/comfortable and dark/compact, with axe set to fail (ADR 0008).

## 1. Agree the state list first (test-first)
Before the component exists or changes, list its stories and `play` checks and get the user's OK. The list is the contract; the build is done when they all pass.
- Always: Default, Focus (keyboard), Disabled, every variant and size.
- When relevant: Hover, Pressed/Selected, Loading (skeleton at final size), Empty, Error (with retry), Long content (long labels, 1,000 rows for tables), Missing data (`—` + "Missing"), Mobile viewport.

## 2. File and naming
- `<name>.stories.tsx` next to the component. Title follows the folder: `UI/`, `Patterns/`, `Layout/`, `Claims/`.
- `meta` with `component`, default `args`, and a `docs.description.component` that says what it is for and the rule it encodes.
- Callbacks are `fn()` so `play` can assert them.
- Copy the shape of `src/components/patterns/StatFilter.stories.tsx`.

## 3. play functions
- One interaction per story: focus with `userEvent.tab()`, one click, one key. Assert the result by role and name (`canvas.getByRole('button', { name: … })`).
- No multi-step flows. A flow (filter → select → bulk action) goes in `<Name>.browser.test.tsx`; cross-screen journeys go in `e2e/`.
- Don't assert colours or classes; assert what a user or screen reader gets: role, name, `aria-*`, focus, text.

## 4. Check
- `npx vitest run --project storybook --project storybook-dark <path>`: all green, axe clean.
- `npm run check:stories` passes.
- Never weaken an existing story's assertions to make it pass; list any story change separately in the summary.
