// WCAG contrast check for semantic colour pairs in every brand theme × light/dark. Exits 1 on any failure.
// Text pairs need 4.5:1, non-text (focus, strong borders, confidence marks) need 3:1.
import fs from 'node:fs'

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const THEMES = fs
  .readdirSync('tokens')
  .map((f) => f.match(/^brand\.([a-z0-9-]+)\.json$/)?.[1])
  .filter(Boolean)
const MODES = Object.fromEntries(
  THEMES.flatMap((theme) =>
    ['light', 'dark'].map((mode) => [
      `${theme}/${mode}`,
      ['tokens/figma/primitive.json', `tokens/brand.${theme}.json`, `tokens/semantic.${mode}.json`],
    ]),
  ),
)

const TEXT = 4.5
const NON_TEXT = 3
const pairs = [
  ...['default', 'muted', 'subtle'].flatMap((fg) =>
    ['canvas', 'surface', 'surface-raised', 'subtle'].map((bg) => [`fg.${fg}`, `bg.${bg}`, TEXT]),
  ),
  ['fg.inverse', 'bg.inverse', TEXT],
  ...['primary', 'secondary', 'danger', 'danger-soft'].flatMap((a) => [
    [`action.${a}.fg`, `action.${a}.base`, TEXT],
    [`action.${a}.fg`, `action.${a}.hover`, TEXT],
  ]),
  ...['info', 'success', 'warning', 'danger', 'neutral'].map((s) => [`status.${s}.fg`, `status.${s}.bg`, TEXT]),
  ['fg.default', 'highlight.citation.bg', TEXT],
  ...['canvas', 'surface'].map((bg) => ['border.focus', `bg.${bg}`, NON_TEXT]),
  ['border.strong', 'bg.surface', NON_TEXT],
  ...['high', 'medium', 'low'].map((c) => [`confidence.${c}`, 'bg.surface', NON_TEXT]),
]

function merge(files) {
  const tree = {}
  const deep = (target, src) => {
    for (const [k, v] of Object.entries(src)) {
      if (v && typeof v === 'object' && !('$value' in v)) deep((target[k] ??= {}), v)
      else target[k] = v
    }
  }
  files.forEach((f) => deep(tree, read(f)))
  return tree
}

function resolve(tree, path) {
  const token = path.split('.').reduce((node, k) => node?.[k], tree)
  if (!token) throw new Error(`Unknown token ${path}`)
  const value = token.$value
  return typeof value === 'string' && value.startsWith('{') ? resolve(tree, value.slice(1, -1)) : value
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

let failures = 0
for (const [mode, files] of Object.entries(MODES)) {
  const tree = merge(files)
  for (const [fg, bg, min] of pairs) {
    const [a, b] = [resolve(tree, `color.${fg}`), resolve(tree, `color.${bg}`)]
    const r = ratio(a, b)
    if (r < min) {
      failures++
      console.error(`✗ ${mode}: ${fg} (${a}) on ${bg} (${b}) = ${r.toFixed(2)}:1, needs ${min}:1`)
    }
  }
}
if (failures) {
  console.error(`${failures} contrast failure(s). Fix in tokens/semantic.*.json, not in tokens/figma/.`)
  process.exit(1)
}
console.log(`Contrast OK: ${pairs.length} pairs × ${Object.keys(MODES).length} modes`)
