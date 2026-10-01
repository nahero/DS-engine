import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ConfidenceIndicator } from './ConfidenceIndicator'

const meta = {
  title: 'Patterns/ConfidenceIndicator',
  component: ConfidenceIndicator,
  args: { score: 94 },
  parameters: {
    docs: {
      description: {
        component:
          'Agent confidence as icon + number + label (`94% · High`). Bands: High ≥ 90, Medium 70–89, Low < 70. A missing score reads "No score", never 0%. Colour is a secondary cue.',
      },
    },
  },
} satisfies Meta<typeof ConfidenceIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const High: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Confidence 94%, high')).toBeInTheDocument()
  },
}

export const Medium: Story = {
  args: { score: 78 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Confidence 78%, medium')).toBeInTheDocument()
  },
}

export const Low: Story = {
  args: { score: 52 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Confidence 52%, low')).toBeInTheDocument()
  },
}

/** Missing score: "No score", not 0%. */
export const None: Story = {
  args: { score: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No score')).toBeInTheDocument()
    await expect(canvas.queryByText(/0%/)).not.toBeInTheDocument()
  },
}

/** Band edges: 90 is High, 89 Medium, 70 Medium, 69 Low, 0 is a real (Low) score. */
export const BandBoundaries: Story = {
  render: () => (
    <ul className="flex flex-col gap-2">
      {[100, 90, 89, 70, 69, 0].map((score) => (
        <li key={score}>
          <ConfidenceIndicator score={score} />
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Confidence 90%, high')).toBeInTheDocument()
    await expect(canvas.getByText('Confidence 89%, medium')).toBeInTheDocument()
    await expect(canvas.getByText('Confidence 70%, medium')).toBeInTheDocument()
    await expect(canvas.getByText('Confidence 69%, low')).toBeInTheDocument()
  },
}

export const AllLevels: Story = {
  render: () => (
    <ul className="flex flex-col gap-2">
      {[94, 78, 52, null].map((score) => (
        <li key={String(score)}>
          <ConfidenceIndicator score={score} />
        </li>
      ))}
    </ul>
  ),
}
