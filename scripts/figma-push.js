// Code → Figma, step 2: writes the DS collections into the Obra kit library file.
// Plugin API code, run by Claude through the Figma MCP `use_figma` tool (like figma-export.js).
// Replace the PAYLOAD placeholder below with the output of `node scripts/figma-push-payload.js`.
// Idempotent: collections, modes and variables are matched by name, created if missing, then
// overwritten. Never touches the kit's own collections. Variables that exist in Figma but not in
// the payload are reported, not deleted.
// Runs as the body of an async function: top-level await and return are allowed.

const PAYLOAD = __PAYLOAD__

const collections = await figma.variables.getLocalVariableCollectionsAsync()
const variables = await figma.variables.getLocalVariablesAsync()
const colByName = new Map(collections.map((c) => [c.name, c]))
const inCol = (col) => variables.filter((v) => v.variableCollectionId === col.id)

const raw = new Map(inCol(colByName.get('raw tailwind colors')).map((v) => [v.name, v]))
// Kit spacing variables by px value; named steps win over out-of-scale ones.
const spacing = new Map()
for (const v of inCol(colByName.get('spacing')).sort((a, b) => a.name.startsWith('out-of-scale') - b.name.startsWith('out-of-scale'))) {
  const px = Object.values(v.valuesByMode)[0]
  if (!spacing.has(px)) spacing.set(px, v)
}

const rgba = (hex) => {
  const [r, g, b, a = 255] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16))
  return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 }
}
const alias = (v) => ({ type: 'VARIABLE_ALIAS', id: v.id })

const report = { created: [], updated: 0, literals: [], orphans: [] }
const pushed = new Map() // "Collection:name" → variable

for (const spec of PAYLOAD) {
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
        target = value.pool === 'spacing' ? spacing.get(value.px) : undefined
        v.setValueForMode(modeIds[i], target ? alias(target) : value.px)
        if (!target) report.literals.push(`${spec.name}/${item.name} [${spec.modes[i]}] ${value.px}px`)
      }
    })
    pushed.set(`${spec.name}:${item.name}`, v)
  }
  const wanted = new Set(spec.variables.map((i) => i.name))
  report.orphans.push(...[...existing.keys()].filter((n) => !wanted.has(n)).map((n) => `${spec.name}/${n}`))
}

return report
