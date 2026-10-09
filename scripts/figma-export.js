// Figma → DTCG export. Plugin API code, run by Claude through the Figma MCP `use_figma` tool
// against the Obra shadcn kit library file (read-only). Not a Node script.
// Returns { primitive }, written to tokens/figma/primitive.json with scripts/write-figma-tokens.js.
// Only primitives come from Figma: the kit's shadcn colours are an adapter onto DS Semantic
// (see scripts/figma-push.js), not a token tier.
// Runs as the body of an async function: top-level await and return are allowed.

const SOURCE = 'Obra shadcn ui kit (Figma file dbk2ali9ax6GIGOOXNr2gp)'
// Only these raw Tailwind hues are exported; the kit ships 26. Add a hue here before using it.
const HUES = ['neutral', 'red', 'blue', 'green', 'amber', 'violet', 'purple', 'indigo', 'teal', 'lime']
const WEIGHTS = { Regular: 400, Medium: 500, Semibold: 600, Bold: 700 }
const FONT_FALLBACK = {
  sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
}

const collections = await figma.variables.getLocalVariableCollectionsAsync()
const variables = await figma.variables.getLocalVariablesAsync()
const byId = new Map(variables.map((v) => [v.id, v]))
const colById = new Map(collections.map((c) => [c.id, c]))
const col = (name) => collections.find((c) => c.name === name)
const inCol = (name) => variables.filter((v) => v.variableCollectionId === col(name).id)
const defaultValue = (v) => v.valuesByMode[colById.get(v.variableCollectionId).defaultModeId]

const px = (value) => ({ value, unit: 'px' })
const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d
const hex = ({ r, g, b }, alpha = 1) =>
  '#' +
  [r, g, b, ...(alpha < 1 ? [alpha] : [])].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
const set = (obj, path, leaf) => {
  const keys = path.split('.')
  let node = obj
  for (const k of keys.slice(0, -1)) node = node[k] ??= {}
  node[keys.at(-1)] = leaf
}

// Resolve a colour value to a DTCG reference ({color.*}) or a literal hex.
// Aliases into another collection use that collection's default mode; kit opacities are percent.
function resolveColor(value, modeId) {
  if (value?.type === 'VARIABLE_ALIAS') {
    const target = byId.get(value.id)
    const name = target.name
    let m
    if ((m = name.match(/^tw-raw\/(white|black)$/))) return `{color.${m[1]}}`
    if ((m = name.match(/^tw-raw\/([a-z]+)\/(\d+)$/)) && HUES.includes(m[1])) return `{color.${m[1]}.${m[2]}}`
    const next = modeId in target.valuesByMode ? target.valuesByMode[modeId] : defaultValue(target)
    return resolveColor(next, modeId)
  }
  if (value && 'color' in value) {
    const ref = resolveColor(value.color, modeId)
    return hex(literal(ref), value.opacity > 1 ? value.opacity / 100 : value.opacity)
  }
  return hex(value, value.a ?? 1)
}
// Literal RGB of a {color.*} reference (needed when the kit applies opacity to it).
function literal(ref) {
  if (!ref.startsWith('{')) throw new Error(`Expected reference, got ${ref}`)
  const path = ref.slice(1, -1).split('.')
  const raw = path.length === 2 ? `tw-raw/${path[1]}` : `tw-raw/${path[1]}/${path[2]}`
  return defaultValue(variables.find((v) => v.name === raw))
}

const primitive = { $description: `Generated from ${SOURCE} on ${new Date().toISOString().slice(0, 10)}. Do not edit; re-export.` }

// Colour: raw Tailwind palette (selected hues)
set(primitive, 'color.$type', 'color')
for (const v of inCol('raw tailwind colors')) {
  const m = v.name.match(/^tw-raw\/(?:(white|black)|([a-z]+)\/(\d+))$/)
  if (!m) continue
  if (m[1]) set(primitive, `color.${m[1]}`, { $value: hex(defaultValue(v)) })
  else if (HUES.includes(m[2])) set(primitive, `color.${m[2]}.${m[3]}`, { $value: hex(defaultValue(v)) })
}

