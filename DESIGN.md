---
version: alpha
name: KapitWatt
description: >-
  Residential demand response for Meralco households and operators. Material 3 structure, flat surfaces,
  Albert Sans, Grid Indigo with Kuryente Orange warmth, and reserved signal colours for NGCP alerts.
colors:
  brand: '#171C8F'
  on-brand: '#FFFFFF'
  brand-accent: '#F95D28'
  on-brand-accent: '#3A0B00'
  primary: '#3238A5'
  on-primary: '#FFFFFF'
  primary-container: '#E0E0FF'
  on-primary-container: '#00006E'
  secondary: '#5C5D72'
  on-secondary: '#FFFFFF'
  secondary-container: '#E1E0F9'
  on-secondary-container: '#191A2C'
  tertiary: '#AE3200'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#FFDBD0'
  on-tertiary-container: '#3A0B00'
  error: '#BA1A1A'
  on-error: '#FFFFFF'
  error-container: '#FFDAD5'
  on-error-container: '#410002'
  alert-red: '#BA1A1A'
  on-alert-red: '#FFFFFF'
  alert-red-container: '#FFDAD5'
  on-alert-red-container: '#410002'
  alert-yellow: '#F1C100'
  on-alert-yellow: '#241A00'
  alert-yellow-container: '#FFE08A'
  on-alert-yellow-container: '#241A00'
  relief: '#016A61'
  on-relief: '#FFFFFF'
  relief-container: '#A0F1E6'
  on-relief-container: '#00201D'
  simulated: '#5E5D67'
  simulated-container: '#E4E1EC'
  on-simulated-container: '#1B1B23'
  surface: '#FCF8FD'
  surface-dim: '#DCD9DE'
  surface-bright: '#FCF8FD'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F6F2F7'
  surface-container: '#F0EDF1'
  surface-container-high: '#EAE7EC'
  surface-container-highest: '#E5E1E6'
  on-surface: '#1B1B1F'
  on-surface-variant: '#46464F'
  outline: '#777680'
  outline-variant: '#C7C5D0'
  inverse-surface: '#303034'
  inverse-on-surface: '#F3EFF4'
  inverse-primary: '#BFC2FF'
  focus-ring: '#4B52BE'
  scrim: '#000000'
typography:
  display-large:
    fontFamily: Albert Sans
    fontSize: 57px
    fontWeight: 600
    lineHeight: 64px
    letterSpacing: -0.25px
  display-medium:
    fontFamily: Albert Sans
    fontSize: 45px
    fontWeight: 600
    lineHeight: 52px
    letterSpacing: 0px
  display-small:
    fontFamily: Albert Sans
    fontSize: 36px
    fontWeight: 600
    lineHeight: 44px
    letterSpacing: 0px
  headline-large:
    fontFamily: Albert Sans
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: 0px
  headline-medium:
    fontFamily: Albert Sans
    fontSize: 28px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: 0px
  headline-small:
    fontFamily: Albert Sans
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: 0px
  title-large:
    fontFamily: Albert Sans
    fontSize: 22px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: 0px
  title-medium:
    fontFamily: Albert Sans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0.15px
  title-small:
    fontFamily: Albert Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0.1px
  body-large:
    fontFamily: Albert Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0.5px
  body-medium:
    fontFamily: Albert Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0.25px
  body-small:
    fontFamily: Albert Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0.4px
  label-large:
    fontFamily: Albert Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.1px
  label-medium:
    fontFamily: Albert Sans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.5px
  label-small:
    fontFamily: Albert Sans
    fontSize: 11px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.5px
  data-large:
    fontFamily: Albert Sans
    fontSize: 45px
    fontWeight: 600
    lineHeight: 52px
    letterSpacing: -0.5px
    fontFeature: 'tnum'
  data-medium:
    fontFamily: Albert Sans
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -0.25px
    fontFeature: 'tnum'
  data-small:
    fontFamily: Albert Sans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: 0px
    fontFeature: 'tnum'
rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 28px
  full: 9999px
spacing:
  '0': 0px
  '0.5': 2px
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
  '12': 48px
  '16': 64px
