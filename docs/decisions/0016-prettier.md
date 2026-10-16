# 0016: Prettier formats the code; Tailwind classes are sorted

**Status:** accepted · 2026-10-16

## Context
Formatting was by hand and by habit: shadcn files used double quotes, our own files single quotes, and class strings had no order. Review time went to layout and class order instead of behaviour, and agent diffs mixed real changes with reformatting.

## Decision
- Prettier 3.9.10 with `prettier-plugin-tailwindcss` 0.8.1, pinned exactly (`.npmrc` `save-exact=true` for new dependencies).
- Style follows the existing code: no semicolons, single quotes, trailing commas, print width 140. Tailwind classes are sorted in `className`, `cn()` and `cva()`, using `src/styles/globals.css` as the Tailwind v4 stylesheet.
- Not formatted: generated tokens, `tokens/figma`, build output and reports, visual baselines, the lockfile, Markdown and MDX (hand-written tables and line breaks).
- One reformat-only commit, listed in `.git-blame-ignore-revs` so `git blame` skips it. The PR is merged with a merge commit to keep that hash.
- Runs in three places: the after-edit hook formats each file the agent edits, the Stop hook and CI run `prettier --check`.

## Consequences
- Diffs show behaviour changes only; class order is never a review comment.
- Class sorting can't change which class wins: `cn()` uses tailwind-merge, and the story, component, e2e and visual tests ran green on the reformatted code.
- A local editor without Prettier will show a red `format:check`; `npm run format` fixes it.
