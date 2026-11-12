"""Static Albert Sans instances for React Native, which cannot select weights from a variable font.

    .venv/bin/python fonts.py      (same venv as build.py)

Writes ../fonts/static/AlbertSans-{Regular,Medium,SemiBold,Bold}.ttf. The family names match
`fontFamily` in @kapitwatt/tokens.
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = Path(__file__).resolve().parent.parent / "fonts"
WEIGHTS = {"Regular": 400, "Medium": 500, "SemiBold": 600, "Bold": 700}


def main():
    out = FONTS / "static"
    out.mkdir(exist_ok=True)
    for name, wght in WEIGHTS.items():
        font = instancer.instantiateVariableFont(TTFont(FONTS / "AlbertSans[wght].ttf"), {"wght": wght}, updateFontNames=True)
        font.save(out / f"AlbertSans-{name}.ttf")
    print(f"wrote {len(WEIGHTS)} static fonts to {out}")


if __name__ == "__main__":
    main()