components:
  logo:
    textColor: '{colors.brand}'
  logo-reverse:
    backgroundColor: '{colors.brand}'
    textColor: '{colors.on-brand}'
  app-frame:
    backgroundColor: '{colors.surface-container}'
    textColor: '{colors.on-surface}'
  content-pane:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.xl}'
    padding: 32px
  top-app-bar:
    backgroundColor: '{colors.surface-container}'
    textColor: '{colors.on-surface-variant}'
    height: 64px
  nav-drawer:
    backgroundColor: '{colors.surface-container}'
    width: 280px
    padding: 16px
  nav-item:
    textColor: '{colors.on-surface-variant}'
    typography: '{typography.label-large}'
    rounded: '{rounded.full}'
    height: 52px
    padding: 16px
  nav-item-active:
    backgroundColor: '{colors.secondary-container}'
    textColor: '{colors.on-secondary-container}'
    rounded: '{rounded.full}'
    height: 52px
  nav-rail:
    backgroundColor: '{colors.surface-container}'
    width: 80px
  nav-pilot-card:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 16px
  button-filled:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-large}'
    rounded: '{rounded.full}'
    height: 40px
    padding: 24px
  button-filled-large:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.title-medium}'
    rounded: '{rounded.full}'
    height: 56px
    padding: 32px
  button-tonal:
    backgroundColor: '{colors.secondary-container}'
    textColor: '{colors.on-secondary-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.full}'
    height: 40px
    padding: 24px
  button-outlined:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    typography: '{typography.label-large}'
    rounded: '{rounded.full}'
    height: 40px
    padding: 24px
  button-text:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    typography: '{typography.label-large}'
    rounded: '{rounded.full}'
    height: 40px
    padding: 12px
  card-filled:
    backgroundColor: '{colors.surface-container-highest}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.md}'
    padding: 16px
  card-outlined:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.md}'
    padding: 16px
  chip-neutral:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface-variant}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
    height: 32px
    padding: 12px
  chip-primary:
    backgroundColor: '{colors.primary-container}'
    textColor: '{colors.on-primary-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
    height: 32px
  chip-accent:
    backgroundColor: '{colors.tertiary-container}'
    textColor: '{colors.on-tertiary-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
    height: 32px
  chip-relief:
    backgroundColor: '{colors.relief-container}'
    textColor: '{colors.on-relief-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
    height: 32px
  chip-alert-red:
    backgroundColor: '{colors.alert-red-container}'
    textColor: '{colors.on-alert-red-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
    height: 32px
  chip-alert-yellow:
    backgroundColor: '{colors.alert-yellow-container}'
    textColor: '{colors.on-alert-yellow-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
    height: 32px
  chip-simulated:
    backgroundColor: '{colors.simulated-container}'
    textColor: '{colors.on-simulated-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
    height: 32px
  points-badge:
    backgroundColor: '{colors.brand-accent}'
    textColor: '{colors.on-brand-accent}'
    typography: '{typography.label-large}'
    rounded: '{rounded.sm}'
  alert-banner-red:
    backgroundColor: '{colors.alert-red}'
    textColor: '{colors.on-alert-red}'
    typography: '{typography.title-medium}'
    rounded: '{rounded.lg}'
    padding: 16px
  alert-banner-yellow:
    backgroundColor: '{colors.alert-yellow}'
    textColor: '{colors.on-alert-yellow}'
    typography: '{typography.title-medium}'
    rounded: '{rounded.lg}'
    padding: 16px
  segmented-button:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.label-large}'
    rounded: '{rounded.full}'
    height: 40px
  segmented-button-selected:
    backgroundColor: '{colors.secondary-container}'
    textColor: '{colors.on-secondary-container}'
    rounded: '{rounded.full}'
    height: 40px
  text-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-large}'
    rounded: '{rounded.xs}'
    height: 56px
    padding: 16px
  text-field-label:
    textColor: '{colors.on-surface-variant}'
    typography: '{typography.label-large}'
  text-field-error:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.error}'
    typography: '{typography.body-small}'
  progress-track:
    backgroundColor: '{colors.surface-container-highest}'
    rounded: '{rounded.full}'
    height: 4px
  progress-indicator:
    backgroundColor: '{colors.relief}'
    rounded: '{rounded.full}'
    height: 12px
  data-figure:
    textColor: '{colors.on-surface}'
    typography: '{typography.data-large}'
---

# KapitWatt design system

The values above mirror the light theme in `@kapitwatt/tokens`, which is the source of truth for code (both
themes, every role). A test in `packages/tokens` fails if this file and the tokens drift apart. Build UI with
`@kapitwatt/ui`, `@kapitwatt/icons` and `@kapitwatt/hooks`; this file tells you why the values are what they
are and how to apply them.

