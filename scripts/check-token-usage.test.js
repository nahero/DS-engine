import { describe, expect, it } from 'vitest'
import { scan } from './check-token-usage.js'

const messages = (src, file) => scan(src, file).map((h) => `${h.line}: ${h.message}`)

describe('check-token-usage', () => {
  it.each([
    ['p-[13px]'],
    ['hover:bg-[#ff0000]'],
    ['rounded-[6px]'],
    ['text-[13px]'],
    ['size-[18px]'],
    ['leading-[1.2]'],
    ['shadow-[0_0_4px_black]'],
    ['duration-[250ms]'],
    ['animate-[spin_3s_linear]'],
    ['-mt-[3px]'],
    ['[padding:8px]'],
    ['[box-shadow:0_0_4px_black]'],
  ])('flags the arbitrary value %s', (cls) => {
    expect(scan(`<div className="flex ${cls}" />`)).toHaveLength(cls.includes('#') ? 2 : 1)
  })

  it.each([
    ['w-[var(--sidebar-width)]'],
    ['max-w-[60ch]'],
    ['h-[100dvh]'],
    ['top-[50%]'],
    ['grid-cols-[1fr_auto]'],
    ['transition-[width]'],
    ['data-[state=open]:bg-surface'],
    ['[&:has([role=checkbox])]:pr-0'],
    ['supports-[display:grid]:grid'],
  ])('allows %s', (cls) => {
    expect(scan(`<div className="flex ${cls}" />`)).toEqual([])
  })

  it('finds colour literals in value positions, not in text', () => {
    expect(messages(`const c = '#333'\nconst d = 'rgb(0,0,0)'\nconst e = "oklch(0.5 0.1 200)"`)).toHaveLength(3)
    expect(scan(`<p>Claim #10482, ticket #123 and #bad</p>`)).toEqual([])
    expect(scan(`.a { color: #fff; }`, 'x.css')).toHaveLength(1)
  })

  it('keeps scanning after // inside a string', () => {
    expect(scan(`<a href="https://example.com" className="p-[3px]" />`)).toHaveLength(1)
  })

  it('ignores comments, including multi-line ones', () => {
    expect(scan(`// p-[13px]\n/*\n bg-[#fff]\n*/\nconst x = 1`)).toEqual([])
  })

  it('flags literal inline styles, on one line or several', () => {
    expect(scan(`<span style={{ width: 120 }} />`)).toHaveLength(1)
    expect(scan(`<span style={{ marginTop: '12px' }} />`)).toHaveLength(1)
    expect(scan(`<span style={{ color: 'red' }} />`)).toHaveLength(1)
    expect(scan(`<span style={{ paddingLeft: depth * 16 }} />`)).toHaveLength(1)
    expect(scan(`<span\n  style={\n    {\n      padding: 8,\n    } as CSSProperties\n  }\n/>`)).toHaveLength(1)
  })

  it('allows token and unitless inline styles', () => {
    expect(scan(`<span style={{ width: 'var(--size)' }} />`)).toEqual([])
    expect(scan(`<span style={{ flex: 1, minHeight: 0, zIndex: 1 }} />`)).toEqual([])
    expect(scan(`<span style={{ backgroundColor: item.color }} />`)).toEqual([])
  })

  it('honours an ignore with a reason and reports one without, or unused', () => {
    expect(scan(`// token-usage-ignore-next-line: matches the kit's 13px label\n<b className="text-[13px]" />`)).toEqual([])
    expect(messages(`// token-usage-ignore-next-line\n<b className="text-[13px]" />`)).toEqual(['1: token-usage-ignore-next-line needs a reason after a colon'])
    expect(messages(`// token-usage-ignore-next-line: nothing here\n<b />`)).toEqual(['1: unused token-usage-ignore-next-line'])
  })
})
