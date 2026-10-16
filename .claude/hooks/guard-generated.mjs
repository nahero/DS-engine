// PreToolUse hook (Edit / Write / MultiEdit): generated files are never edited by hand (CLAUDE.md hard rule).
// Exit 2 blocks the edit and tells the agent where the source is.
import fs from 'node:fs'
import path from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
const file = input.tool_input?.file_path
if (!file) process.exit(0)

const rel = path.relative(root, file).split(path.sep).join('/')
const GENERATED = {
  'src/styles/tokens.css': 'Edit tokens/*.json, then npm run build:tokens.',
  'src/styles/tokens.ts': 'Edit tokens/*.json, then npm run build:tokens.',
}

const reason = GENERATED[rel] ?? (rel.startsWith('tokens/figma/') ? 'Re-export from Figma (sync-tokens skill).' : null)
if (reason) {
  process.stderr.write(`${rel} is generated and must not be edited by hand. ${reason}\n`)
  process.exit(2)
}