// Spacing: px → Tailwind step (16px → space.4, 6px → space.1-5)
set(primitive, 'space.$type', 'dimension')
for (const v of inCol('spacing')) {
  const value = defaultValue(v)
  set(primitive, `space.${String(value / 4).replace('.', '-')}`, { $value: px(value) })
}

// Radius: named scale (radius-lg → radius.lg) plus off-scale values by px (out-of-scale/2 → radius.px-2)
set(primitive, 'radius.$type', 'dimension')
for (const v of inCol('border radii')) {
  const m = v.name.match(/^radius-([a-z0-9]+)/) ?? v.name.match(/^out-of-scale\/(\d+)$/)
  if (m) set(primitive, `radius.${m[0].startsWith('out') ? 'px-' : ''}${m[1]}`, { $value: px(defaultValue(v)) })
}

// Shadow: kit stores each layer as separate x/y/blur/spread floats plus one colour per size
set(primitive, 'shadow.$type', 'shadow')
const shadows = {}
for (const v of inCol('shadows')) {
  const parts = v.name.split('/')
  const size = parts[0]
  const layer = parts.length === 3 ? parts[1] : 'shadow 1'
  const prop = parts.at(-1).replace(/\d+$/, '')
  shadows[size] ??= { layers: {} }
  if (prop === 'color') shadows[size].color = resolveColor(defaultValue(v))
  else (shadows[size].layers[layer] ??= {})[prop] = defaultValue(v)
}
for (const [size, { color, layers }] of Object.entries(shadows)) {
  set(primitive, `shadow.${size}`, {
    $value: Object.values(layers).map((l) => ({
      color,
      offsetX: px(l.x),
      offsetY: px(l.y),
      blur: px(l.blur),
      spread: px(l.spread),
    })),
  })
}

// Typography
const typo = Object.fromEntries(inCol('typography').map((v) => [v.name, v]))
const typoValue = (name) => {
  if (!typo[name]) return undefined
  let value = defaultValue(typo[name])
  while (value?.type === 'VARIABLE_ALIAS') value = defaultValue(byId.get(value.id))
  return value
}
const family = (name, kind) => [`${name} Variable`, name, ...FONT_FALLBACK[kind]]
set(primitive, 'font.family', {
  $type: 'fontFamily',
  sans: { $value: family(typoValue('font definitions/font-family'), 'sans') },
  mono: { $value: family(typoValue('font definitions/font-family-monospace'), 'mono') },
})
set(primitive, 'font.weight.$type', 'fontWeight')
for (const v of inCol('typography').filter((v) => v.resolvedType === 'STRING' && /weight/i.test(v.name))) {
  const w = typoValue(v.name)
  if (WEIGHTS[w]) set(primitive, `font.weight.${w.toLowerCase()}`, { $value: WEIGHTS[w] })
}
set(primitive, 'font.size.$type', 'dimension')
set(primitive, 'font.line-height.$type', 'number')
const styles = {
  'heading-1': 'heading 1', 'heading-2': 'heading 2', 'heading-3': 'heading 3', 'heading-4': 'heading 4',
  'paragraph-large': 'paragraph/large', 'paragraph-regular': 'paragraph/regular',
  'paragraph-small': 'paragraph/small', 'paragraph-mini': 'paragraph/mini', caption: 'caption',
}
for (const [key, prefix] of Object.entries(styles)) {
  const size = typoValue(`${prefix}/font-size`)
  const lineHeight = typoValue(`${prefix}/line-height`) ?? typoValue(`${prefix}/line height`)
  set(primitive, `font.size.${size}`, { $value: px(size) })
  set(primitive, `font.line-height.${key}`, { $value: round(lineHeight / size) })
}

// Stringified so the MCP tool returns it verbatim.
return JSON.stringify({ primitive })
