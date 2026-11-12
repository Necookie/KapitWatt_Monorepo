# @kapitwatt/assets

Brand files shared by `apps/mobile` and `apps/dashboard`. Static files only, no code to import.

| Path        | What                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| `logo/`     | Final logo SVGs: symbol, wordmark, horizontal and stacked lockups, icon |
| `logo/png/` | Expo app icon, Android adaptive icon layers, favicon, splash image      |
| `mascot/`   | Alitaptap poses for empty states and the result card (not the logo)     |
| `fonts/`    | Albert Sans variable font and its licence (SIL OFL 1.1)                 |
| `source/`   | Python that regenerates everything in `logo/`                           |

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

## Regenerating

Edit the numbers in `source/symbol.py` or `source/wordmark.py`, then:

```bash
cd packages/assets/source
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python build.py
```
