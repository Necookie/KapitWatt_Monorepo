"""Trace the Alitaptap poses in ../mascot from the approved reference image, 1:1.

    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/python mascot.py

The mascot is the artwork in mascot/reference/alitaptap-reference.png itself, traced to SVG, not a
redraw, so every screen shows exactly the approved character at any size.

1. Cut: each pose is cropped to the same box, centred on its lantern glow, so the character keeps one
   size and position whichever pose a screen shows. The white page around it becomes transparent: only
   white connected to the edge of the box is removed, so the eyes, highlights and lantern ribs
   (enclosed by the character) stay white, and so do thin white outlines that touch its edge.
2. Snap: the cut is upscaled 4x for smooth curves and every pixel takes the nearest brand colour, so
   the SVG uses exact brand hexes (the generated image is a few shades off) with no blended edge colours.
3. Trace: vtracer turns each colour into smooth filled paths that do not overlap (cut out, not
   stacked: a stacked shape underneath leaks a hairline of its colour along shared edges).

Poses, left to right in the reference (file names are the <Mascot pose> values):
  neutral, alert, reward, missed, dimmed (the reference's resting pose)
"""
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
import vtracer

HERE = Path(__file__).resolve().parent
MASCOT = HERE.parent / "mascot"
REFERENCE = MASCOT / "reference" / "alitaptap-reference.png"

POSES = ("neutral", "alert", "reward", "missed", "dimmed")
# Centre of each pose's lantern glow in the reference, and the box every pose is cut to (px).
CENTRES = (184, 508, 827, 1151, 1472)
WIDTH, TOP, BOTTOM = 304, 226, 724
# Traced at this multiple of the cut size (the SVG's viewBox is the cut size times this).
SCALE = 3
# Brand colours (packages/tokens): indigo, orange (lantern, cheeks, sparks), halo peach, wing lavender,
# white. The reference's cheeks are the lantern's orange, so there is no separate cheek colour.
PALETTE = ("#171C8F", "#F95D28", "#FFEDE8", "#E0E0FF", "#FFFFFF")
# The cut-out edge is softened by this radius (cut px) before tracing, so the soft halo, which fades
# into the page in the reference, gets a clean round outline instead of a noisy one.
EDGE_SOFTEN = 1.5
# A pixel this close to the page colour (every channel) counts as page.
PAGE_TOLERANCE = 14
EDGE_PX = 2
# Page-coloured channels narrower than about twice this (px) are white lines in the drawing, not page:
# the page is not flooded through them (a white outline that touches the figure's edge stays white).
CHANNEL_PX = 3


def flood_from_border(candidates):
    """The candidate pixels connected to the box's border (4-connected), by repeated dilation."""
    region = np.zeros_like(candidates)
    region[0, :], region[-1, :] = candidates[0, :], candidates[-1, :]
    region[:, 0], region[:, -1] = candidates[:, 0], candidates[:, -1]
    while True:
        grown = region.copy()
        grown[1:, :] |= region[:-1, :]
        grown[:-1, :] |= region[1:, :]
        grown[:, 1:] |= region[:, :-1]
        grown[:, :-1] |= region[:, 1:]
        grown &= candidates
        if (grown == region).all():
            return region
        region = grown


def dilate(mask, steps):
    for _ in range(steps):
        grown = mask.copy()
        grown[1:, :] |= mask[:-1, :]
        grown[:-1, :] |= mask[1:, :]
        grown[:, 1:] |= mask[:, :-1]
        grown[:, :-1] |= mask[:, 1:]
        mask = grown
    return mask


def cut(sheet, centre, page):
    left = centre - WIDTH // 2
    rgb = np.asarray(sheet.crop((left, TOP, left + WIDTH, BOTTOM)), dtype=np.float64)
    near_page = (np.abs(rgb - page) <= PAGE_TOLERANCE).all(axis=2)
    # Flood the page with its narrow channels closed, then grow it back to the figure's edge by the
    # same few pixels, so it reaches the true outline but not along a thin white line.
    core = flood_from_border(~dilate(~near_page, CHANNEL_PX))
    outside = core
    for _ in range(CHANNEL_PX + 1):
        outside = dilate(outside, 1) & near_page
    edge = dilate(outside, EDGE_PX) & ~outside

    alpha = np.ones(rgb.shape[:2])
    alpha[outside] = 0.0
    # Colour to alpha against the page colour: the least opacity that explains the pixel.
    room = np.where(rgb < page, page, 255.0 - page)
    need = (np.abs(rgb - page) / np.maximum(room, 1.0)).max(axis=2)
    alpha[edge] = np.clip(need[edge], 0.0, 1.0)

    out = rgb.copy()
    a = np.maximum(alpha, 1e-6)[..., None]
    unblended = page + (rgb - page) / a
    out[edge] = np.clip(unblended[edge], 0, 255)
    rgba = np.dstack([out, alpha * 255.0]).round().astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def rgb(hex_colour):
    return [int(hex_colour[i : i + 2], 16) for i in (1, 3, 5)]


