import { cleanup } from 'vitest-browser-react'
import { afterEach, beforeEach } from 'vitest'
import '@/styles/globals.css'

// Set by vitest.config.ts: every test file runs in light + comfortable and in dark + compact.
const DARK_COMPACT = import.meta.env.VITE_TEST_MODE === 'dark-compact'

beforeEach(() => {
  const root = document.documentElement
  root.classList.toggle('dark', DARK_COMPACT)
  if (DARK_COMPACT) root.dataset.density = 'compact'
  else delete root.dataset.density
  // Reduced motion keeps transitions and chart animations out of assertions.
  root.dataset.motion = 'reduced'
})

afterEach(async () => {
  await cleanup()
  document.body.replaceChildren()
})
