# @kapitwatt/hooks

- `useTheme()`, `useStyles(factory)`: read the theme from `ThemeProvider`; build memoised themed styles (define the factory outside the component).
- `useWindowClass()` / `windowClassFor(width)`: M3 window size class (compact, medium, expanded, large, extraLarge).
- `useCountdown(target, serverOffsetMs?)` / `countdown(targetMs, nowMs)`: peak window and photo deadline timers. Pass the server offset so deadlines follow the server clock.
- `useBrandFonts()`: load Albert Sans at the root layout; returns true when ready.
