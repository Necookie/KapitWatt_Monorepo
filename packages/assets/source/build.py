"""Regenerate every logo file in ../logo from symbol.py and wordmark.py.

    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/python build.py

Lockup rules (symbol units, 100 grid):
  wordmark cap line = top of the head (y 22), baseline = bottom of the lantern (y 76)
  each A's lantern dot radius = head radius
  gap between symbol and wordmark = two wordmark stems
  stacked: wordmark cap = 40% of symbol height, one lantern radius below the symbol
"""
from pathlib import Path

import resvg_py

from symbol import HEAD, LANTERN, firefly, to_path
from wordmark import build as build_wordmark

HERE = Path(__file__).resolve().parent
LOGO = HERE.parent / "logo"
PNG = LOGO / "png"
FONT = HERE.parent / "fonts" / "AlbertSans[wght].ttf"
INDIGO, WHITE = "#171C8F", "#FFFFFF"

HEAD_TOP = HEAD[1] - HEAD[2]
LANTERN_BOTTOM = LANTERN[1] + LANTERN[2]


def svg(viewbox, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-label="KapitWatt">{body}</svg>\n'


def path(d, fill, transform=""):
    t = f' transform="{transform}"' if transform else ""
    return f'<path fill="{fill}" fill-rule="evenodd"{t} d="{d}"/>'


def main():
    LOGO.mkdir(exist_ok=True)
    PNG.mkdir(exist_ok=True)
    out = {}

    # symbol
    sym = firefly()
    x0, y0, x1, y1 = sym.bounds
    d = to_path(sym)
    for name, fill in (("mark", INDIGO), ("mark-reverse", WHITE)):
        out[name] = svg(f"{x0 - 2:.2f} {y0 - 2:.2f} {x1 - x0 + 4:.2f} {y1 - y0 + 4:.2f}", path(d, fill))

    # app icon: 1024 tile, 22% corners, symbol fitted to 62% and centred
    S = 1024
    k = S * 0.62 / max(x1 - x0, y1 - y0)
    tx, ty = (S - (x1 - x0) * k) / 2 - x0 * k, (S - (y1 - y0) * k) / 2 - y0 * k
    icon_symbol = path(d, WHITE, f"translate({tx:.2f} {ty:.2f}) scale({k:.4f})")
    out["icon"] = svg(f"0 0 {S} {S}", f'<rect width="{S}" height="{S}" rx="{S * 0.22:.0f}" fill="{INDIGO}"/>' + icon_symbol)

    # wordmark, sized so its A dots match the head
    cap_units = LANTERN_BOTTOM - HEAD_TOP
    _, cap, stem = build_wordmark(FONT)
    word, cap, stem = build_wordmark(FONT, lantern_r=(HEAD[2] * cap / cap_units) / stem)
    wx0, wy0, wx1, wy1 = word.bounds

    s = 100 / cap
    for name, fill in (("wordmark", INDIGO), ("wordmark-reverse", WHITE)):
        out[name] = svg(f"{wx0 * s - 2:.2f} -102 {(wx1 - wx0) * s + 4:.2f} 104", path(to_path(word, s, 0, 0, flip_y=True), fill))

    # horizontal lockup
    s = cap_units / cap
    gx = x1 + 2 * stem * s
    width = gx + (wx1 - wx0) * s - x0
    for name, fill in (("lockup", INDIGO), ("lockup-reverse", WHITE)):
        body = path(d, fill) + path(to_path(word, s, gx - wx0 * s, LANTERN_BOTTOM, flip_y=True), fill)
        out[name] = svg(f"{x0 - 2:.2f} {y0 - 2:.2f} {width + 4:.2f} {y1 - y0 + 4:.2f}", body)

    # stacked lockup
    sh = y1 - y0
    s = sh * 0.40 / cap
    ww = (wx1 - wx0) * s
    total_w = max(ww, x1 - x0)
    base = sh + LANTERN[2] + sh * 0.40
    for name, fill in (("lockup-stacked", INDIGO), ("lockup-stacked-reverse", WHITE)):
        body = path(d, fill, f"translate({(total_w - (x1 - x0)) / 2 - x0:.2f} {-y0:.2f})")
        body += path(to_path(word, s, (total_w - ww) / 2 - wx0 * s, base, flip_y=True), fill)
        out[name] = svg(f"-2 -2 {total_w + 4:.2f} {base + 4:.2f}", body)

    for name, text in out.items():
        (LOGO / f"kapitwatt-{name}.svg").write_text(text)

    # PNGs for Expo (app.json): icon, Android adaptive layers, favicon, splash
    def png(name, content, size=1024):
        page = f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 1024 1024">{content}</svg>'
        (PNG / name).write_bytes(bytes(resvg_py.svg_to_bytes(svg_string=page)))

    flat_icon = f'<rect width="1024" height="1024" fill="{INDIGO}"/>' + icon_symbol  # stores round the corners themselves
    png("icon.png", flat_icon)
    png("favicon.png", out["icon"].split(">", 1)[1].rsplit("</svg>", 1)[0], size=48)
    # Android adaptive icon: keep the symbol inside the 66% safe zone
    k2 = 1024 * 0.46 / max(x1 - x0, y1 - y0)
    t2 = f"translate({(1024 - (x1 - x0) * k2) / 2 - x0 * k2:.2f} {(1024 - (y1 - y0) * k2) / 2 - y0 * k2:.2f}) scale({k2:.4f})"
    png("android-icon-foreground.png", path(d, WHITE, t2))
    png("android-icon-monochrome.png", path(d, WHITE, t2))
    png("android-icon-background.png", f'<rect width="1024" height="1024" fill="{INDIGO}"/>')
    # splash: white stacked lockup on transparent (app.json sets the indigo background)
    stacked = out["lockup-stacked-reverse"]
    vb = [float(v) for v in stacked.split('viewBox="')[1].split('"')[0].split()]
    k3 = 1024 * 0.8 / vb[2]
    inner = stacked.split(">", 1)[1].rsplit("</svg>", 1)[0]
    png("splash-icon.png", f'<g transform="translate({(1024 - vb[2] * k3) / 2 - vb[0] * k3:.2f} {(1024 - vb[3] * k3) / 2 - vb[1] * k3:.2f}) scale({k3:.4f})">{inner}</g>')

    print(f"wrote {len(out)} SVGs to {LOGO} and 6 PNGs to {PNG}")


if __name__ == "__main__":
    main()
