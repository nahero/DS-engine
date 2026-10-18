import { describe, expect, it } from 'vitest'
import { countTests, summarise } from './ci-summary.js'

const xml = `<?xml version="1.0"?>
<testsuites name="vitest tests" tests="5" failures="1" errors="0">
  <testsuite name="a.test.ts" tests="3" failures="1" errors="0" skipped="0"></testsuite>
  <testsuite name="b.test.ts" tests="2" failures="0" errors="1" skipped="1"></testsuite>
</testsuites>`

describe('ci-summary', () => {
  it('counts tests from every testsuite in a JUnit report', () => {
    expect(countTests(xml)).toEqual({ tests: 5, failures: 2, skipped: 1 })
  })

  it('names the blocking gates and shows test counts', () => {
    const md = summarise(
      'Checks',
      [
        ['Lint', 'success'],
        ['Unit tests', 'failure', 'junit.xml'],
        ['Story tests', 'skipped'],
      ],
      () => xml,
    )
    expect(md).toContain('**Blocked:** Unit tests.')
    expect(md).toContain('| Lint | ✅ passed |  |')
    expect(md).toContain('| Unit tests | ❌ failed | 2 passed, 2 failed, 1 skipped |')
    expect(md).toContain('| Story tests | ⏭️ not run |  |')
  })

  it('does not call a run with gates that never ran a pass', () => {
    expect(
      summarise(
        'Checks',
        [
          ['Lint', 'success'],
          ['Unit tests', 'cancelled'],
        ],
        () => null,
      ),
    ).toContain('**Incomplete:** Unit tests did not run')
  })

  it('says so when every gate passed, and tolerates a missing report', () => {
    const md = summarise('E2E', [['Playwright', 'success', 'missing.xml']], () => null)
    expect(md).toContain('**All gates passed.**')
    expect(md).toContain('| Playwright | ✅ passed |  |')
  })
})
