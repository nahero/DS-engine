// CI job summary: one table of the gates in a job, their result and, for test gates, the counts from the JUnit report.
// Usage (GitHub Actions, `if: always()`): GATES='[["Lint","success"],["Unit tests","failure","reports/junit-unit.xml"]]'
//   TITLE='Checks' node scripts/ci-summary.js   → appends to $GITHUB_STEP_SUMMARY (or prints when it isn't set).
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const RESULT = {
  success: '✅ passed',
  failure: '❌ failed',
  skipped: '⏭️ not run',
  cancelled: '⏹️ cancelled',
}

/** Test counts from a JUnit XML string (Vitest or Playwright): sums every <testsuite>. */
export function countTests(xml) {
  const n = { tests: 0, failures: 0, skipped: 0 }
  for (const [, attrs] of xml.matchAll(/<testsuite\b([^>]*)>/g)) {
    const num = (name) => Number(attrs.match(new RegExp(`\\b${name}="(\\d+)"`))?.[1] ?? 0)
    n.tests += num('tests')
    n.failures += num('failures') + num('errors')
    n.skipped += num('skipped')
  }
  return n
}

/** Markdown for one job. `gates`: [name, outcome, reportPath?][]; `read(path)` returns the XML or null. */
export function summarise(title, gates, read) {
  const rows = gates.map(([name, outcome, report]) => {
    const xml = report ? read(report) : null
    let tests = ''
    if (xml) {
      const n = countTests(xml)
      tests =
        `${n.tests - n.skipped - n.failures} passed` +
        (n.failures ? `, ${n.failures} failed` : '') +
        (n.skipped ? `, ${n.skipped} skipped` : '')
    }
    return `| ${name} | ${RESULT[outcome] ?? outcome} | ${tests} |`
  })
  const failed = gates.filter(([, o]) => o === 'failure').map(([n]) => n)
  const notRun = gates.filter(([, o]) => o !== 'success' && o !== 'failure').map(([n]) => n)
  const verdict = failed.length
    ? `**Blocked:** ${failed.join(', ')}. Nothing deploys until every gate passes.`
    : notRun.length
      ? `**Incomplete:** ${notRun.join(', ')} did not run (cancelled, or a setup step failed: see the job log).`
      : '**All gates passed.**'
  return [`### ${title}`, '', verdict, '', '| Gate | Result | Tests |', '|---|---|---|', ...rows, ''].join('\n')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // A summary must never turn a green job red: a malformed GATES prints a note instead.
  let gates = []
  try {
    gates = JSON.parse(process.env.GATES ?? '[]')
  } catch (error) {
    console.log(`ci-summary: GATES is not valid JSON (${error.message}); no table written.`)
  }
  const md = summarise(process.env.TITLE ?? 'Gates', gates, (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null))
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
  else console.log(md)
}
