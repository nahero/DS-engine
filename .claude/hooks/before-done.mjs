// Stop hook: the agent can't finish while the checks for its changes are red.
// "Changes" = everything since the branch left origin/main: commits, staged, unstaged and untracked files, so
// committing the work doesn't skip the gate. Runs the fast gates on the whole repo and the tests related to the
// changed files. Exit 2 keeps the agent working and shows it what failed. Claude Code ends the turn after 8
// consecutive blocks, so a check that can't go green reaches the person instead of looping.
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
// The repo the agent is working in (a worktree has its own), not only where the session started.
const start = input.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const root = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: start, encoding: 'utf8' }).stdout.trim() || start
const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout ?? ''
const files = (out) => out.split('\0').filter(Boolean)

const base = git('merge-base', 'HEAD', 'origin/main').trim() || 'HEAD'
const changed = [...new Set([...files(git('diff', '-z', '--name-only', base)), ...files(git('ls-files', '-z', '--others', '--exclude-standard'))])]
const deleted = files(git('diff', '-z', '--name-only', '--diff-filter=D', base))

const CONFIG = /^(package(-lock)?\.json|tsconfig.*\.json|\.oxlintrc\.json|sd\.config\.js|(vite|vitest|playwright)\.config\.ts|index\.html)$/
const relevant = changed.filter((f) => /^(src|tokens|scripts|e2e|public|\.storybook)\//.test(f) || CONFIG.test(f))
if (!relevant.length) process.exit(0)

// Skip when nothing changed since the last green run (the hook fires on every stop, not only after edits).
const hash = crypto.createHash('sha1').update(base).update(git('diff', base))
for (const f of relevant) if (fs.existsSync(path.join(root, f))) hash.update(f).update(fs.readFileSync(path.join(root, f)))
const stamp = hash.digest('hex')
const stampFile = path.join(root, 'node_modules', '.cache', 'harness-last-green')
if (fs.existsSync(stampFile) && fs.readFileSync(stampFile, 'utf8') === stamp) process.exit(0)

function block(label, detail) {
  process.stderr.write(`Not done: ${label}. Fix it, then finish.\n\n${detail}\n`)
  process.exit(2)
}

// Protected tests: deleting or switching off a test, story or baseline needs a person's decision.
const TESTS = /(\.test\.tsx?|\.stories\.tsx|^e2e\/.*|-snapshots\/.*\.png)$/
const removedTests = deleted.filter((f) => TESTS.test(f))
const addedLines = git('diff', base, '--unified=0', '--', 'src', 'e2e', '.storybook', 'playwright.config.ts', 'vitest.config.ts')
  .split('\n')
  .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
const switchedOff = addedLines.filter((l) => /\b(it|test|describe)\.(skip|only|todo)\b|\bxit\(|test:\s*['"](todo|off)['"]/.test(l))
if (removedTests.length || switchedOff.length) {
  block(
    'tests, stories or baselines were removed or switched off',
    [...removedTests.map((f) => `deleted: ${f}`), ...switchedOff.map((l) => `added: ${l.slice(1).trim()}`)].join('\n') +
      '\n\nIf this is intended, stop and ask the user; never weaken a test to make it pass.',
  )
}

const bin = (name) => path.join(root, 'node_modules', '.bin', name)
// Own Vite cache, so a hook run never writes the same optimised deps as a test run started by hand.
const env = { ...process.env, HARNESS: '1' }
const steps = [
  ['Lint', bin('oxlint'), ['--deny-warnings', '--report-unused-disable-directives']],
  ['Typecheck', bin('tsc'), ['-b']],
  ['Token usage', 'node', ['scripts/check-token-usage.js']],
  ['Story coverage', 'node', ['scripts/check-stories.js']],
  ['Test coverage', 'node', ['scripts/check-tests.js']],
]

// Generated token files must equal a fresh build (catches hand edits made outside the Edit tool).
const GENERATED = ['src/styles/tokens.css', 'src/styles/tokens.ts']
if (relevant.some((f) => f.startsWith('tokens/') || GENERATED.includes(f))) {
  steps.push(['Token build + contrast', 'npm', ['run', '--silent', 'build:tokens']])
}

// Config or token changes can affect every test; otherwise only the tests that import a changed file.
const broad = relevant.some((f) => !/^(src|e2e)\//.test(f) || GENERATED.includes(f))
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
  const before = label.startsWith('Token') ? GENERATED.map((f) => git('diff', 'HEAD', '--', f)).join('') : ''
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env })
  if (r.error) block(`${label} could not run`, `${r.error.message}\nIs node_modules installed (npm ci) and Chromium (npx playwright install chromium)?`)
  if (r.status !== 0) {
    const out = (label.startsWith('Tests') && summariseTests()) || (r.stdout + r.stderr).trim().split('\n').slice(-60).join('\n')
    block(`${label} is red for the current changes`, out)
  }
  if (label.startsWith('Token') && GENERATED.map((f) => git('diff', 'HEAD', '--', f)).join('') !== before) {
    block('generated token files differed from a fresh build', `${GENERATED.join(', ')} were regenerated from tokens/*.json. Review the diff; never edit them by hand.`)
  }
}

fs.mkdirSync(path.dirname(stampFile), { recursive: true })
fs.writeFileSync(stampFile, stamp)
