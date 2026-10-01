import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Every story as a browser test; STORY_MODE sets the initial theme and density in .storybook/preview.tsx.
function storybookProject(name: string, mode: 'light-comfortable' | 'dark-compact') {
  return {
    extends: true,
    plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') })],
    define: { 'import.meta.env.VITE_STORY_MODE': JSON.stringify(mode) },
    test: {
      name,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        // Desktop width so the sidebar and tables render in their desktop layout; mobile stories set their own viewport.
        viewport: { width: 1280, height: 800 },
        instances: [{ browser: 'chromium' as const }],
      },
    },
  }
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.ts'],
          },
        },
        storybookProject('storybook', 'light-comfortable'),
        // Same stories again in the other corner of the matrix: dark + compact (contrast and density bugs live here).
        storybookProject('storybook-dark', 'dark-compact'),
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/data/**', 'src/lib/*.ts', 'src/features/claims/*-utils.ts'],
        exclude: ['**/*.test.ts', '**/*.stories.*'],
      },
    },
  }),
)
