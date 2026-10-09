// Writes the output of scripts/figma-export.js (saved to a JSON file) to tokens/figma/*.json.
// Usage: node scripts/write-figma-tokens.js <export.json>
import fs from 'node:fs'

// --merge: the export holds only some tokens (e.g. newly added hues); merge them into the existing file.
const args = process.argv.slice(2)
const mergeMode = args.includes('--merge')
const [input] = args.filter((a) => a !== '--merge')
if (!input) throw new Error('Usage: node scripts/write-figma-tokens.js <export.json> [--merge]')
const exported = JSON.parse(fs.readFileSync(input, 'utf8'))
const deepMerge = (target, source) => {
  for (const [key, value] of Object.entries(source)) {
    const isGroup = typeof value === 'object' && value !== null && !Array.isArray(value) && !('$value' in value)
    target[key] = isGroup ? deepMerge(target[key] ?? {}, value) : value
  }
  return target
}

// $-keys first, then numeric keys ascending. JS always puts integer keys (space.4) before
// any string key, so fractional steps (space.1-5) and $type land after them; SD doesn't care.
const step = (key) => Number(key.replace('-', '.'))
function order(node) {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return node
  const keys = Object.keys(node)
  const meta = keys.filter((k) => k.startsWith('$'))
  const rest = keys.filter((k) => !k.startsWith('$'))
  const numeric = rest.every((k) => !Number.isNaN(step(k)))
  if (numeric) rest.sort((a, b) => step(a) - step(b))
  return Object.fromEntries([...meta, ...rest].map((k) => [k, k.startsWith('$') ? node[k] : order(node[k])]))
}

fs.mkdirSync('tokens/figma', { recursive: true })
for (const [name, tokens] of Object.entries(exported)) {
  const file = `tokens/figma/${name}.json`
  const next = mergeMode && fs.existsSync(file) ? deepMerge(JSON.parse(fs.readFileSync(file, 'utf8')), tokens) : tokens
  fs.writeFileSync(file, JSON.stringify(order(next), null, 2) + '\n')
  console.log(`Wrote ${file}`)
}
