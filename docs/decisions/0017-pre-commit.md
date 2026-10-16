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
  - `tsc -b` once when any TypeScript file is staged;
  - token validation and the contrast check when a token file is staged.
- Tests stay out of pre-commit: they take a minute and run in the agent's Stop hook and in CI.

## Consequences
- A commit with a lint, format, type or token error is refused locally, in seconds.
- `git commit --no-verify` or `SKIP_SIMPLE_GIT_HOOKS=1` skips it; CI and branch protection still block the merge.
