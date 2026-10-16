import { describe, expect, it } from 'vitest'
import { validate } from './validate-tokens.js'

// A minimal valid set; each test breaks one thing.
const base = () => ({
  'tokens/figma/primitive.json': {
    color: { $type: 'color', white: { $value: '#ffffff' }, black: { $value: '#000000' } },
    radius: { $type: 'dimension', sm: { $value: { value: 4, unit: 'px' } } },
  },
  'tokens/semantic.light.json': { color: { $type: 'color', bg: { $value: '{color.white}' } } },
  'tokens/semantic.dark.json': { color: { $type: 'color', bg: { $value: '{color.black}' } } },
  'tokens/component.json': {
    shadow: {
      $type: 'shadow',
      card: {
        $value: [
          {
            color: '{color.black}',
            offsetX: { value: 0, unit: 'px' },
            offsetY: '{radius.sm}',
            blur: { value: 2, unit: 'px' },
            spread: { value: 0, unit: 'px' },
          },
        ],
      },
    },
  },
})
const problems = (mutate) => {
  const s = base()
  mutate?.(s)
  return validate(s).problems
}

describe('validate-tokens', () => {
  it('passes a valid set', () => {
    expect(problems()).toEqual([])
  })

  it('catches an unresolved reference, and names a group as a group', () => {
    expect(problems((s) => (s['tokens/semantic.light.json'].color.bg.$value = '{color.whit}'))[0]).toMatch(/unresolved \{color\.whit\}/)
    expect(problems((s) => (s['tokens/semantic.light.json'].color.bg.$value = '{color}'))[0]).toMatch(/is a group/)
  })

  it('checks references inside composite values, with their member type', () => {
    expect(problems((s) => (s['tokens/component.json'].shadow.card.$value[0].spread = '{nope}'))[0]).toMatch(/unresolved \{nope\}/)
    expect(problems((s) => (s['tokens/component.json'].shadow.card.$value[0].color = '{radius.sm}'))[0]).toMatch(/needs a color/)
    expect(problems((s) => (s['tokens/component.json'].shadow.card.$value[0].color = 'banana'))[0]).toMatch(/not a valid shadow/)
  })

  it('catches a type mismatch, a bad value and an unknown type', () => {
    expect(problems((s) => (s['tokens/semantic.light.json'].color.bg.$value = '{radius.sm}'))[0]).toMatch(
      /needs a color but \{radius\.sm\} is a dimension/,
    )
    expect(problems((s) => (s['tokens/figma/primitive.json'].color.white.$value = '#fffff'))[0]).toMatch(/not a valid color/)
    expect(problems((s) => (s['tokens/figma/primitive.json'].color.$type = 'colour'))[0]).toMatch(/unknown \$type/)
  })

  it('catches a cycle', () => {
    const p = problems((s) => {
      s['tokens/figma/primitive.json'].color.white.$value = '{color.black}'
      s['tokens/figma/primitive.json'].color.black.$value = '{color.white}'
    })
    expect(p.join('\n')).toMatch(/cycle/)
  })

  it('catches a token missing from a mode file, and a duplicate across files', () => {
    expect(problems((s) => delete s['tokens/semantic.dark.json'].color.bg)[0]).toMatch(/missing \(defined in semantic\.light\.json\)/)
    expect(
      problems((s) => (s['tokens/component.json'].radius = { $type: 'dimension', sm: { $value: { value: 6, unit: 'px' } } })).join('\n'),
    ).toMatch(/also defined in/)
  })

  it('rejects brand file names the build would ignore', () => {
    expect(problems((s) => (s['tokens/brand.Teal_x.json'] = {}))[0]).toMatch(/brand file names/)
  })
})
