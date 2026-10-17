// Pre-commit (simple-git-hooks → lint-staged): the fast checks on staged files, so a broken commit never leaves the machine.
// Runs sequentially (--concurrent false in the hook): Prettier rewrites a file before oxlint reads it.
const CODE = '*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'

export default {
  '*': 'prettier --write --ignore-unknown --log-level warn',
  [CODE]: 'oxlint --deny-warnings --report-unused-disable-directives',
  'src/{components,features,screens}/**/*.{ts,tsx,css}': 'node scripts/check-token-usage.js',
  // tsc can't check single files against the project config, so it runs once for the project.
  '*.{ts,tsx,mts,cts}': () => 'tsc -b',
  // Token sources or generated files: validate, build, contrast, then the generated files must equal what is staged
  // (catches a token change committed without its rebuild, and hand edits to generated files).
  '{tokens/**/*.json,src/styles/tokens.{css,ts}}': () => [
    'npm run --silent build:tokens',
    'git diff --exit-code src/styles/tokens.css src/styles/tokens.ts',
  ],
}
