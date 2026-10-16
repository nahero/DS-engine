// DTCG validation of tokens/**/*.json, run before Style Dictionary (npm run build:tokens). Exits 1 and lists every problem.
// Checks: every token has a known $type (own or inherited) and a value of the right shape; every {reference} resolves
// in each mode, without cycles, to a token of the same type; mode files (light/dark, comfortable/compact, each brand)
// define the same tokens.
import fs from 'node:fs'
import path from 'node:path'

const DIR = 'tokens'
const files = [...fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => path.join(DIR, f)), path.join(DIR, 'figma', 'primitive.json')]
const problems = []
const fail = (file, at, msg) => problems.push(`${file}: ${at}: ${msg}`)

const REF = /^\{([^{}]+)\}$/
const dim = (v) => v && typeof v === 'object' && typeof v.value === 'number' && ['px', 'rem'].includes(v.unit)
const SHAPES = {
  color: (v) => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v),
  dimension: dim,
  duration: (v) => v && typeof v === 'object' && typeof v.value === 'number' && ['ms', 's'].includes(v.unit),
  cubicBezier: (v) => Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number'),
  fontFamily: (v) => typeof v === 'string' || (Array.isArray(v) && v.every((s) => typeof s === 'string')),
  fontWeight: (v) => typeof v === 'number' || typeof v === 'string',
  number: (v) => typeof v === 'number',
  shadow: (v) =>
    (Array.isArray(v) ? v : [v]).every(
      (s) => s && (typeof s.color === 'string') && ['offsetX', 'offsetY', 'blur', 'spread'].every((k) => dim(s[k]) || REF.test(s[k] ?? '')),
    ),
}

// Flatten one file to { 'a.b.c': { type, value } }, checking names, types and shapes on the way.
function flatten(file) {
  const out = {}
  const walk = (node, at, type) => {
    const t = node.$type ?? type
    if ('$value' in node) {
      if (!t) return fail(file, at, 'no $type (own or inherited)')
      if (!SHAPES[t]) return fail(file, at, `unknown $type "${t}"`)
      const v = node.$value
      if (!(typeof v === 'string' && REF.test(v)) && !SHAPES[t](v)) fail(file, at, `$value ${JSON.stringify(v)} is not a valid ${t}`)
      out[at] = { type: t, value: v }
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue
      if (/[.{}]/.test(key)) fail(file, `${at}.${key}`, 'names must not contain ".", "{" or "}"')
      if (!child || typeof child !== 'object') fail(file, `${at}.${key}`, 'not a token or group')
      else walk(child, at ? `${at}.${key}` : key, t)
    }
  }
  walk(JSON.parse(fs.readFileSync(file, 'utf8')), '', undefined)
  return out
}

const tokens = Object.fromEntries(files.map((f) => [f, flatten(f)]))

// Mode groups: the first file is the default mode, the others replace it in their own build block.
const groups = [
  ['tokens/semantic.light.json', 'tokens/semantic.dark.json'],
  ['tokens/density.comfortable.json', 'tokens/density.compact.json'],
  ['tokens/brand.default.json', ...files.filter((f) => /brand\.(?!default)[^/]+\.json$/.test(f))],
]
const alternates = groups.flatMap(([, ...rest]) => rest)

for (const [base, ...others] of groups) {
  for (const other of others) {
    const a = Object.keys(tokens[base])
    const b = Object.keys(tokens[other])
    for (const k of a) if (!(k in tokens[other])) fail(other, k, `missing (defined in ${path.basename(base)})`)
    for (const k of b) if (!(k in tokens[base])) fail(other, k, `not defined in ${path.basename(base)}`)
  }
}

// Resolve every reference in every mode: the default set, and the default set with one alternate swapped in.
const defaults = files.filter((f) => !alternates.includes(f))
const modes = [['default', defaults], ...alternates.map((alt) => [path.basename(alt), defaults.map((f) => groups.find((g) => g[0] === f && g.includes(alt)) ? alt : f)])]
const fromRefs = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(fromRefs) : v && typeof v === 'object' ? Object.values(v).flatMap(fromRefs) : [])
  .map((s) => typeof s === 'string' && s.match(REF)?.[1])
  .filter(Boolean)

for (const [mode, set] of modes) {
  const all = {}
  for (const f of set) for (const [k, t] of Object.entries(tokens[f])) all[k] = { ...t, file: f }
  const resolve = (name, seen) => {
    if (seen.includes(name)) return `cycle ${[...seen, name].join(' → ')}`
    const t = all[name]
    if (!t) return `unresolved {${name}}`
    for (const ref of fromRefs(t.value)) {
      const err = resolve(ref, [...seen, name])
      if (err) return err
    }
    return null
  }
  for (const [k, t] of Object.entries(all)) {
    for (const ref of fromRefs(t.value)) {
      const err = resolve(ref, [k])
      if (err) fail(t.file, k, `${err} (mode ${mode})`)
      else if (typeof t.value === 'string' && REF.test(t.value) && all[ref].type !== t.type) {
        fail(t.file, k, `${t.type} token references {${ref}}, a ${all[ref].type} (mode ${mode})`)
      }
    }
  }
}

const unique = [...new Set(problems)]
if (unique.length) {
  console.error(`Token validation failed (${unique.length}):\n${unique.map((p) => `  ${p}`).join('\n')}`)
  process.exit(1)
}
console.log(`Tokens valid: ${Object.values(tokens).reduce((n, t) => n + Object.keys(t).length, 0)} tokens in ${files.length} files, ${modes.length} modes`)
