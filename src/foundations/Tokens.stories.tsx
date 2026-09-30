import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import semantic from '../../tokens/semantic.json'
import light from '../../tokens/semantic.light.json'
import dark from '../../tokens/semantic.dark.json'
import comfortable from '../../tokens/density.comfortable.json'
import compact from '../../tokens/density.compact.json'
import motion from '../../tokens/motion.json'
import primitive from '../../tokens/figma/primitive.json'
import component from '../../tokens/component.json'
import brandDefault from '../../tokens/brand.default.json'
import brandPurple from '../../tokens/brand.purple.json'

type Token = { path: string[]; value: unknown }

// Flattens a DTCG tree into leaf tokens ({ path, $value }).
function flatten(node: object, path: string[] = []): Token[] {
  if ('$value' in node) return [{ path, value: node.$value }]
  return Object.entries(node).flatMap(([key, child]) =>
    key.startsWith('$') || typeof child !== 'object' || child === null ? [] : flatten(child, [...path, key]),
  )
}

const cssVar = (path: string[]) => `--ds-${path.join('-')}`
const name = (path: string[]) => path.join('.')
const lookup = (tokens: Token[]) => new Map(tokens.map((t) => [name(t.path), String(t.value)]))
// "{color.purple.600}" → "var(--ds-color-purple-600)": aliases resolve through the same CSS variables the app uses.
const aliasVar = (value: unknown) => {
  const match = /^\{(.+)\}$/.exec(String(value))
  return match ? `var(--ds-${match[1].replaceAll('.', '-')})` : String(value)
}

function TokenTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table className="w-full border-collapse text-body">
      <thead>
        <tr className="border-b border-border-strong text-left text-fg-muted">
          {headers.map((h) => (
            <th key={h} scope="col" className="px-cell py-2 font-medium">
              {h || <span className="sr-only">Swatch</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-caption text-fg-muted">{children}</code>
)

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-stack bg-canvas p-inset text-fg">
      <h1 className="text-heading-md font-bold">{title}</h1>
      {children}
    </div>
  )
}

function Colors() {
  const darkValues = lookup(flatten(dark))
  return (
    <Page title="Semantic colors">
      <TokenTable headers={['', 'Token', 'CSS variable', 'Light', 'Dark']}>
        {flatten(light).map((t) => (
          <tr key={name(t.path)} className="h-row border-b border-border">
            <td className="px-cell">
              <div
                aria-hidden
                className="size-8 rounded-inner border border-border"
                style={{ background: `var(${cssVar(t.path)})` }}
              />
            </td>
            <td className="px-cell">{name(t.path)}</td>
            <td className="px-cell"><Code>{cssVar(t.path)}</Code></td>
            <td className="px-cell"><Code>{String(t.value)}</Code></td>
            <td className="px-cell"><Code>{darkValues.get(name(t.path))}</Code></td>
          </tr>
        ))}
      </TokenTable>
    </Page>
  )
}

function Density() {
  const compactValues = lookup(flatten(compact))
  return (
    <Page title="Density">
      <p className="text-fg-muted">Bars use the live value; switch Density in the toolbar.</p>
      <TokenTable headers={['Token', 'CSS variable', 'Comfortable', 'Compact', 'Live']}>
        {flatten(comfortable).map((t) => (
          <tr key={name(t.path)} className="h-row border-b border-border">
            <td className="px-cell">{name(t.path)}</td>
            <td className="px-cell"><Code>{cssVar(t.path)}</Code></td>
            <td className="px-cell"><Code>{String(t.value)}</Code></td>
            <td className="px-cell"><Code>{compactValues.get(name(t.path))}</Code></td>
            <td className="px-cell">
              <div aria-hidden className="h-2 rounded-inner bg-action-primary" style={{ width: `var(${cssVar(t.path)})` }} />
            </td>
          </tr>
        ))}
      </TokenTable>
    </Page>
  )
}

function Typography() {
  const sizes = [...flatten(semantic.font.size, ['font', 'size']), ...flatten(comfortable.font.size, ['font', 'size'])]
  return (
    <Page title="Typography">
      <TokenTable headers={['Token', 'CSS variable', 'Sample']}>
        {sizes.map((t) => (
          <tr key={name(t.path)} className="border-b border-border">
            <td className="px-cell py-2">{name(t.path)}</td>
            <td className="px-cell py-2"><Code>{cssVar(t.path)}</Code></td>
            <td className="px-cell py-2" style={{ fontSize: `var(${cssVar(t.path)})` } as CSSProperties}>
              Claim #10482 · Policy holder name missing
            </td>
          </tr>
        ))}
      </TokenTable>
    </Page>
  )
}

function RadiusAndShadow() {
  const items = [...flatten(semantic.radius, ['radius']), ...flatten(semantic.shadow, ['shadow'])]
  return (
    <Page title="Radius and shadow">
      <div className="flex flex-wrap gap-stack">
        {items.map((t) => {
          const isShadow = t.path[0] === 'shadow'
          return (
            <figure key={name(t.path)} className="flex flex-col gap-2">
              <div
                aria-hidden
                className={`size-24 border border-border bg-surface ${isShadow ? 'rounded-surface' : ''}`}
                style={isShadow ? { boxShadow: `var(${cssVar(t.path)})` } : { borderRadius: `var(${cssVar(t.path)})` }}
              />
              <figcaption className="flex flex-col">
                <span>{name(t.path)}</span>
                <Code>{cssVar(t.path)}</Code>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </Page>
  )
}

// Hover or focus a row to play it. Durations use the standard easing; easings use the base duration.
function Motion() {
  const tokens = flatten(motion)
  const format = (value: unknown) =>
    Array.isArray(value) ? `cubic-bezier(${value.join(', ')})` : `${(value as { value: number }).value}ms`
  return (
    <Page title="Motion">
      <p className="text-fg-muted">
        Hover or focus a row to play it. Set Motion to reduced in the toolbar: every duration becomes 0.
      </p>
      <TokenTable headers={['Token', 'CSS variable', 'Value', 'Preview']}>
        {tokens.map((t) => {
          const isDuration = t.path[1] === 'duration'
          const style: CSSProperties = {
            transitionProperty: 'translate',
            transitionDuration: isDuration ? `var(${cssVar(t.path)})` : 'var(--ds-motion-duration-base)',
            transitionTimingFunction: isDuration ? 'var(--ds-motion-easing-standard)' : `var(${cssVar(t.path)})`,
          }
          return (
            <tr key={name(t.path)} className="h-row border-b border-border">
              <td className="px-cell">{name(t.path)}</td>
              <td className="px-cell"><Code>{cssVar(t.path)}</Code></td>
              <td className="px-cell"><Code>{format(t.value)}</Code></td>
              <td className="px-cell">
                <button
                  type="button"
                  aria-label={`Preview ${name(t.path)}`}
                  className="group w-48 rounded-inner border border-border bg-subtle p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className="block size-4 rounded-inner bg-action-primary group-hover:translate-x-40 group-focus-visible:translate-x-40"
                    style={style}
                  />
                </button>
              </td>
            </tr>
          )
        })}
      </TokenTable>
    </Page>
  )
}

function Primitives() {
  const hues = Object.entries(primitive.color).filter(([key]) => !key.startsWith('$'))
  return (
    <Page title="Primitive colors">
      <p className="text-fg-muted">
        Exported from the Figma kit (<Code>tokens/figma/primitive.json</Code>). Components never use these directly; semantic
        and brand tokens alias them.
      </p>
      <div className="flex flex-col gap-stack">
        {hues.map(([hue, steps]) => {
          const tokens = typeof steps === 'object' && steps !== null && '$value' in steps
            ? [{ path: ['color', hue], value: steps.$value }]
            : flatten(steps as object, ['color', hue])
          return (
            <div key={hue} className="flex flex-col gap-2">
              <h2 className="text-body font-medium">{hue}</h2>
              <div className="flex flex-wrap gap-2">
                {tokens.map((t) => (
                  <figure key={name(t.path)} className="flex w-20 flex-col gap-1">
                    <div
                      aria-hidden
                      className="h-10 rounded-inner border border-border"
                      style={{ background: `var(${cssVar(t.path)}, ${String(t.value)})` }}
                    />
                    <figcaption className="flex flex-col">
                      <span className="text-caption">{t.path.at(-1)}</span>
                      <Code>{String(t.value)}</Code>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Page>
  )
}

function Brand() {
  const themes = [
    { label: 'Default', tokens: lookup(flatten(brandDefault)) },
    { label: 'Purple', tokens: lookup(flatten(brandPurple)) },
  ]
  return (
    <Page title="Brand themes">
      <p className="text-fg-muted">
        Roles that change per brand (<Code>tokens/brand.*.json</Code>), each with a light and dark value. Semantic tokens alias
        them; switch Brand in the toolbar to apply a theme.
      </p>
      <TokenTable headers={['Token', 'CSS variable', ...themes.map((t) => t.label)]}>
        {flatten(brandDefault).map((t) => (
          <tr key={name(t.path)} className="h-row border-b border-border">
            <td className="px-cell">{name(t.path)}</td>
            <td className="px-cell"><Code>{cssVar(t.path)}</Code></td>
            {themes.map((theme) => {
              const value = theme.tokens.get(name(t.path))
              return (
                <td key={theme.label} className="px-cell">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="size-6 shrink-0 rounded-inner border border-border" style={{ background: aliasVar(value) }} />
                    <Code>{value}</Code>
                  </span>
                </td>
              )
            })}
          </tr>
        ))}
      </TokenTable>
    </Page>
  )
}

function Components() {
  return (
    <Page title="Component tokens">
      <p className="text-fg-muted">
        Only where a component needs its own knob (<Code>tokens/component.json</Code>). They alias semantic tokens, so they
        follow light/dark, brand and density.
      </p>
      <TokenTable headers={['', 'Token', 'CSS variable', 'Alias']}>
        {flatten(component).map((t) => {
          const isColor = /bg|border/.test(t.path.at(-1) ?? '')
          return (
            <tr key={name(t.path)} className="h-row border-b border-border">
              <td className="px-cell">
                {isColor && (
                  <div aria-hidden className="size-8 rounded-inner border border-border" style={{ background: `var(${cssVar(t.path)})` }} />
                )}
              </td>
              <td className="px-cell">{name(t.path)}</td>
              <td className="px-cell"><Code>{cssVar(t.path)}</Code></td>
              <td className="px-cell"><Code>{typeof t.value === 'object' ? 'shadow (see Radius and shadow)' : String(t.value)}</Code></td>
            </tr>
          )
        })}
      </TokenTable>
    </Page>
  )
}

const meta = {
  title: 'Foundations/Tokens',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SemanticColors: Story = { render: () => <Colors /> }
export const DensityTokens: Story = { name: 'Density', render: () => <Density /> }
export const TypographyTokens: Story = { name: 'Typography', render: () => <Typography /> }
export const RadiusAndShadowTokens: Story = { name: 'Radius and shadow', render: () => <RadiusAndShadow /> }
export const MotionTokens: Story = { name: 'Motion', render: () => <Motion /> }
export const PrimitiveColors: Story = { name: 'Primitive colors', render: () => <Primitives /> }
export const BrandThemes: Story = { name: 'Brand themes', render: () => <Brand /> }
export const ComponentTokens: Story = { name: 'Component tokens', render: () => <Components /> }
