// Tokens-only check: fails on hardcoded visual values in components, features and screens (CLAUDE.md hard rule).
// - Tailwind arbitrary values on visual utilities (`p-[13px]`, `bg-[#f00]`, `animate-[spin_3s]`) and arbitrary properties
//   (`[padding:8px]`). Token references (`w-[var(--sidebar-width)]`) and layout units (`max-w-[60ch]`, `h-[100dvh]`,
//   `top-[50%]`) pass, and so does `transition-[width]` (a property list, not a timing value).
// - Colour literals: hex in a quoted, bracketed or CSS value position, rgb() / hsl() / oklch() / lab() / lch() / hwb().
// - Inline styles with literal sizes, colours or computed numbers (`width: 120`, `'12px'`, `'red'`, `depth * 16`);
//   `var(--…)` and unitless 0 / 1 pass.
// A deliberate exception is `// token-usage-ignore-next-line: <reason>` on the line above; unused ones fail.
// Not caught (regex scan, not a parser): class names or style objects assembled elsewhere and passed in by variable.
// Usage: node scripts/check-token-usage.js [files…]   (no files = everything in scope). Exits 1 and lists each hit.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const SCOPE = ['src/components', 'src/features', 'src/screens']
const SKIP = /\.test\.[jt]sx?$/

const VISUAL = [
  'bg',
  'text',
  'border(?:-[trblxyse])?',
  'ring',
  'ring-offset',
  'outline',
  'outline-offset',
  'fill',
  'stroke',
  'shadow',
  'drop-shadow',
  'rounded(?:-[trblse]{1,2})?',
  'p[trblxyse]?',
  'm[trblxyse]?',
  'gap(?:-[xy])?',
  'space-[xy]',
  'w',
  'h',
  'size',
  'min-w',
  'min-h',
  'max-w',
  'max-h',
  'inset(?:-[xy])?',
  'top',
  'right',
  'bottom',
  'left',
  'leading',
  'tracking',
  'font',
  'opacity',
  'duration',
  'delay',
  'ease',
  'animate',
  'blur',
  'backdrop-blur',
  'decoration',
  'underline-offset',
  'from',
  'via',
  'to',
  'accent',
  'caret',
  'divide(?:-[xy])?',
  'scroll-[mp][trblxy]?',
  'basis',
]
const ARBITRARY = new RegExp(`(?<![\\w\\[])-?(?:[\\w-]+:)*(${VISUAL.join('|')})-\\[([^\\]\\s]+)\\]`, 'g')
const ARBITRARY_PROPERTY = /(?<![\w&-])\[([a-z][a-z-]*):([^\]\s]+)\]/g
const LAYOUT_UNIT = /^-?[\d.]+(ch|dvh|svh|lvh|vh|vw|%)$/
const HEX = /(?<=['"`[(:,]\s?)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g
const HEX_CSS = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g
const COLOUR_FN = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g
const NAMED =
  /:\s*['"`](?:red|blue|green|black|white|gray|grey|yellow|orange|purple|pink|silver|navy|teal|maroon|olive|lime|aqua|fuchsia)['"`]/
const STYLE_LITERAL = [
  /:\s*-?(?:\d*\.\d+|[2-9]|\d{2,})\s*(?:,|}|$)/, // numbers other than 0 and 1 (React adds px)
  /:\s*['"`][^'"`]*\d(?:px|rem|em|ms|s)\b/, // '12px', '0.5rem', '200ms'
  /\*\s*\d|\d\s*\*/, // computed: depth * 16
]

// Blank out comments and keep strings, so `https://…` inside a string doesn't hide the rest of the line.
function stripComments(src) {
  let out = ''
  let i = 0
  let quote = null
  while (i < src.length) {
    const c = src[i]
    const next = src[i + 1]
    if (quote) {
      out += c
      if (c === '\\') out += src[++i] ?? ''
      else if (c === quote) quote = null
      i++
    } else if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') {
        out += ' '
        i++
      }
    } else if (c === '/' && next === '*') {
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' '
        i++
      }
      out += '  '
      i += 2
    } else {
      if (c === '"' || c === "'" || c === '`') quote = c
      out += c
      i++
    }
  }
  return out
}

/** Hits in one file's source: `{ line, message }`. */
export function scan(source, file = 'x.tsx') {
  const raw = source.split('\n')
  const code = stripComments(source).split('\n')
  const css = file.endsWith('.css')
  const hits = []
  const ignored = new Map() // line index → used?
  raw.forEach((l, i) => {
    const m = l.match(/token-usage-ignore-next-line(?::\s*(.*?))?\s*(?:\*\/\s*\}?)?$/)
    if (!m) return
    if (!m[1]?.trim()) hits.push({ line: i + 1, message: 'token-usage-ignore-next-line needs a reason after a colon' })
    ignored.set(i + 1, false)
  })
  const add = (i, message) => {
    if (ignored.has(i)) return ignored.set(i, true)
    hits.push({ line: i + 1, message })
  }

  let inStyle = false
  code.forEach((line, i) => {
    for (const m of line.matchAll(ARBITRARY)) {
      if (m[2].includes('var(--') || LAYOUT_UNIT.test(m[2])) continue
      add(i, `arbitrary value \`${m[0].trim()}\` → use a token utility`)
    }
    for (const m of line.matchAll(ARBITRARY_PROPERTY)) {
      if (m[2].includes('var(--')) continue
      add(i, `arbitrary property \`${m[0]}\` → use a token utility`)
    }
    for (const m of line.matchAll(css ? HEX_CSS : HEX)) add(i, `colour literal \`${m[0]}\` → use a semantic colour token`)
    for (const m of line.matchAll(COLOUR_FN)) add(i, `colour literal \`${m[0]}\` → use a semantic colour token`)

    // Inline style objects: `style={{ … }}` or `style={\n{ … } as CSSProperties\n}`.
    const start = line.search(/style=\{\s*(\{|$)/)
    if (start >= 0) inStyle = true
    if (inStyle) {
      const body = start >= 0 ? line.slice(start + 6) : line
      if (!body.includes('var(--') && (NAMED.test(body) || STYLE_LITERAL.some((r) => r.test(body)))) {
        add(i, 'literal value in inline style → use var(--token)')
      }
      if (/\}\s*(\}|as\b)/.test(line) || (/^\s*\}\s*$/.test(line) && start < 0)) inStyle = false
    }
  })
  for (const [i, used] of ignored) if (!used) hits.push({ line: i, message: 'unused token-usage-ignore-next-line' })
  return hits
}

function list(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? list(p) : /\.(tsx?|css)$/.test(e.name) ? [p] : []
  })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2).map((f) => path.relative(process.cwd(), path.resolve(f)))
  const files = (args.length ? args.filter((f) => SCOPE.some((d) => f.startsWith(d + path.sep))) : SCOPE.flatMap(list)).filter(
    (f) => !SKIP.test(f) && fs.existsSync(f),
  )
  const hits = files.flatMap((f) => scan(fs.readFileSync(f, 'utf8'), f).map((h) => `${f}:${h.line}: ${h.message}`))
  if (hits.length) {
    console.error(`Hardcoded visual values (${hits.length}):\n${hits.map((h) => `  ${h}`).join('\n')}`)
    process.exit(1)
  }
  console.log(`Token usage OK: ${files.length} files`)
}
