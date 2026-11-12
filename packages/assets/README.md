# @kapitwatt/assets

Brand files shared by `apps/mobile` and `apps/dashboard`. Static files only, no code to import.

| Path                | What                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `logo/`             | Final logo SVGs: symbol, wordmark, horizontal and stacked lockups, icon                   |
| `logo/png/`         | Expo app icon, Android adaptive icon layers, favicon, splash image                        |
| `logo/web/`         | Web favicons: SVG, ICO (16/32/48), Apple touch icon, 192/512 manifest icons               |
| `mascot/`           | Alitaptap poses for empty states and the result card (not the logo)                       |
| `mascot/reference/` | The approved mascot artwork, all five poses on one sheet; the poses are cut from it       |
| `fonts/`            | Albert Sans variable font and its licence (SIL OFL 1.1)                                   |
| `source/`           | Python that regenerates `logo/` (`build.py`), `mascot/` (`mascot.py`) and `fonts/static/` |

## The logo

A firefly (alitaptap) drawn on a 100-unit grid, with the custom **KAPITWATT** wordmark. One colour only:
Grid Indigo `#171C8F` on light grounds, white on indigo. Never recolour, outline, slant or add effects.

- **Symbol** (`kapitwatt-mark.svg`): app icon, favicon, avatars, anywhere under about 200 px wide.
- **Horizontal lockup** (`kapitwatt-lockup.svg`): the default. Headers, slides, documents.
- **Stacked lockup** (`kapitwatt-lockup-stacked.svg`): square spaces and the splash screen.
- **Wordmark** (`kapitwatt-wordmark.svg`): only where the symbol already appears nearby.
- `-reverse` versions are white, for Grid Indigo backgrounds.
- Clear space around any version: at least the lantern's diameter (28% of the symbol's height).

Wordmark details: Albert Sans Bold in capitals, each A's crossbar replaced by a lantern dot the size of the
symbol's head, the two T's sharing one top bar, letters spaced by a fixed clearance. In the lockup the
cap line sits on the top of the head and the baseline on the bottom of the lantern.

## The mascot

Alitaptap, the firefly, is a separate character from the logo. The approved artwork is
`mascot/reference/alitaptap-reference.png` (chosen November 12, 2026): round chibi proportions, a large
indigo head with big eyes and orange cheeks, stubby arms, lavender wings, and a plump striped orange
lantern tail in a peach halo.

The apps show that artwork itself, traced to SVG 1:1, not a redraw. `source/mascot.py` cuts the five
poses out of the reference (every pose in the same box, so the character keeps its size and place),
snaps each colour to its exact brand hex, and traces them with vtracer into
`mascot/alitaptap-<pose>.svg`: `neutral`, `alert`, `reward`, `missed` and `dimmed` (the reference's
resting pose). The file names are the `<Mascot pose>` values. After changing the reference, run
`source/mascot.py` (it needs the venv below), then `pnpm --filter @kapitwatt/ui generate:brand` to copy
the poses into the UI kit.

## Using the files in the apps

PNG paths for `app.json` (relative to `apps/<app>/`):

```json
"icon": "../../packages/assets/logo/png/icon.png",
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#171C8F",
    "foregroundImage": "../../packages/assets/logo/png/android-icon-foreground.png",
    "monochromeImage": "../../packages/assets/logo/png/android-icon-monochrome.png"
  }
}
```

The SVGs need `react-native-svg` to render inside the apps; on the dashboard (web) an `<img>` works.

**Web favicons.** Expo serves `apps/<app>/public/` at the site root, so the dashboard keeps copies
of `logo/web/*` in `apps/dashboard/public/`, linked from `public/index.html` (with
`manifest.webmanifest`). Copy them again after regenerating. The favicon tile fits the symbol to
76% of the square, not the app icon's 62%, so it stays readable at 16 px.

## Regenerating

Edit the numbers in `source/symbol.py` or `source/wordmark.py`, then:

```bash
cd packages/assets/source
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python build.py
```
