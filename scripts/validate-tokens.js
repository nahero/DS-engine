// DTCG validation of tokens/**/*.json, run before Style Dictionary (npm run build:tokens). Exits 1 and lists every problem.
// Checks: every token has a known $type (own or inherited) and a value of the right shape, composite members included;
// every {reference}, including those inside composite values and strings, resolves in each mode, without cycles, to a
// token (not a group) of the right type; no token is defined twice in one mode; mode files (light/dark,
// comfortable/compact, each brand) define the same tokens.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const REF = /^\{([^{}]+)\}$/
const REFS = /\{([^{}]+)\}/g
const isRef = (v) => typeof v === 'string' && REF.test(v)
const dim = (v) => isRef(v) || (v && typeof v === 'object' && typeof v.value === 'number' && ['px', 'rem'].includes(v.unit))
const color = (v) => isRef(v) || (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v))
const SHAPES = {
  color,
  dimension: dim,
  duration: (v) => v && typeof v === 'object' && typeof v.value === 'number' && ['ms', 's'].includes(v.unit),
  cubicBezier: (v) => Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number'),
  fontFamily: (v) => typeof v === 'string' || (Array.isArray(v) && v.every((s) => typeof s === 'string')),
  fontWeight: (v) => typeof v === 'number' || typeof v === 'string',
  number: (v) => typeof v === 'number',
  shadow: (v) =>
    (Array.isArray(v) ? v : [v]).every((s) => s && color(s.color) && ['offsetX', 'offsetY', 'blur', 'spread'].every((k) => dim(s[k]))),
}
// Expected type of a reference found at a member of a composite value.
const MEMBER_TYPE = { color: 'color', offsetX: 'dimension', offsetY: 'dimension', blur: 'dimension', spread: 'dimension' }

// Every {reference} in a value, with the type it must have (null = any, e.g. inside a font stack string).
function refsIn(value, type, member) {
  if (typeof value === 'string') {
    if (isRef(value)) return [{ name: value.slice(1, -1), type: member ? (MEMBER_TYPE[member] ?? null) : type }]
    return [...value.matchAll(REFS)].map((m) => ({ name: m[1], type: null }))
  }
  if (Array.isArray(value)) return value.flatMap((v) => refsIn(v, type, member))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => refsIn(v, type, k))
  return []
}

// Flatten one file to { 'a.b.c': { type, value } }, checking names, types and shapes on the way.
function flatten(json, file, fail) {
  const out = {}
  const groups = new Set()
  const walk = (node, at, type) => {
    const t = node.$type ?? type
    if ('$value' in node) {
      if (!t) return fail(file, at, 'no $type (own or inherited)')
      if (!SHAPES[t]) return fail(file, at, `unknown $type "${t}"`)
      if (!isRef(node.$value) && !SHAPES[t](node.$value)) fail(file, at, `$value ${JSON.stringify(node.$value)} is not a valid ${t}`)
      out[at] = { type: t, value: node.$value }
      return
    }
    if (at) groups.add(at)
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue
      if (/[.{}]/.test(key)) fail(file, `${at}.${key}`, 'names must not contain ".", "{" or "}"')
      if (!child || typeof child !== 'object') fail(file, `${at}.${key}`, 'not a token or group')
      else walk(child, at ? `${at}.${key}` : key, t)
    }
  }
  walk(json, '', undefined)
  return { tokens: out, groups }
}

/** Problems in a token set: `{ 'tokens/x.json': json }`. Brand files are `tokens/brand.<name>.json`. */
export function validate(sources) {
  const problems = []
  const fail = (file, at, msg) => problems.push(`${file}: ${at}: ${msg}`)
  const files = Object.keys(sources)
  const flat = Object.fromEntries(files.map((f) => [f, flatten(sources[f], f, fail)]))
  const tokens = (f) => flat[f].tokens

  // Mode groups: the first file is the default mode; the others replace it in their own build block.
  // Brand names follow sd.config.js, which only builds `brand.[a-z0-9-]+.json`.
  const brand = (f) => path.basename(f).match(/^brand\.([a-z0-9-]+)\.json$/)?.[1]
  for (const f of files)
    if (/^brand\./.test(path.basename(f)) && !brand(f))
      fail(f, '-', 'brand file names must be brand.[a-z0-9-]+.json (sd.config.js ignores others)')
  const groups = [
    ['tokens/semantic.light.json', 'tokens/semantic.dark.json'],
    ['tokens/density.comfortable.json', 'tokens/density.compact.json'],
    ['tokens/brand.default.json', ...files.filter((f) => brand(f) && brand(f) !== 'default')],
  ].filter(([base]) => files.includes(base))
  const alternates = groups.flatMap(([, ...rest]) => rest)

  for (const [base, ...others] of groups) {
    for (const other of others) {
      for (const k of Object.keys(tokens(base))) if (!(k in tokens(other))) fail(other, k, `missing (defined in ${path.basename(base)})`)
      for (const k of Object.keys(tokens(other))) if (!(k in tokens(base))) fail(other, k, `not defined in ${path.basename(base)}`)
    }
  }

  // Resolve every reference in every mode: the default set, and the default set with one alternate swapped in.
  const defaults = files.filter((f) => !alternates.includes(f))
  const modes = [
    ['default', defaults],
    ...alternates.map((alt) => [path.basename(alt), defaults.map((f) => (groups.some((g) => g[0] === f && g.includes(alt)) ? alt : f))]),
  ]
  for (const [mode, set] of modes) {
    const all = {}
    const groupNames = new Set()
    for (const f of set) {
      for (const [k, t] of Object.entries(tokens(f))) {
        if (all[k]) fail(f, k, `also defined in ${all[k].file} (mode ${mode})`)
        else all[k] = { ...t, file: f }
      }
      for (const g of flat[f].groups) groupNames.add(g)
    }
    const resolve = (name, seen) => {
      if (seen.includes(name)) return `cycle ${[...seen, name].join(' → ')}`
      if (!all[name]) return groupNames.has(name) ? `{${name}} is a group, not a token` : `unresolved {${name}}`
      for (const ref of refsIn(all[name].value, all[name].type)) {
        const err = resolve(ref.name, [...seen, name])
        if (err) return err
      }
      return null
    }
    for (const [k, t] of Object.entries(all)) {
      for (const ref of refsIn(t.value, t.type)) {
        const err = resolve(ref.name, [k])
        if (err) fail(t.file, k, `${err} (mode ${mode})`)
        else if (ref.type && all[ref.name].type !== ref.type)
          fail(t.file, k, `needs a ${ref.type} but {${ref.name}} is a ${all[ref.name].type} (mode ${mode})`)
      }
    }
  }
  return {
    problems: [...new Set(problems)],
    count: Object.values(flat).reduce((n, f) => n + Object.keys(f.tokens).length, 0),
    modes: modes.length,
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const DIR = 'tokens'
  const files = [
    ...fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(DIR, f)),
    path.join(DIR, 'figma', 'primitive.json'),
  ]
  const { problems, count, modes } = validate(Object.fromEntries(files.map((f) => [f, JSON.parse(fs.readFileSync(f, 'utf8'))])))
  if (problems.length) {
    console.error(`Token validation failed (${problems.length}):\n${problems.map((p) => `  ${p}`).join('\n')}`)
    process.exit(1)
  }
  console.log(`Tokens valid: ${count} tokens in ${files.length} files, ${modes} modes`)
}
