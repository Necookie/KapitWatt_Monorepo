# @kapitwatt/styles

Tokens turned into React Native styles, plus the app-wide theme.

- `ThemeProvider`: wrap the root layout once. `scheme="light" | "dark" | "system"` (default light). Paints the page background.
- `themes.light` / `themes.dark` (`Theme`): colour roles, `text` (type roles as `TextStyle`), space, radius, size, state layers, motion.
- `toTextStyle`: a token type style as a `TextStyle`. Weight comes from the font family; never set `fontWeight` with Albert Sans.
- `fontSources`: the four static Albert Sans weights from `@kapitwatt/assets`, for expo-font.
