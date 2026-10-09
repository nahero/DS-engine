# 0012 — A brand can restyle surfaces, borders, navigation, icons and charts

**Status:** accepted · 2026-10-09 · extends [0003](0003-one-switch-per-axis.md) and [0006](0006-brand-accent-tint.md); supersedes the fixed chart palette in [0005](0005-chart-tokens-and-recharts.md)

## Context
The Purple brand only changed primary buttons, focus rings and a faint tint, so it barely read as a brand. The brief: use the brand colour more (purple 600 with lighter purples), a light-gray page, softer outlines, its own chart palette.

## Decision
- The brand layer gained roles for page and subtle backgrounds, both border strengths plus a hover outline, secondary actions, the active nav item, navigation icons, the avatar, and chart fills with their outlines. The table is in [`tokens.md`](../design-system/tokens.md).
- Semantic tokens alias the brand roles. The Default brand sets every new role to its previous value, so it looks the same.
- Component changes were limited to wiring:
  - the sidebar's active state uses `nav.active`;
  - controls take `border.hover` on hover;
  - navigation icons take `icon.accent`;
  - the avatar takes `avatar.*`;
  - chart bars take a per-series outline.
- Accessibility is unchanged as a rule:
  - Control outlines stay at 3:1. They are gray at rest and purple on hover and focus.
  - Chart marks pass when the fill **or its outline** reaches 3:1 on the card. Purple's 400-level fills (1.5–3.0:1 on white) carry a 600-level outline of the same hue; in dark mode the fills pass alone.
- Indigo, teal and lime were added to the primitives exported from Figma.
- Decided with the designer in three review rounds on a static review page, before anything was pushed.

## Consequences
- A brand is now a real theme: about 30 roles instead of 6. A new brand must set all of them.
- One table change is not brand-specific and applies everywhere: policyholder and claimed amount are bold, claim number and line of business are muted.
