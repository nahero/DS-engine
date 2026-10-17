# 0017: Pre-commit checks on staged files

**Status:** accepted · 2026-10-16

## Context
The agent hooks (ADR 0014) cover work done by Claude Code. Commits made by hand, from an editor or by another tool skipped every check until CI, minutes later.

## Decision
- `simple-git-hooks` 2.14.0 installs a pre-commit hook on `npm install` (`prepare`). It has no dependencies of its own and one line of config, which is all we need; Husky adds a folder of shell scripts for the same result.
- `lint-staged` 17.6.0 runs on staged files only, one task at a time (Prettier rewrites a file before oxlint reads it):
  - Prettier on every staged file;
  - oxlint (warnings are errors, unused disables fail) on code files;
  - the tokens-only check on components, features and screens;
  - `tsc -b` once when any TypeScript file is staged (about 3 s warm);
  - when a token source or generated token file is staged: validation, build and contrast, then the generated files must equal what is staged (a token change committed without its rebuild, or a hand edit to `tokens.css`, is refused).
- lint-staged stashes unstaged changes while it runs, so the checks see exactly what is committed, and re-adds files Prettier rewrote.
- The hook calls `npx --no-install lint-staged`, so it never downloads an unpinned version. lint-staged 17 needs Node ≥ 22.22.1, now the `engines` floor in `package.json` (CI uses the latest 22).
- The agent can't switch it off: a `PreToolUse` guard (`.claude/hooks/guard-bash.mjs`) blocks git's no-verify flag, `git commit -n`, the simple-git-hooks skip variable and `core.hooksPath` in its shell commands. It matches real git invocations only, so docs that mention the flags pass.
- Tests and the story/test coverage checks stay out of pre-commit: they take a minute and run in the agent's Stop hook and in CI.

## Consequences
- A commit with a lint, format, type or token error is refused locally, in seconds.
- A person can still skip it (no-verify flag or `SKIP_SIMPLE_GIT_HOOKS=1`); CI and branch protection still block the merge.
