// Code → Figma, step 2: writes the DS collections into the Obra kit library file.
// Plugin API code, run by Claude through the Figma MCP `use_figma` tool (like figma-export.js).
// Replace the PAYLOAD placeholder below with the output of `node scripts/figma-push-payload.js`.
// Idempotent: collections, modes and variables are matched by name, created if missing, then
// overwritten. Variables that exist in Figma but not in the payload are reported, not deleted.
// The only kit collection it writes is `shadcn colors` (the adapter): each mapped variable aliases
// its DS token in every kit mode. Previous values are returned in `adapterBefore` for rollback.
// With `kitOverlays`, every other kit colour that differs between the kit's modes (alpha overlays)
// moves into DS Semantic as a hidden `kit/<name>` variable, so DS Semantic is the only light/dark switch.
// Runs as the body of an async function: top-level await and return are allowed.

const PAYLOAD = __PAYLOAD__

const collections = await figma.variables.getLocalVariableCollectionsAsync()
const variables = await figma.variables.getLocalVariablesAsync()
const colByName = new Map(collections.map((c) => [c.name, c]))
const inCol = (col) => variables.filter((v) => v.variableCollectionId === col.id)

const raw = new Map(inCol(colByName.get('raw tailwind colors')).map((v) => [v.name, v]))
// Kit spacing / radius variables by px value; named steps win over out-of-scale ones.
const pools = {}
for (const name of ['spacing', 'border radii']) {
  pools[name] = new Map()
  for (const v of inCol(colByName.get(name)).sort((a, b) => a.name.startsWith('out-of-scale') - b.name.startsWith('out-of-scale'))) {
    const px = Object.values(v.valuesByMode)[0]
    if (!pools[name].has(px)) pools[name].set(px, v)
  }
}

const rgba = (hex) => {
  const [r, g, b, a = 255] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16))
  return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 }
}
const alias = (v) => ({ type: 'VARIABLE_ALIAS', id: v.id })

const report = { created: [], updated: 0, literals: [], orphans: [], skipped: PAYLOAD.skipped, adapted: 0, unadapted: [], adapterBefore: {}, overlays: 0, overlayBefore: {} }
// "Collection:name" → variable; seeded with what's already in Figma so a partial payload can alias it.
const colNameById = new Map(collections.map((c) => [c.id, c.name]))
const pushed = new Map(variables.map((v) => [`${colNameById.get(v.variableCollectionId)}:${v.name}`, v]))

for (const spec of PAYLOAD.collections) {
  let col = colByName.get(spec.name)
  if (!col) {
    col = figma.variables.createVariableCollection(spec.name)
    col.renameMode(col.modes[0].modeId, spec.modes[0])
    report.created.push(`collection ${spec.name}`)
  }
  const modeIds = spec.modes.map((name) => col.modes.find((m) => m.name === name)?.modeId ?? col.addMode(name))

  const existing = new Map(inCol(col).map((v) => [v.name, v]))
  for (const item of spec.variables) {
    let v = existing.get(item.name)
    if (v && v.resolvedType !== item.type) throw new Error(`${spec.name}/${item.name} is ${v.resolvedType}, expected ${item.type}`)
    if (!v) {
      v = figma.variables.createVariable(item.name, col, item.type)
      report.created.push(`${spec.name}: ${item.name}`)
    } else report.updated++
    v.scopes = item.scopes
    v.description = item.description
    v.setVariableCodeSyntax('WEB', item.web)
    item.values.forEach((value, i) => {
      let target
      if (value.alias) {
        target = value.collection ? pushed.get(`${value.collection}:${value.alias}`) : raw.get(value.alias)
        if (!target) throw new Error(`${spec.name}/${item.name}: no variable ${value.collection ?? ''} ${value.alias}`)
        v.setValueForMode(modeIds[i], alias(target))
      } else if (value.hex) {
        v.setValueForMode(modeIds[i], rgba(value.hex))
        report.literals.push(`${spec.name}/${item.name} [${spec.modes[i]}] ${value.hex}`)
      } else {
        target = value.pool ? pools[value.pool].get(value.px) : undefined
        v.setValueForMode(modeIds[i], target ? alias(target) : value.px)
        if (!target) report.literals.push(`${spec.name}/${item.name} [${spec.modes[i]}] ${value.px}px`)
      }
    })
    pushed.set(`${spec.name}:${item.name}`, v)
  }
  const wanted = new Set(spec.variables.map((i) => i.name))
  report.orphans.push(...[...existing.keys()].filter((n) => !wanted.has(n) && !n.startsWith('kit/')).map((n) => `${spec.name}/${n}`))
}

// Adapter: kit `shadcn colors/<group>/<name>` → shadcn CSS name → DS token.
const kitCol = colByName.get('shadcn colors')
const cssName = (name) => name.split('/').at(-1).trim().toLowerCase().replace(/\s+/g, '-')
for (const v of PAYLOAD.adapter ? inCol(kitCol) : []) {
  const target = PAYLOAD.adapter[cssName(v.name)]
  if (!target) {
    report.unadapted.push(v.name)
    continue
  }
  const ds = pushed.get(`${target.collection}:${target.alias}`)
  if (!ds) throw new Error(`Adapter ${v.name}: no variable ${target.collection} ${target.alias}`)
  report.adapterBefore[v.name] = v.valuesByMode
  for (const mode of kitCol.modes) v.setValueForMode(mode.modeId, alias(ds))
  report.adapted++
}

if (PAYLOAD.kitOverlays) {
  const sem = colByName.get('DS Semantic')
  const semModes = ['Light', 'Dark'].map((n) => sem.modes.find((m) => m.name === n).modeId)
  const kitModes = ['shadcn', 'shadcn-dark'].map((n) => kitCol.modes.find((m) => m.name === n).modeId)
  const semVars = new Map(inCol(sem).map((v) => [v.name, v]))
  const byId = new Map(variables.map((v) => [v.id, v]))
  // Follow aliases inside the kit collection in the same mode; stop at anything outside it.
  const resolveInKit = (value, modeId) => {
    const target = value?.type === 'VARIABLE_ALIAS' ? byId.get(value.id) : null
    return target && target.variableCollectionId === kitCol.id ? resolveInKit(target.valuesByMode[modeId], modeId) : value
  }
  const pending = inCol(kitCol)
    .filter((v) => v.resolvedType === 'COLOR')
    .map((v) => ({ v, values: kitModes.map((m) => resolveInKit(v.valuesByMode[m], m)) }))
    .filter(({ values }) => JSON.stringify(values[0]) !== JSON.stringify(values[1]))
  for (const { v, values } of pending) {
    const name = `kit/${v.name}`
    const s = semVars.get(name) ?? figma.variables.createVariable(name, sem, 'COLOR')
    s.scopes = []
    s.description = 'Figma-only: kit overlay moved under DS Semantic so light/dark is one switch. Not in code.'
    values.forEach((value, i) => s.setValueForMode(semModes[i], value))
    report.overlayBefore[v.name] = v.valuesByMode
    for (const m of kitModes) v.setValueForMode(m, alias(s))
    report.overlays++
  }
}

return report
