// Test coverage check: every feature component and screen needs a sibling *.browser.test.tsx. Exits 1 and lists the gaps.
import fs from 'node:fs'
import path from 'node:path'

const DIRS = ['src/features/claims', 'src/screens']

const missing = []
let checked = 0
for (const dir of DIRS) {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.tsx') || file.endsWith('.stories.tsx') || file.endsWith('.browser.test.tsx')) continue
    checked++
    const test = path.join(dir, file.replace(/\.tsx$/, '.browser.test.tsx'))
    if (!fs.existsSync(test)) missing.push(path.join(dir, file))
  }
}

if (missing.length) {
  console.error(`Missing tests (${missing.length} of ${checked} components):\n${missing.map((f) => `  ${f}`).join('\n')}`)
  process.exit(1)
}
console.log(`Tests OK: ${checked} components`)
