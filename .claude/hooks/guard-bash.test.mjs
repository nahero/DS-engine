import { describe, expect, it } from 'vitest'
import { bypassIn } from './guard-bash.mjs'

describe('Bash guard: commands that skip the git hooks', () => {
  it.each([
    ['git commit -m x --no-verify'],
    ['cd repo && git commit -m x --no-verify'],
    ['git push --no-verify'],
    ['git commit -nm x'],
    ['git commit -n -m x'],
    ['SKIP_SIMPLE_GIT_HOOKS=1 git commit -m x'],
    ['export SKIP_SIMPLE_GIT_HOOKS=1'],
    ['git -c core.hooksPath=/dev/null commit -m x'],
    ['git config core.hooksPath /tmp'],
    ['bash -c "git commit -m x --no-verify"'],
    ["sh -c 'git commit -nm x'"],
  ])('blocks %s', (cmd) => {
    expect(bypassIn(cmd)).not.toBeNull()
  })

  // The first version blocked the agent's own docs edit because the text mentioned the flag (ai-log).
  it.each([
    ["git commit -m 'no verify needed'"],
    ['git commit -m "fix: run -n in docs"'],
    ['git commit -am x'],
    ['git commit --amend --no-edit'],
    ['npm run -s lint -- -n'],
    ["python3 - <<'EOF'\ns = 'blocks --no-verify and SKIP_SIMPLE_GIT_HOOKS and core.hooksPath'\nEOF"],
    ["cat > docs/x.md <<'EOF'\nA person can skip it (git commit --no-verify).\nEOF"],
  ])('allows %s', (cmd) => {
    expect(bypassIn(cmd)).toBeNull()
  })
})
