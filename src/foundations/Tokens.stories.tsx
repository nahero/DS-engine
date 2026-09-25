import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import semantic from '../../tokens/semantic.json'
import light from '../../tokens/semantic.light.json'
import dark from '../../tokens/semantic.dark.json'
import comfortable from '../../tokens/density.comfortable.json'
import compact from '../../tokens/density.compact.json'

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

function TokenTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table className="w-full border-collapse text-body">
      <thead>
        <tr className="border-b border-border-strong text-left text-fg-muted">
          {headers.map((h) => (
            <th key={h} scope="col" className="px-cell py-2 font-medium">
              {h}
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
