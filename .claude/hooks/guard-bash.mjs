// PreToolUse hook (Bash): the agent may not switch off the git hooks. Exit 2 blocks the command.
// A heuristic over the command text, not a sandbox: it blocks the common bypasses; CI and branch protection are the
// backstop for anything it misses. Cases: guard-bash.test.mjs.
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

// Only real git invocations and env assignments count, so text that merely mentions a flag (docs, commit messages
// written through a heredoc) isn't blocked. `[^|;&\n]*` keeps each match inside one command. A command starts at the
// beginning, after a separator, or inside `bash -c "…"` / `sh -c '…'`.
const START = String.raw`(^|[|;&\n]\s*|\b(?:ba|z)?sh\s+-c\s+['"])(\w+=\S*\s+)*`
const BYPASS = [
  [new RegExp(String.raw`${START}git\b[^|;&\n]*\s--no-verify\b`), 'git --no-verify'],
  [new RegExp(String.raw`${START}git\b[^|;&\n]*\bcommit\b[^|;&\n'"]*\s-[a-zA-Z]*n[a-zA-Z]*\b`), 'git commit -n'],
  [/(^|[\s;&|(])(export\s+)?SKIP_SIMPLE_GIT_HOOKS=/, 'SKIP_SIMPLE_GIT_HOOKS'],
  [new RegExp(String.raw`${START}git\b[^|;&\n]*(-c\s+core\.hooksPath|config\b[^|;&\n]*core\.hooksPath)`), 'core.hooksPath'],
]

/** The bypass a shell command uses, or null. */
export function bypassIn(cmd) {
  return BYPASS.find(([re]) => re.test(cmd))?.[1] ?? null
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
  const hit = bypassIn(input.tool_input?.command ?? '')
  if (hit) {
    process.stderr.write(
      `Blocked: ${hit} skips the pre-commit checks. Fix what they report instead; if a bypass is really needed, ask the user to run it.\n`,
    )
    process.exit(2)
  }
}
