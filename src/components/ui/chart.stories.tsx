import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from './chart'
import { Skeleton } from './skeleton'

const weeks = [
  { week: 'W36', Motor: 212, Property: 96, Health: 74, Travel: 31 },
  { week: 'W37', Motor: 238, Property: 104, Health: 81, Travel: 44 },
  { week: 'W38', Motor: 197, Property: 121, Health: 69, Travel: 52 },
  { week: 'W39', Motor: 254, Property: 88, Health: 92, Travel: 38 },
]

const config = {
  Motor: { label: 'Motor', color: 'var(--chart-1)' },
  Property: { label: 'Property', color: 'var(--chart-2)' },
  Health: { label: 'Health', color: 'var(--chart-3)' },
  Travel: { label: 'Travel', color: 'var(--chart-4)' },
} satisfies ChartConfig

const series = ['Motor', 'Property', 'Health', 'Travel'] as const

// Name the figure and say what it shows in words; the plot alone is not readable by assistive tech.
function Figure({ id, title, summary, children }: { id: string; title: string; summary: string; children: ReactNode }) {
  return (
    <figure aria-labelledby={`${id}-caption`} className="flex max-w-xl flex-col gap-2">
      <figcaption id={`${id}-caption`} className="text-label font-medium text-fg">
        {title}
        <span className="block text-caption font-normal text-fg-muted">{summary}</span>
      </figcaption>
      {children}
    </figure>
  )
}

const bar = (
  <BarChart accessibilityLayer data={weeks}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
    <YAxis tickLine={false} axisLine={false} width={32} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
    {series.map((k) => (
      <Bar key={k} dataKey={k} fill={`var(--color-${k})`} radius={4} isAnimationActive={false} />
    ))}
  </BarChart>
)

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  args: { config, children: bar },
  parameters: {
    docs: {
      description: {
        component:
          'Recharts wrapper. Series colours come from the `--chart-1..4` tokens through the `config` (never hex). Always wrap in a `<figure>` with a caption, add a legend (colour is not the only key) and a tooltip.',
      },
    },
  },
} satisfies Meta<typeof ChartContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Bars: Story = {
  name: 'Bar',
  render: (args) => (
    <Figure id="bar" title="Claims per week, W36 to W39 2026" summary="Motor leads every week, peaking at 254 claims in W39.">
      <ChartContainer {...args} className="aspect-video w-full" />
    </Figure>
  ),
}

export const Lines: Story = {
  name: 'Line',
  render: (args) => (
    <Figure id="line" title="Claims per week by line of business" summary="Travel grows from 31 to 52 claims between W36 and W38.">
      <ChartContainer {...args} className="aspect-video w-full">
        <LineChart accessibilityLayer data={weeks}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {series.map((k) => (
            <Line key={k} dataKey={k} type="monotone" stroke={`var(--color-${k})`} strokeWidth={2} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ChartContainer>
    </Figure>
  ),
}

export const SingleSeries: Story = {
  render: (args) => (
    <Figure id="single" title="Motor claims per week" summary="Between 197 and 254 claims a week.">
      <ChartContainer {...args} config={{ Motor: config.Motor }} className="aspect-video w-full">
        <BarChart accessibilityLayer data={weeks}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
          <Bar dataKey="Motor" fill="var(--color-Motor)" radius={4} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </Figure>
  ),
}

export const Loading: Story = {
  render: () => (
    <figure aria-busy="true" aria-labelledby="loading-caption" className="flex max-w-xl flex-col gap-2">
      <figcaption id="loading-caption" className="text-label font-medium text-fg">
        Claims per week
      </figcaption>
      <div role="status" className="sr-only">
        Loading chart
      </div>
      <Skeleton className="aspect-video w-full" />
    </figure>
  ),
}

export const Empty: Story = {
  render: () => (
    <figure aria-labelledby="empty-caption" className="flex max-w-xl flex-col gap-2">
      <figcaption id="empty-caption" className="text-label font-medium text-fg">
        Claims per week
      </figcaption>
      <div className="flex aspect-video w-full items-center justify-center rounded-surface border border-dashed border-border text-body text-fg-muted">
        No claims reported in this period.
      </div>
    </figure>
  ),
}

// Long series labels truncate in the legend area and wrap instead of overflowing the plot.
export const LongLabels: Story = {
  render: (args) => (
    <Figure id="long" title="Claims per week by policyholder group" summary="Four largest groups, W36 to W39 2026.">
      <ChartContainer
        {...args}
        config={{
          Motor: { label: 'Montgomery-Whitfield Motor Fleet Holdings', color: 'var(--chart-1)' },
          Property: { label: 'Featherstonehaugh Property Development Group', color: 'var(--chart-2)' },
          Health: { label: 'Northwind Mutual Health Partners', color: 'var(--chart-3)' },
          Travel: { label: 'Atlantic Travel and Events Insurance', color: 'var(--chart-4)' },
        }}
        className="aspect-video w-full"
      >
        <BarChart accessibilityLayer data={weeks}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
          {series.map((k) => (
            <Bar key={k} dataKey={k} fill={`var(--color-${k})`} radius={4} isAnimationActive={false} />
          ))}
        </BarChart>
      </ChartContainer>
    </Figure>
  ),
}
