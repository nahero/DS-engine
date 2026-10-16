// Stop / SubagentStop hook: the agent can't finish while the checks for its changes are red.
// Runs the fast gates on the whole repo and the tests related to the changed files. Exit 2 keeps the agent working
// and shows it what failed. A clean tree, or a tree unchanged since the last green run, passes at once.
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout ?? ''

const changed = [
  ...git('diff', '--name-only', 'HEAD').split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean)

const relevant = changed.filter((f) => /^(src|tokens|scripts|e2e|\.storybook)\//.test(f) || /^(vite|vitest|playwright)\.config\.ts$/.test(f))
if (!relevant.length) process.exit(0)

// Skip when nothing changed since the last green run (the hook fires on every stop, not only after edits).
const hash = crypto.createHash('sha1')
hash.update(git('diff', 'HEAD'))
for (const f of relevant) if (fs.existsSync(path.join(root, f))) hash.update(f).update(fs.readFileSync(path.join(root, f)))
const stamp = hash.digest('hex')
const stampFile = path.join(root, 'node_modules', '.cache', 'harness-last-green')
if (fs.existsSync(stampFile) && fs.readFileSync(stampFile, 'utf8') === stamp) process.exit(0)

const bin = (name) => path.join(root, 'node_modules', '.bin', name)
// Own Vite cache, so a hook run never writes the same optimised deps as a test run started by hand.
const env = { ...process.env, HARNESS: '1' }
const steps = [
  ['Lint', bin('oxlint'), ['--deny-warnings']],
  ['Typecheck', bin('tsc'), ['-b']],
  ['Story coverage', 'node', ['scripts/check-stories.js']],
  ['Test coverage', 'node', ['scripts/check-tests.js']],
]

if (relevant.some((f) => f.startsWith('tokens/'))) {
  steps.push(['Token build + contrast', 'npm', ['run', '--silent', 'build:tokens']])
}

// Config or token changes can affect every test; otherwise only the tests that import a changed file.
const broad = relevant.some((f) => f.startsWith('tokens/') || f.startsWith('.storybook/') || f.endsWith('.config.ts'))
const projects = ['unit', 'components', 'components-dark', 'storybook', 'storybook-dark'].flatMap((p) => ['--project', p])
const srcFiles = relevant.filter((f) => f.startsWith('src/') && fs.existsSync(path.join(root, f)))
const report = path.join(root, 'node_modules', '.cache', 'harness-vitest.json')
const reporter = ['--reporter=json', `--outputFile=${report}`]
if (broad) steps.push(['Tests (all)', bin('vitest'), ['run', ...projects, ...reporter]])
else if (srcFiles.length) steps.push(['Tests (related)', bin('vitest'), ['related', '--run', '--passWithNoTests', ...srcFiles, ...projects, ...reporter]])

// Failing tests as `file › test: first line of the error`, instead of a tail full of DOM dumps.
function summariseTests() {
  if (!fs.existsSync(report)) return null
  const { testResults = [], numFailedTests = 0, numTotalTests = 0 } = JSON.parse(fs.readFileSync(report, 'utf8'))
  const lines = testResults.flatMap((file) => {
    const rel = path.relative(root, file.name)
    const failed = file.assertionResults.filter((t) => t.status === 'failed')
    if (!failed.length && file.status === 'failed') return [`${rel}: ${(file.message || 'failed to run').split('\n')[0]}`]
    return failed.map((t) => `${rel} › ${t.fullName}: ${(t.failureMessages[0] ?? '').split('\n')[0]}`)
  })
  return [`${numFailedTests} of ${numTotalTests} tests failed`, ...lines.slice(0, 30)].join('\n')
}

for (const [label, cmd, args] of steps) {
  if (fs.existsSync(report)) fs.rmSync(report)
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env })
  if (r.status !== 0) {
    const out = (label.startsWith('Tests') && summariseTests()) || (r.stdout + r.stderr).trim().split('\n').slice(-60).join('\n')
    process.stderr.write(`Not done: ${label} is red for the current changes. Fix it, then finish.\n\n${out}\n`)
    process.exit(2)
  }
}

fs.mkdirSync(path.dirname(stampFile), { recursive: true })
fs.writeFileSync(stampFile, stamp)
