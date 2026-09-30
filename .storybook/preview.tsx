import type { Decorator, Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import '../src/styles/globals.css'
import { TooltipProvider } from '../src/components/ui/tooltip'

const withDensity: Decorator = (Story, context) => {
  const density = context.globals.density ?? 'comfortable'
  const root = document.documentElement
  if (density === 'compact') root.dataset.density = 'compact'
  else delete root.dataset.density
  return <Story />
}

// Brand theme (tokens/brand.<name>.json). "theme" is taken by addon-themes for light/dark.
const withBrand: Decorator = (Story, context) => {
  const brand = context.globals.brand ?? 'default'
  const root = document.documentElement
  if (brand === 'default') delete root.dataset.theme
  else root.dataset.theme = brand
  return <Story />
}

// "Reduced" forces the prefers-reduced-motion behaviour; "System" follows the OS setting.
const withMotion: Decorator = (Story, context) => {
  const root = document.documentElement
  if (context.globals.motion === 'reduced') root.dataset.motion = 'reduced'
  else delete root.dataset.motion
  return <Story />
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
  globalTypes: {
    brand: {
      description: 'Brand theme',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Brand: default' },
          { value: 'purple', title: 'Brand: purple' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Density',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Motion',
      toolbar: {
        title: 'Motion',
        icon: 'play',
        items: [
          { value: 'system', title: 'Motion: system' },
          { value: 'reduced', title: 'Motion: reduced' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    brand: 'default',
    density: 'comfortable',
    motion: 'system',
  },
  decorators: [
    // The app mounts one TooltipProvider (inside SidebarProvider); stories get the same.
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
    withBrand,
    withDensity,
    withMotion,
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
}

export default preview
