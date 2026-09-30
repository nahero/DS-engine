// Story coverage check: every component file needs a sibling *.stories.tsx. Exits 1 and lists the gaps.
// A component file is a .tsx in src/components/{ui,app,review} or src/screens that isn't itself a story.
import fs from 'node:fs'
import path from 'node:path'

const DIRS = ['src/components/ui', 'src/components/app', 'src/components/review', 'src/screens']
// Covered by another component's stories (named here so the exception is explicit).
const COVERED_ELSEWHERE = {
  'src/components/ui/spinner.tsx': 'button.stories.tsx (Loading)',
}

const missing = []
let checked = 0
for (const dir of DIRS) {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.tsx') || file.endsWith('.stories.tsx')) continue
    const rel = path.join(dir, file)
    if (COVERED_ELSEWHERE[rel]) continue
    checked++
    if (!fs.existsSync(path.join(dir, file.replace(/\.tsx$/, '.stories.tsx')))) missing.push(rel)
  }
}

if (missing.length) {
  console.error(`Missing stories (${missing.length} of ${checked} components):\n${missing.map((f) => `  ${f}`).join('\n')}`)
  process.exit(1)
}
console.log(`Stories OK: ${checked} components`)
