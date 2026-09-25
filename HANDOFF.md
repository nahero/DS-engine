# Handoff: review-desk

## Purpose
Portfolio project for a Product Design Engineer interview (next round: design lead).
Goal: show a real, AI-assisted design → code workflow, not just a pretty UI:

Figma variables → DTCG JSON → Style Dictionary → CSS variables → shadcn/ui components → Storybook → GitHub Pages, built with Claude Code.

## Theme
Concept UI for **human supervision of AI agent work**: an agent pre-processes incoming business submissions (insurance-flavoured, but naming stays generic), and a human reviewer checks, corrects and approves them.
Framed as a concept, not domain expertise.

Screens:
1. **Review queue**: dense table sorted by "needs attention", with status, agent confidence and flag reason. Includes filters, bulk approve for high-confidence items and keyboard navigation.
2. **Item detail**: extracted fields, each with a confidence indicator and a citation chip that opens the source document with the passage highlighted. Actions: approve, correct inline, refer. Plus an audit trail.

States everywhere: loading, empty, error, agent failed, low confidence, missing data, stale data.

## Constraints
- Claude Pro (Claude Code), Figma Pro, GitHub Free.
- **No Code Connect** (Org/Enterprise only). Replace it with a mapping table in `docs/design-system/components.md`.
- **No Figma Variables REST API** (Enterprise only). Token export is manual: plugin → DTCG JSON → commit to `tokens/`.
- Figma is not set up yet. Start with hand-written placeholder tokens and replace them later.
- Repo is public (required for Pages on the free plan).

## Stack
- Vite + React + TypeScript
- Tailwind v4 + shadcn/ui (Radix primitives)
- Storybook (Vite builder) with addon-a11y and addon-themes
- Style Dictionary (latest, DTCG input)
- Mock data: generated JSON / faker. Deliberately messy: long names, missing fields, ~1,000 rows.
- GitHub Actions → GitHub Pages

## Structure
```
review-desk/
├─ tokens/                  # DTCG JSON (source)
├─ sd.config.js
├─ src/
│  ├─ styles/tokens.css     # generated, never edit
│  ├─ styles/globals.css    # shadcn vars → semantic tokens
│  ├─ components/ui/        # shadcn base
│  ├─ components/review/    # project composites
│  ├─ screens/
│  └─ data/
├─ .storybook/
├─ .claude/skills/
├─ .github/workflows/deploy.yml
├─ docs/
│  ├─ HANDOFF.md
│  ├─ ai-log.md
│  └─ design-system/        # tokens, components, patterns, accessibility
└─ CLAUDE.md
```

## Tokens architecture
- Two tiers: **primitive** (`color.blue.500`) → **semantic** (`color.action.primary`, `color.status.warning.bg`). Components use semantic tokens only.
- Modes: light / dark (`.dark` class), density comfortable / compact (`[data-density="compact"]`).
- Style Dictionary outputs `src/styles/tokens.css` (CSS custom properties per mode).
- `globals.css` maps shadcn variables to semantic tokens (e.g. `--primary: var(--color-action-primary)`).

## Components (initial set)
Button, StatusBadge, ConfidenceIndicator, CitationChip, DataTable (TanStack Table), FilterBar, SidePanel, Toast.
Build on shadcn/Radix; never from scratch when a primitive exists.

## Agent instruction layering
- `CLAUDE.md`: short, always-on rules and commands.
- `docs/design-system/*.md`: knowledge (tokens, components + Figma→code mapping, patterns, accessibility). Human-readable too.
- `.claude/skills/`: procedures, to be created:
  - `new-component`: check inventory → build on shadcn → tokens only → stories for all states → a11y check → update components.md
  - `sync-tokens`: validate DTCG → run Style Dictionary → verify shadcn mapping
  - `ui-review`: audit a diff for hardcoded values, missing states, a11y issues

## Deploy
One workflow on push to `main`: build tokens → build app → build Storybook → deploy to Pages.
- App: `/review-desk/` (Vite `base: '/review-desk/'`)
- Storybook: `/review-desk/storybook/`

## Build order
1. Scaffold Vite/React/TS, Tailwind, shadcn, Storybook. Get the Pages deploy working with a placeholder page.
2. Style Dictionary with hand-written placeholder DTCG tokens (both modes, both densities). Map them into shadcn vars.
3. Create `docs/design-system/*` and the three skills.
4. *(Needs Figma)* Set up Figma variables and components, export DTCG, replace placeholders, connect Figma MCP:
   `claude mcp add --transport http figma https://mcp.figma.com/mcp`
5. Build components with full-state stories.
6. Build the screens and mock data.
7. README (decisions, not setup), finalise `docs/ai-log.md`, record a 3-min walkthrough.

## Deliverables that matter
- README explaining **decisions** and trade-offs (e.g. manual token export due to plan limits).
- `docs/ai-log.md`: every notable thing AI got wrong, how it was caught, and the fix.
- Live app + live Storybook links.
