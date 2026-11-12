# @kapitwatt/ui

UI primitives for the household app (Android) and the dashboard (react-native-web). React Native core only;
everything reads the theme, so put `ThemeProvider` at the root.

| Component          | Use                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `Text`             | Every string. `variant` = type role (`dataLarge` for big numbers), `color` = colour role                                          |
| `Stack`            | Layout with token `gap` and `padding`                                                                                             |
| `Button`           | `filled` (one main action per screen), `tonal`, `outlined`, `text`; `size="lg"` (56) for household primary actions                |
| `Card`             | `filled` or `outlined`, optional `onPress`. Flat, no shadow                                                                       |
| `Chip`             | Status: `relief`, `accent`, `alertRed`, `alertYellow`, `simulated` (dashed), `primary`, `neutral`. Label says the status in words |
| `SegmentedButtons` | One of 2 to 5: commit presets, alert level, window presets                                                                        |
| `TextField`        | Outlined field, label above, `suffix` for units, `supportingText` / `error`                                                       |
| `ProgressBar`      | `value` 0 to 1, optional `target` marker; `size="thick"` for barangay progress                                                    |
| `AlertBanner`      | NGCP red or yellow alert; always shows the level in words and a badge                                                             |
| `Divider`          | Hairline separator                                                                                                                |

Icons are a slot (`icon` prop); no icon set is bundled yet.
