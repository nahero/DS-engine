// Code → Figma, step 1: turns the hand-owned token JSON into the payload for scripts/figma-push.js.
// Usage: node scripts/figma-push-payload.js > <payload.json>
// Collections (order matters: DS Semantic aliases DS Brand):
//   DS Brand     modes per tokens/brand.<name>.json (Default first), aliases Figma primitives
//   DS Semantic  Light / Dark, aliases primitives or DS Brand
//   DS Density   Comfortable / Compact, aliases kit spacing variables by value
//   DS Component single mode, aliases DS Semantic / DS Density (radius: kit radius variables by value)
// Plus `adapter`: the kit's `shadcn colors` variables re-pointed at DS Semantic / DS Component,
// using the same shadcn → token mapping as src/styles/globals.css.
import fs from 'node:fs'

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const get = (tree, path) => path.split('.').reduce((node, k) => node?.[k], tree)
const title = (s) => s[0].toUpperCase() + s.slice(1)

const primitive = read('tokens/figma/primitive.json')
const tokens = read('tokens/semantic.json')
const component = read('tokens/component.json')
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
  if (head === 'brand') return { alias: rest.join('/'), collection: 'DS Brand' }
  throw new Error(`Can't map ${value} to Figma`)
}

// Dimension value → { px, pool } (pool: kit collection to alias by value) or { px }.
function dimension(value) {
  if (typeof value === 'object') return { px: value.value }
  const ref = value.slice(1, -1)
  if (get(tokens, ref)) return dimension(get(tokens, ref).$value)
  const px = get(primitive, ref).$value.value
  const pool = { space: 'spacing', radius: 'border radii' }[ref.split('.')[0]]
  return pool ? { px, pool } : { px }
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

// Component token value → alias into DS Semantic / DS Density, or a kit radius by value.
function componentValue(value, type) {
  const ref = value.slice(1, -1)
  if (type === 'color') return { alias: ref.replace(/^color\./, '').replaceAll('.', '/'), collection: 'DS Semantic' }
  if (get(density.comfortable, ref)) return { alias: ref.replaceAll('.', '/'), collection: 'DS Density' }
  return dimension(value)
}
const COMPONENT_SCOPES = { color: ['FRAME_FILL', 'SHAPE_FILL'], radius: ['CORNER_RADIUS'], padding: ['GAP'], gap: ['GAP'] }
const skipped = []
const componentCollection = {
  name: 'DS Component',
  modes: ['Default'],
  variables: Object.entries(component).flatMap(([name, group]) =>
    leaves(group).flatMap(([path, token]) => {
      const type = token.$type ?? group.$type
      if (type === 'shadow') {
        skipped.push(`${name}/${path.join('/')}: shadows are effect styles in Figma, not variables`)
        return []
      }
      const prop = path.at(-1)
      return [{
        name: `${name}/${path.join('/')}`,
        type: type === 'color' ? 'COLOR' : 'FLOAT',
        scopes: prop === 'border' ? ['STROKE_COLOR'] : COMPONENT_SCOPES[type === 'color' ? 'color' : prop] ?? ['WIDTH_HEIGHT'],
        web: `var(--ds-${name}-${path.join('-')})`,
        description: group.$description ?? '',
        values: [componentValue(token.$value, type)],
      }]
    }),
  ),
}

const collections = [brandCollection, semanticCollection, densityCollection, componentCollection]

// shadcn adapter: `--primary: var(--ds-color-action-primary-base)` in globals.css → kit variable
// `primary` aliases DS Semantic `action/primary/base` (in every kit mode).
const byWeb = new Map(collections.flatMap((c) => c.variables.map((v) => [v.web, { alias: v.name, collection: c.name }])))
const globals = fs.readFileSync('src/styles/globals.css', 'utf8')
const adapterBlock = globals.slice(globals.indexOf(':root', globals.indexOf('shadcn variable names are an adapter')))
const adapter = {}
for (const [, name, target] of adapterBlock.slice(0, adapterBlock.indexOf('}')).matchAll(/--([a-z0-9-]+):\s*(var\(--ds-[a-z0-9-]+\))/g)) {
  if (byWeb.has(target) && byWeb.get(target).collection !== 'DS Density') adapter[name] = byWeb.get(target)
}

process.stdout.write(JSON.stringify({ collections, adapter, skipped }, null, 2) + '\n')
