// Writes the output of scripts/figma-export.js (saved to a JSON file) to tokens/figma/*.json.
// Usage: node scripts/write-figma-tokens.js <export.json>
import fs from 'node:fs'

const [input] = process.argv.slice(2)
if (!input) throw new Error('Usage: node scripts/write-figma-tokens.js <export.json>')
const exported = JSON.parse(fs.readFileSync(input, 'utf8'))

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
  fs.writeFileSync(file, JSON.stringify(order(tokens), null, 2) + '\n')
  console.log(`Wrote ${file}`)
}