## Overview

KapitWatt is residential demand response for Meralco: when NGCP raises a yellow or red alert, households
commit to cutting kW during the peak window and are paid for the cut Meralco can verify. Two products share
one system:

- **Household app** (Android): used outdoors, one-handed, often in the evening peak. Large type, large
  targets, one clear action per screen.
- **Operator dashboard** (web): the Meralco operator sends alerts and watches committed and delivered load.
  Dense, scannable, data first.

**Personality:** warm community voice on a calm, precise base. _Sama-sama_ (together), _malinaw_ (clear),
_kalmado_ (calm), _tapat_ (honest). Alerts are urgent but steady; rewards may celebrate a little.

**Style:** Material 3 structure, flat. No shadows, no gradients; surfaces step by tone. The logo is a
one-colour firefly (alitaptap) symbol with a custom KAPITWATT wordmark, both in Grid Indigo.

**Voice:**

- Households: Taglish, the way Laguna households text. Operator: plain English.
- Numbers in figures with units, always: `1 kW`, `1.6 kWh`, `₱8.06`, `6:00–8:00 PM`. Never mix up kW and kWh.
- Say plainly what is simulated. The pilot's households, alerts and reward rates are simulated or placeholders.
- Examples: "**Red alert sa Luzon grid.** Kaya mo bang magbawas ng 1 kW, 6–8 PM?" · "Na-verify: 1.6 kWh.
  ₱8.06 credit + ₱1.61 barangay bonus." · "Send red alert to 7 towns, about 1,200 households?"

## Colors

Material 3 colour roles from tonal palettes (HCT), seeded from Grid Indigo `#171C8F`. Use roles, never raw
palette tones. Every `on-*` colour is the text and icon colour for its fill and is tested at 4.5:1 or more in
both themes; borders, focus rings and chart marks are tested at 3:1.

