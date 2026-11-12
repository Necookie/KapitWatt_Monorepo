# @kapitwatt/tokens

Design tokens as plain TypeScript, no dependencies. Usable from the apps, the API and scripts.

- `color.light` / `color.dark`: Material 3 colour roles plus KapitWatt signal roles (`alertRed`, `alertYellow`, `relief`, `simulated`, `brand`, `brandAccent`). Use roles, never `palette` tones, in UI code.
- `dataViz`: chart series (committed, delivered, target, baseline).
- `typeScale`: M3 type roles in Albert Sans, plus `dataLarge/Medium/Small` (tabular) for kW, kWh, PHP and countdowns.
- `space` (4-unit grid), `radius` (M3 shape), `size` (touch target 48, controls 32/40/56), `borderWidth`, `stateLayer`, `breakpoint`, `duration`, `easing`.
- `contrastRatio`, `withAlpha`.

Rules: red and yellow mean NGCP alerts only, always with the word. Teal means verified/delivered. Orange is
reward and brand warmth, never a warning. The UI is flat: surfaces step by tone (`surfaceContainer*`), no shadows.

`pnpm --filter @kapitwatt/tokens test` checks every text/fill pair for 4.5:1 and every border, focus ring and
chart mark for 3:1, in both themes. Palette values were generated with `@material/material-color-utilities`
(see the header of `src/palette.ts`).
