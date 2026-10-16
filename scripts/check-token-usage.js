// Tokens-only check: fails on hardcoded visual values in components, features and screens (CLAUDE.md hard rule).
// - Tailwind arbitrary values on visual utilities: `p-[13px]`, `bg-[#f00]`, `rounded-[6px]`, `duration-[250ms]`.
//   Token references stay allowed: `w-[var(--sidebar-width)]`, `h-[calc(var(--row)*3)]`.
// - Colour literals: hex, rgb(), hsl(), oklch().
// - Inline styles with literal sizes or colours (`style={{ width: 120 }}`, `'12px'`); `var(--…)` is fine.
// Usage: node scripts/check-token-usage.js [files…]   (no files = everything in scope). Exits 1 and lists each hit.
import fs from 'node:fs'
import path from 'node:path'

const SCOPE = ['src/components', 'src/features', 'src/screens']
const SKIP = /\.test\.tsx?$/

// Named exceptions: file → exact match → reason. Keep this short.
const ALLOWED = {}

const VISUAL = [
  'bg', 'text', 'border(?:-[trblxyse])?', 'ring', 'ring-offset', 'outline', 'outline-offset', 'fill', 'stroke', 'shadow', 'drop-shadow',
  'rounded(?:-[trblse]{1,2})?', 'p[trblxyse]?', 'm[trblxyse]?', '-m[trblxyse]?', 'gap(?:-[xy])?', 'space-[xy]', 'w', 'h', 'size',
  'min-w', 'min-h', 'max-w', 'max-h', 'inset(?:-[xy])?', 'top', 'right', 'bottom', 'left', 'leading', 'tracking', 'font', 'opacity',
  'duration', 'delay', 'ease', 'decoration', 'underline-offset', 'from', 'via', 'to', 'accent', 'caret', 'divide(?:-[xy])?', 'scroll-[mp][trblxy]?', 'basis',
]
const ARBITRARY = new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(${VISUAL.join('|')})-\\[([^\\]\\s]+)\\]`, 'g')
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/g
const INLINE_LITERAL = /:\s*(?:-?\d+(?:\.\d+)?(?:px|rem|em|ms|s|%)?\s*[,}]|['"`][^'"`]*\d(?:px|rem|em|ms)\b|['"`]#[0-9a-fA-F]{3,8}['"`])/

function list(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? list(p) : /\.(tsx?|css)$/.test(e.name) ? [p] : []
  })
}

const args = process.argv.slice(2).map((f) => path.relative(process.cwd(), path.resolve(f)))
const files = (args.length ? args.filter((f) => SCOPE.some((d) => f.startsWith(d + path.sep))) : SCOPE.flatMap(list)).filter(
  (f) => !SKIP.test(f) && fs.existsSync(f),
)

const hits = []
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  let inStyle = 0
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, '').replace(/^\s*\*.*$/, '')
    const at = `${file}:${i + 1}`
    const allowed = (match) => ALLOWED[file]?.[match]
    for (const m of code.matchAll(ARBITRARY)) {
      if (m[2].includes('var(--') || allowed(m[0])) continue
      hits.push(`${at}: arbitrary value \`${m[0]}\` → use a token utility`)
    }
    for (const m of code.matchAll(COLOUR)) {
      if (code.slice(m.index - 6, m.index).includes('href=') || allowed(m[0])) continue
      hits.push(`${at}: colour literal \`${m[0]}\` → use a semantic colour token`)
    }
    if (/style=\{\{/.test(code)) inStyle = 1
    if (inStyle) {
      const body = code.slice(code.indexOf('style={{') >= 0 ? code.indexOf('style={{') + 8 : 0)
      if (INLINE_LITERAL.test(body) && !allowed(body.trim())) hits.push(`${at}: literal value in inline style → use var(--token)`)
      if (/\}\}/.test(code)) inStyle = 0
    }
  })
}

if (hits.length) {
  console.error(`Hardcoded visual values (${hits.length}):\n${hits.map((h) => `  ${h}`).join('\n')}`)
  process.exit(1)
}
console.log(`Token usage OK: ${files.length} files`)
