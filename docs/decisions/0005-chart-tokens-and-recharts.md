# 0005 — Categorical chart tokens; Recharts via shadcn Chart

**Status:** accepted · 2026-09-29

## Context
The Overview chart needs four series. The kit's chart palette is one blue ramp (hard to tell apart), and the shadcn chart variables in code pointed at primary and confidence colours, which would give "Motor" the meaning of "high confidence".

## Decision
- New semantic tokens `color.chart.1–4`: blue, amber, green, violet. Series order is fixed (Motor, Property, Health, Travel), and each passes 3:1 on the card surface in light and dark.
- Recharts through shadcn's Chart component (the shadcn primitive), not hand-drawn SVG.
- Series are never told apart by colour alone: legend, totals, tooltip and a data table.

## Consequences
- Adds Recharts (bundle cost; to be split out of the main chunk).
- Figma chart bars rebound to the same tokens.
