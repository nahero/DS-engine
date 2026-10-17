// Protected tests (ADR 0014): which added lines switch a test off. Used by before-done.mjs; tested in
// protected-tests.test.mjs.
// Blocked: `.only`, `.todo`, `.fixme`, `xit` / `xdescribe`, an a11y rule set to 'todo' or 'off', and a skip that isn't
// tied to a condition with a reason: `test.skip('name', …)`, `describe.skip(…)`, `test.skip()`, `test.skip(cond)`.
// Allowed: a conditional skip that names its reason, `test.skip(process.platform !== 'linux', 'Baselines are …')`.
const ALWAYS = /\b(?:it|test|describe)(?:\.describe)?\.(?:only|todo|fixme)\b|\bx(?:it|describe)\(|\btest:\s*['"](?:todo|off)['"]/
const SKIP = /\b(?:it|test|describe)(?:\.describe)?\.skip\(([^]*)$/

export function switchesOff(line) {
  if (ALWAYS.test(line)) return true
  const m = line.match(SKIP)
  if (!m) return false
  const args = m[1].trim()
  // A string first argument is a test definition; describe.skip is never conditional; no reason string means no reason.
  if (/^['"`)]/.test(args) || /\bdescribe(?:\.describe)?\.skip\(/.test(line)) return true
  return !/,\s*['"`][^'"`]+['"`]/.test(args)
}
