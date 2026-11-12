# @kapitwatt/icons

The KapitWatt icon set: 48 [Phosphor](https://phosphoricons.com) icons (MIT, see `PHOSPHOR-LICENSE`) in
regular, bold and fill, rendered with `react-native-svg` on Android and the web.

```tsx
import { Icon } from '@kapitwatt/icons';

<Icon name="energy" />                                  // 24 px, onSurface, regular
<Icon name="verified" size="sm" color="relief" />       // inline with text
<Icon name="home" weight="fill" color="primary" />      // selected tab
<Icon name="refresh" label="Refresh totals" />          // icon-only control: give it a label
```

- **Names say what the icon means in KapitWatt**, not what it looks like: `alert`, `energy`, `commit`, `countdown`,
  `meterPhoto`, `smartMeter`, `verified`, `flagged`, `simulated`, `points`, `barangay`, … See `scripts/generate.mjs`.
- **Sizes:** `sm` 18 (inline with text), `md` 24 (default), `lg` 32 (empty states, banners).
- **Weights:** `regular` everywhere; `fill` for a selected tab or active state; `bold` next to bold labels.
- **Colour:** a colour role (`primary`, `relief`, …) or a colour value a parent already resolved.
- **Accessibility:** icons are hidden from screen readers unless you pass `label`. Pass it only when the icon
  is the only thing that says what a control does.

## Adding an icon

1. Find it at https://phosphoricons.com.
2. Add `semanticName: 'phosphor-file-name'` to `ICONS` in `scripts/generate.mjs`.
3. `pnpm --filter @kapitwatt/icons generate` (rewrites `src/glyphs.ts`; never edit that file by hand).

Only the icons listed are bundled. The apps need `react-native-svg` (Expo SDK 58 pins 15.16.0; Expo Go
includes it): add it with `npx expo install react-native-svg` when wiring an app.
