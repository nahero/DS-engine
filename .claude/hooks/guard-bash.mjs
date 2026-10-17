// PreToolUse hook (Bash): the agent may not switch off the git hooks. Exit 2 blocks the command.
import fs from 'node:fs'

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
const cmd = input.tool_input?.command ?? ''

// Only real git invocations and env assignments count, so text that merely mentions a flag (docs, commit messages
// written through a heredoc) isn't blocked. `[^|;&\n]*` keeps each match inside one command.
const BYPASS = [
  [/(^|[|;&\n]\s*)(\w+=\S*\s+)*git\b[^|;&\n]*\s--no-verify\b/, 'git --no-verify'],
  [/(^|[|;&\n]\s*)(\w+=\S*\s+)*git\b[^|;&\n]*\bcommit\b[^|;&\n'"]*\s-[a-zA-Z]*n[a-zA-Z]*\b/, 'git commit -n'],
  [/(^|[\s;&|(])(export\s+)?SKIP_SIMPLE_GIT_HOOKS=/, 'SKIP_SIMPLE_GIT_HOOKS'],
  [/(^|[|;&\n]\s*)git\b[^|;&\n]*(-c\s+core\.hooksPath|config\b[^|;&\n]*core\.hooksPath)/, 'core.hooksPath'],
]
const hit = BYPASS.find(([re]) => re.test(cmd))
if (hit) {
  process.stderr.write(
    `Blocked: ${hit[1]} skips the pre-commit checks. Fix what they report instead; if a bypass is really needed, ask the user to run it.\n`,
  )
  process.exit(2)
}
