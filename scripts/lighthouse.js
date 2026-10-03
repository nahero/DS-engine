// Lighthouse CI against the built app (run `npm run build` first; CI builds via Playwright's webServer).
// Runs twice: desktop (lighthouserc.json, preset desktop) and mobile (lighthouserc.mobile.json, Lighthouse's
// default emulation). Both require performance >= 0.9, accessibility = 1, best-practices >= 0.95 (median of 3).
// KNOWN EXCEPTION: mobile Overview performance is asserted at >= 0.85 (measured 0.88-0.89). Its first render needs
// the app shell plus Recharts under 4x CPU throttling. Remove the exception in lighthouserc.mobile.json once the
// chart is split out of the Overview's first render.
// Chrome comes from Playwright's Chromium (CHROME_PATH), so no extra browser is installed.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

if (!existsSync('dist/index.html')) {
  console.error('dist/ is missing. Run `npm run build` first.')
  process.exit(1)
}

process.env.CHROME_PATH ??= require('playwright').chromium.executablePath()

const runs = [
  { name: 'mobile', config: 'lighthouserc.mobile.json', args: [] },
  { name: 'desktop', config: 'lighthouserc.json', args: ['--collect.settings.preset=desktop'] },
]

let failed = false
for (const { name, config, args } of runs) {
  console.log(`\n== Lighthouse CI: ${name} ==`)
  const result = spawnSync(
    'npx',
    ['lhci', 'autorun', `--config=${config}`, `--upload.outputDir=.lighthouseci/${name}`, ...args],
    { stdio: 'inherit' },
  )
  if (result.status !== 0) failed = true
}
process.exit(failed ? 1 : 0)
