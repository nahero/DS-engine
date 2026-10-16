// PostToolUse hook (Edit / Write / MultiEdit): fast checks on the file the agent just changed.
// Exit 2 puts the errors in front of the agent straight after the edit; exit 0 stays silent.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
const file = input.tool_input?.file_path
if (!file || !fs.existsSync(file)) process.exit(0)

// The repo that holds the file (a worktree has its own), so worktree edits are checked too.
const root = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: path.dirname(file), encoding: 'utf8' }).stdout.trim()
if (!root || !fs.existsSync(path.join(root, 'node_modules'))) process.exit(0)
const rel = path.relative(root, file).split(path.sep).join('/')

const bin = (name) => path.join(root, 'node_modules', '.bin', name)
const failures = []

function run(label, cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) failures.push(`${label} failed:\n${(r.stdout + r.stderr).trim().slice(-3000)}`)
}

if (/\.(ts|tsx|js|mjs)$/.test(rel) && !rel.startsWith('.claude/')) {
  run('Lint', bin('oxlint'), ['--deny-warnings', '--report-unused-disable-directives', rel])
  run('Typecheck', bin('tsc'), ['-b'])
}

if (/^src\/(components|features|screens)\/.*\.(tsx?|css)$/.test(rel)) {
  run('Token usage', 'node', ['scripts/check-token-usage.js', rel])
}

if (/^tokens\/.*\.json$/.test(rel)) {
  run('Token build + contrast', 'npm', ['run', '--silent', 'build:tokens'])
}

if (failures.length) {
  process.stderr.write(`Checks failed after editing ${rel}. Fix before moving on.\n\n${failures.join('\n\n')}\n`)
  process.exit(2)
}