def fit_palette(cuts):
    """Where each brand colour actually sits in the generated image: k-means seeded with the palette."""
    pixels = np.concatenate([np.asarray(c)[..., :3][np.asarray(c)[..., 3] == 255] for c in cuts])
    centres = np.array([rgb(h) for h in PALETTE], dtype=np.float64)
    pixels = pixels.astype(np.float64)
    for _ in range(12):
        nearest = ((pixels[:, None, :] - centres[None]) ** 2).sum(axis=2).argmin(axis=1)
        for i in range(len(centres)):
            members = pixels[nearest == i]
            if len(members):
                centres[i] = members.mean(axis=0)
    return centres


def trace(cut_image, centres):
    """Upscale, snap every opaque pixel to the nearest fitted colour (written as its brand hex), trace."""
    w, h = cut_image.size
    big = cut_image.resize((w * SCALE, h * SCALE), Image.LANCZOS)
    px = np.asarray(big).astype(np.float64)
    soft = big.getchannel("A").filter(ImageFilter.GaussianBlur(EDGE_SOFTEN * SCALE))
    opaque = np.asarray(soft) >= 128
    nearest = ((px[..., None, :3] - centres[None, None]) ** 2).sum(axis=3).argmin(axis=2)
    # Edge pixels are a blend of the shape and the page, and would snap to the wrong colour (a halo's
    # edge reads as lavender): they take the colour of the solid shape they border instead.
    labels = np.where(px[..., 3] >= 250, nearest, -1)
    while True:
        unsure = (labels < 0) & opaque
        if not unsure.any():
            break
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            neighbour = np.roll(labels, (dy, dx), axis=(0, 1))
            take = unsure & (neighbour >= 0)
            labels[take] = neighbour[take]
            unsure &= ~take
    nearest = np.where(labels >= 0, labels, 0)
    brand = np.array([rgb(h) for h in PALETTE], dtype=np.uint8)
    snapped = np.zeros((*opaque.shape, 4), dtype=np.uint8)
    snapped[..., :3] = brand[nearest]
    snapped[..., 3] = np.where(opaque, 255, 0)
    flat = [tuple(int(v) for v in p) for p in snapped.reshape(-1, 4)]
    svg = vtracer.convert_pixels_to_svg(
        flat,
        size=(w * SCALE, h * SCALE),
        colormode="color",
        hierarchical="cutout",
        mode="spline",
        filter_speckle=4 * SCALE,
        color_precision=8,
        layer_difference=1,
        corner_threshold=60,
        length_threshold=4.0,
        max_iterations=10,
        splice_threshold=45,
        path_precision=0,
    )
    paths = "".join(line.strip() for line in svg.splitlines() if line.strip().startswith("<path"))
    # The tracer averages some fills when it merges shapes; put every fill back on its brand colour.
    palette = np.array([rgb(h) for h in PALETTE], dtype=np.float64)

    def on_brand(match):
        colour = np.array(rgb(match.group(1)), dtype=np.float64)
        return f'fill="{PALETTE[int(((palette - colour) ** 2).sum(axis=1).argmin())]}"'

    return re.sub(r'fill="(#[0-9A-Fa-f]{6})"', on_brand, paths), w, h


def main():
    sheet = Image.open(REFERENCE).convert("RGB")
    # The page colour: the median of the sheet's corners.
    px = np.asarray(sheet, dtype=np.float64)
    corners = np.concatenate([px[:20, :20], px[:20, -20:], px[-20:, :20], px[-20:, -20:]])
    page = np.median(corners.reshape(-1, 3), axis=0)
    cuts = [cut(sheet, centre, page) for centre in CENTRES]
    centres = fit_palette(cuts)
    for name, image in zip(POSES, cuts):
        paths, w, h = trace(image, centres)
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w * SCALE} {h * SCALE}" '
            f'role="img" aria-label="Alitaptap, {name}">{paths}</svg>\n'
        )
        (MASCOT / f"alitaptap-{name}.svg").write_text(svg)
        (MASCOT / f"alitaptap-{name}.png").unlink(missing_ok=True)
    print(f"traced {len(POSES)} poses to {MASCOT}")


if __name__ == "__main__":
    main()
