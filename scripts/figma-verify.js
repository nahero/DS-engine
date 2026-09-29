// Code ↔ Figma parity check. Read-only Plugin API code, run by Claude through the Figma MCP `use_figma` tool
// on the library file, like figma-push.js. Replace the PAYLOAD placeholder with `node scripts/figma-push-payload.js`.
// Compares every DS variable (per mode, alias target or resolved px) and the kit `shadcn colors` adapter
// against the payload. Returns mismatches, variables missing in Figma, and DS variables Figma has but code doesn't.
// Runs as the body of an async function: top-level await and return are allowed.

const PAYLOAD = __PAYLOAD__

const collections = await figma.variables.getLocalVariableCollectionsAsync()
const variables = await figma.variables.getLocalVariablesAsync()
const colName = new Map(collections.map((c) => [c.id, c.name]))
const byId = new Map(variables.map((v) => [v.id, v]))
const label = (v) => {
  const col = colName.get(v.variableCollectionId)
  return col === 'raw tailwind colors' ? v.name : `${col}:${v.name}`
}
const expected = (value) => (value.alias ? (value.collection ? `${value.collection}:${value.alias}` : value.alias) : value.hex ?? value.px)
const actual = (value, wantNumber) => {
  if (!wantNumber) return value?.type === 'VARIABLE_ALIAS' ? label(byId.get(value.id)) : JSON.stringify(value)
  let v = value
  for (let i = 0; i < 5 && v?.type === 'VARIABLE_ALIAS'; i++) v = Object.values(byId.get(v.id).valuesByMode)[0]
  return v
}

const report = { checked: 0, mismatches: [], missing: [], extra: [], adapter: [] }
const seen = new Set()
for (const spec of PAYLOAD.collections) {
  const col = collections.find((c) => c.name === spec.name)
  if (!col) {
    report.missing.push(`collection ${spec.name}`)
    continue
  }
  for (const item of spec.variables) {
    const v = variables.find((x) => x.variableCollectionId === col.id && x.name === item.name)
    if (!v) {
      report.missing.push(`${spec.name}/${item.name}`)
      continue
    }
    seen.add(v.id)
    report.checked++
    spec.modes.forEach((modeName, i) => {
      const mode = col.modes.find((m) => m.name === modeName)
      const want = expected(item.values[i])
      const got = actual(v.valuesByMode[mode?.modeId], typeof want === 'number')
      if (got !== want) report.mismatches.push(`${spec.name}/${item.name} [${modeName}] figma=${got} code=${want}`)
    })
  }
  report.extra.push(
    ...variables
      .filter((x) => x.variableCollectionId === col.id && !x.name.startsWith('kit/') && !seen.has(x.id))
      .map((x) => `${spec.name}/${x.name}`),
  )
}

const kit = collections.find((c) => c.name === 'shadcn colors')
for (const v of variables.filter((x) => x.variableCollectionId === kit.id)) {
  const target = PAYLOAD.adapter[v.name.split('/').at(-1).trim().toLowerCase().replace(/\s+/g, '-')]
  if (!target) continue
  const want = `${target.collection}:${target.alias}`
  for (const m of kit.modes) {
    const got = actual(v.valuesByMode[m.modeId], false)
    if (got !== want) report.adapter.push(`${v.name} [${m.name}] figma=${got} code=${want}`)
  }
}

return report
