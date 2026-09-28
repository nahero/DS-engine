// Code → Figma, step 1: turns the hand-owned token JSON into the payload for scripts/figma-push.js.
// Usage: node scripts/figma-push-payload.js > <payload.json>
// Collections (order matters: DS Semantic aliases DS Brand):
//   DS Brand     modes per tokens/brand.<name>.json (Default first), aliases Figma primitives
//   DS Semantic  Light / Dark, aliases primitives or DS Brand
//   DS Density   Comfortable / Compact, aliases kit spacing variables by value
// Kit references ({kit.*}) are resolved to the primitive for that mode, so a frame only needs the
// DS collections' modes set; aliasing the kit's moded variables would also need the kit mode switched.
import fs from 'node:fs'

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const get = (tree, path) => path.split('.').reduce((node, k) => node?.[k], tree)
const title = (s) => s[0].toUpperCase() + s.slice(1)

const primitive = read('tokens/figma/primitive.json')
const kit = { light: read('tokens/figma/kit.light.json'), dark: read('tokens/figma/kit.dark.json') }
const semantic = { light: read('tokens/semantic.light.json'), dark: read('tokens/semantic.dark.json') }
const density = { comfortable: read('tokens/density.comfortable.json'), compact: read('tokens/density.compact.json') }
const themes = fs
  .readdirSync('tokens')
  .map((f) => f.match(/^brand\.([a-z0-9-]+)\.json$/)?.[1])
  .filter(Boolean)
  .sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b)))
const brand = Object.fromEntries(themes.map((t) => [t, read(`tokens/brand.${t}.json`)]))

// Leaf tokens under a group, as [path segments, token].
function leaves(node, path = []) {
  if (node && typeof node === 'object' && '$value' in node) return [[path, node]]
  return Object.entries(node ?? {})
    .filter(([k]) => !k.startsWith('$'))
    .flatMap(([k, v]) => leaves(v, [...path, k]))
}

// Colour value → { alias: '<figma variable name>', collection? } or { hex }.
function color(value, mode) {
  if (!value.startsWith('{')) return { hex: value }
  const ref = value.slice(1, -1)
  const [head, ...rest] = ref.split('.')
  if (head === 'color') return { alias: `tw-raw/${rest.join('/')}` }
  if (head === 'kit') return color(get(kit[mode], ref).$value, mode)
  if (head === 'brand') return { alias: rest.join('/'), collection: 'DS Brand' }
  throw new Error(`Can't map ${value} to Figma`)
}

// Dimension value → { px, pool } (pool: kit collection to alias by value) or { px }.
function dimension(value) {
  if (typeof value === 'object') return { px: value.value }
  const ref = value.slice(1, -1)
  const px = get(primitive, ref).$value.value
  return ref.startsWith('space.') ? { px, pool: 'spacing' } : { px }
}

const COLOR_SCOPES = {
  bg: ['FRAME_FILL', 'SHAPE_FILL'],
  fg: ['TEXT_FILL', 'SHAPE_FILL'],
  border: ['STROKE_COLOR'],
  fill: ['FRAME_FILL', 'SHAPE_FILL'],
  mark: ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'],
}
function colorScopes(path) {
  const last = path.at(-1)
  if (path[0] === 'bg') return COLOR_SCOPES.bg
  if (path[0] === 'fg' || last === 'fg') return COLOR_SCOPES.fg
  if (path[0] === 'border' || last === 'border') return path.at(-1) === 'focus' ? [...COLOR_SCOPES.border, 'EFFECT_COLOR'] : COLOR_SCOPES.border
  if (path[0] === 'confidence') return COLOR_SCOPES.mark
  return COLOR_SCOPES.fill
}

const brandCollection = {
  name: 'DS Brand',
  modes: themes.map(title),
  variables: leaves(brand.default.brand).map(([path]) => ({
    name: path.join('/'),
    type: 'COLOR',
    scopes: [],
    web: `var(--ds-brand-${path.join('-')})`,
    description: 'Brand layer: used through DS Semantic, not directly.',
    values: themes.map((t) => color(get(brand[t].brand, path.join('.')).$value, path[0])),
  })),
}

const semanticCollection = {
  name: 'DS Semantic',
  modes: ['Light', 'Dark'],
  variables: leaves(semantic.light.color).map(([path, token]) => ({
    name: path.join('/'),
    type: 'COLOR',
    scopes: colorScopes(path),
    web: `var(--ds-color-${path.join('-')})`,
    description: token.$description ?? '',
    values: ['light', 'dark'].map((mode) => color(get(semantic[mode].color, path.join('.')).$value, mode)),
  })),
}

const densityScopes = (path) =>
  path[0] === 'space' ? ['GAP'] : path[0] === 'font' ? ['FONT_SIZE'] : ['WIDTH_HEIGHT']
const densityCollection = {
  name: 'DS Density',
  modes: ['Comfortable', 'Compact'],
  variables: leaves(density.comfortable).map(([path, token]) => ({
    name: path.join('/'),
    type: 'FLOAT',
    scopes: densityScopes(path),
    web: `var(--ds-${path.join('-')})`,
    description: token.$description ?? '',
    values: ['comfortable', 'compact'].map((d) => dimension(get(density[d], path.join('.')).$value)),
  })),
}

process.stdout.write(JSON.stringify([brandCollection, semanticCollection, densityCollection], null, 2) + '\n')
