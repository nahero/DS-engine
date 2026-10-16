// PostToolUse hook (Edit / Write / MultiEdit): fast checks on the file the agent just changed.
// Exit 2 puts the errors in front of the agent straight after the edit; exit 0 stays silent.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
const file = input.tool_input?.file_path
if (!file) process.exit(0)

const rel = path.relative(root, file)
if (rel.startsWith('..') || path.isAbsolute(rel)) process.exit(0)

const bin = (name) => path.join(root, 'node_modules', '.bin', name)
const failures = []

function run(label, cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) failures.push(`${label} failed:\n${(r.stdout + r.stderr).trim().slice(-3000)}`)
}

if (/\.(ts|tsx|js|mjs)$/.test(rel) && !rel.startsWith('.claude/')) {
  run('Lint', bin('oxlint'), ['--deny-warnings', rel])
  run('Typecheck', bin('tsc'), ['-b'])
}

if (/^tokens\/.*\.json$/.test(rel)) {
  run('Token build + contrast', 'npm', ['run', '--silent', 'build:tokens'])
}

if (failures.length) {
  process.stderr.write(`Checks failed after editing ${rel}. Fix before moving on.\n\n${failures.join('\n\n')}\n`)
  process.exit(2)
}