- **Brand (`brand` #171C8F):** the logo and brand moments only. Primary actions use `primary` (#3238A5), one
  tone lighter than the logo so buttons read as interactive.
- **Kuryente Orange (`brand-accent` #F95D28, `tertiary`):** warmth. Points, rewards, highlights. Never a
  warning, never an error.
- **Reserved signal roles.** These hues mean one thing each:
  - `alert-red`, `alert-yellow`: NGCP red and yellow alerts. Always shown with the level in words and the
    alert icon, never colour alone. Not for form errors (use `error`).
  - `relief` (teal): verified cuts, delivered kW, positive results.
  - `simulated` (neutral variant): anything the simulator produced. Pair with a dashed edge and the word
    "Simulated".
- **Surfaces:** `surface` is the page; `surface-container-lowest` to `-highest` step up for grouped content.
  The dashboard frame (navigation and top app bar) is `surface-container`; pages sit on `surface`.
- **Charts:** committed = `primary`, delivered = `relief`, target = `tertiary`, baseline = `outline`, relief
  area = `relief-container`, simulated series = `simulated`.
- **Dark theme:** defined in `@kapitwatt/tokens` (`color.dark`) with the same roles. The household app ships
  light for the demo; the dashboard can follow the system.

## Typography

**Albert Sans** for everything, using the Material 3 type scale. Display, headline and title styles are
SemiBold (stock M3 uses Regular) for a firmer voice; body is Regular; labels are Medium.

- `data-large`, `data-medium`, `data-small`: KapitWatt additions for the numbers that matter (committed kW,
  verified kWh, credit, countdowns). Always tabular (`tnum`) so digits line up and timers do not jitter.
- Household app: body text never below `body-large` (16px); primary actions use `title-medium` on 56px buttons.
- Dashboard: `body-medium` (14px) is the working size; `body-small` for metadata.
- React Native: each weight is its own family (`AlbertSans-Regular`, `-Medium`, `-SemiBold`, `-Bold`, loaded
  by `useBrandFonts`). Never set `fontWeight` on Albert Sans in React Native; pick the family.
- Sentence case for headings, labels and buttons. Uppercase only for small overlines (alert level, drawer
  section titles) with letter spacing.

## Layout

- **4-unit grid.** Spacing keys are multiples of 4 (`"4"` = 16px); use a token `gap` between siblings
  instead of per-element margins.
- **Window size classes (M3):** compact under 600, medium 600–839, expanded 840–1199, large 1200–1599,
  extra large 1600 and up (`useWindowClass`).
- **Dashboard shell:** navigation drawer (280px) at expanded and wider, navigation rail (80px) at medium,
  top app bar plus bottom navigation bar at compact. The drawer and a 64px top app bar share the frame tone
  and form one L; pages sit in a `content-pane` with a 28px top-left corner. Page content and the top app bar
  share a 1240px max width and the same gutter (32 / 24 / 16) so their edges line up at any width.
- **The simulation assumptions stay on screen on every dashboard page** (participation, follow-through,
  smart-meter share, photo completion, noise, kW per household) with a link to change them.
- **Touch targets:** 48px minimum. Household primary actions are 56px tall and full width.

## Elevation & Depth

Flat. Depth comes from tone, never from shadows: a grouped area moves one step up the
`surface-container-*` scale, and the content pane is lighter than the frame around it. Interactive states
are M3 state layers over the content colour: hover 8%, focus 10%, pressed 10%, disabled content 38%,
disabled container 12%.

Focus rings are 2px `focus-ring`, 2px clear of the control, and show for **keyboard focus only**
(`useFocusVisible`), never after a click or tap.

## Shapes

Material 3 shape scale: `xs` 4 (text fields), `sm` 8 (chips, tags), `md` 12 (cards), `lg` 16 (alert banners,
grouped panels), `xl` 28 (content pane, sheets, dialogs), `full` (buttons, navigation highlights, segmented
buttons, progress bars). Do not invent in-between radii.

## Components

All in `@kapitwatt/ui` unless noted; they read the theme from `ThemeProvider`.

- **Logo** (`Logo`): `lockup` by default, `mark` where it must be small (rail, app icon, favicon),
  `wordmark` only where the symbol is already nearby. `brand` on light grounds, `on-brand` on Grid Indigo.
  Clear space at least the lantern's diameter. Never recolour, outline, slant or add effects.
- **Buttons** (`Button`): `filled` for the one main action per screen, `tonal` for secondary, `outlined` and
  `text` for low emphasis. `size="lg"` (56px) for household primary actions.
- **Cards** (`Card`): `filled` for grouped content, `outlined` where content needs a clear edge.
- **Chips** (`Chip`): status only, not interactive. The label states the status in words: Verified,
  Flagged, Pending, Simulated, +160 points.
- **Alert banner** (`AlertBanner`): NGCP red or yellow alert with the level as a word and the filled alert
  icon. Only for NGCP alerts.
- **Segmented buttons** (`SegmentedButtons`): one of 2 to 5 options (commit presets 0.5, 1, 1.5, 2 kW; alert
  level; window presets). The selected segment shows a check icon so the choice is not colour-only.
- **Text field** (`TextField`): outlined, label above the field, unit suffix ("kW", "kWh"), supporting text
  or an error message below.
- **Progress bar** (`ProgressBar`): barangay progress against its target, with a target marker; `thick` on
  the event screen.
- **Icons** (`@kapitwatt/icons`): Phosphor, regular weight by default, fill for a selected destination,
  named by meaning (`alert`, `energy`, `commit`, `countdown`, `meterPhoto`, `smartMeter`, `verified`,
  `flagged`, `simulated`, `points`, `barangay`). 18 / 24 / 32px. Hidden from screen readers unless the icon
  alone labels a control.
- **Navigation** (dashboard shell): `nav-item-active` is a full pill in `secondary-container` with the icon in
  its fill weight; later-priority screens carry a small "P1" tag.

## Do's and Don'ts

- **Do** use roles (`primary`, `relief`, `surface-container`) rather than hex values or palette tones.
- **Do** show the alert level in words with an icon; **don't** let red or yellow mean anything but an NGCP
  alert.
- **Do** label simulated data as "Simulated" with a dashed edge; **don't** present simulated numbers as real.
- **Do** keep one filled button per screen; **don't** stack several primary actions.
- **Do** use `data-*` styles for kW, kWh, PHP and timers; **don't** mix kW and kWh or drop units.
- **Do** keep surfaces flat and step tone for depth; **don't** add shadows, gradients or glows.
- **Do** keep orange for rewards and warmth; **don't** use orange for warnings or errors.
- **Don't** use emoji in the UI. Use `@kapitwatt/icons`.
- **Don't** recolour or redraw the logo; use `Logo` or the files in `packages/assets/logo`.
- **Don't** imitate Meralco's logo or brand; KapitWatt is its own identity that works alongside Meralco.
