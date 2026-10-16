// Pre-commit (simple-git-hooks → lint-staged): the fast checks on staged files, so a broken commit never leaves the machine.
// Runs sequentially (--concurrent false in the hook): Prettier rewrites a file before oxlint reads it.
export default {
  '*': 'prettier --write --ignore-unknown --log-level warn',
  '*.{ts,tsx,js,mjs}': 'oxlint --deny-warnings --report-unused-disable-directives',
  'src/{components,features,screens}/**/*.{ts,tsx,css}': 'node scripts/check-token-usage.js',
  // tsc can't check single files against the project config, so it runs once for the project.
  '*.{ts,tsx}': () => 'tsc -b',
  // Token sources: DTCG validation and WCAG contrast (both read the JSON, no build needed).
  'tokens/**/*.json': () => ['node scripts/validate-tokens.js', 'node scripts/check-contrast.js'],
}
