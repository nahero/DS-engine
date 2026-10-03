// Bundle budget: the JS needed for first load (the entry referenced by dist/index.html plus the chunks it
// preloads) must stay under BUDGET_KB gzipped. Also fails if Recharts leaks into that first load: it belongs
// to the Overview screen chunk. Run after `npm run build`. Raise the budget deliberately, never silently.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const BUDGET_KB = 145
const DIST = 'dist'

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html is missing. Run `npm run build` first.')
  process.exit(1)
}

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const refs = [
  ...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+\.js)"/g),
  ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+\.js)"/g),
].map((m) => m[1])

if (refs.length === 0) {
  console.error('No entry script found in dist/index.html.')
  process.exit(1)
}

const files = refs.map((ref) => path.join(DIST, 'assets', path.basename(ref)))
let total = 0
let leaked = false
for (const file of files) {
  const source = fs.readFileSync(file)
  const gz = zlib.gzipSync(source).length
  total += gz
  if (source.includes('recharts-surface')) leaked = true
  console.log(`  ${path.basename(file).padEnd(42)} ${(gz / 1000).toFixed(1).padStart(7)} kB gzip`)
}

const kb = total / 1000
let failed = false
if (leaked) {
  console.error('Recharts is in the first-load JS. Keep it behind the lazy Overview screen.')
  failed = true
}
if (kb > BUDGET_KB) {
  console.error(`Bundle too large: entry ${kb.toFixed(1)} kB gzip (budget ${BUDGET_KB} kB)`)
  failed = true
}
if (failed) process.exit(1)
console.log(`Bundle OK: entry ${kb.toFixed(1)} kB gzip (budget ${BUDGET_KB} kB)`)
