"""KAPITWATT wordmark: Albert Sans Bold outlines, edited by hand.

  A   the crossbar is removed and a lantern dot sits where it was (the firefly's light)
  TT  the two T's share one continuous top bar (kapit: holding on)
  spacing: each letter sits a fixed clearance (a fraction of the stem) from the letters before it,
           measured at the closest point, so tight diagonal pairs (K-A, W-A, A-T) never collide
"""
import io

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from shapely.affinity import translate
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union


class _Flatten(BasePen):
    """Glyph outline -> polygons (curves sampled)."""

    def __init__(self, glyphset):
        super().__init__(glyphset)
        self.contours, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, 17):
            t = i / 16
            u = 1 - t
            self.cur.append(
                (
                    u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
                )
            )

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, 13):
            t = i / 12
            u = 1 - t
            self.cur.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))

    def _closePath(self):
        self.contours.append(self.cur)
        self.cur = []

    _endPath = _closePath


def build(font_path, weight=700, clearance=0.34, text="KAPITWATT", lantern_r=0.66, lantern_y=0.33):
    """Return (shape in font units with y up, cap height, stem width).
    clearance and lantern_r are in stem widths; lantern_y is a fraction of the cap height."""
    inst = instancer.instantiateVariableFont(TTFont(font_path), {"wght": weight}, overlap=instancer.OverlapMode.REMOVE)
    buf = io.BytesIO()
    inst.save(buf)
    font = TTFont(io.BytesIO(buf.getvalue()))
    glyphs, cmap, cap = font.getGlyphSet(), font.getBestCmap(), font["OS/2"].sCapHeight

    def outline(ch):
        pen = _Flatten(glyphs)
        glyphs[cmap[ord(ch)]].draw(pen)
        shape = Polygon()
        for c in pen.contours:
            if len(c) > 2:
                shape = shape.symmetric_difference(Polygon(c).buffer(0))
        return translate(shape, -shape.bounds[0], 0)

    letter_i = outline("I")
    stem = letter_i.bounds[2] - letter_i.bounds[0]

    def lantern_a(a):
        hole = list(a.interiors[0].coords)
        apex = max(hole, key=lambda p: p[1])
        floor = min(p[1] for p in hole)
        low = [p for p in hole if p[1] < floor + 1]
        left, right = min(low, key=lambda p: p[0]), max(low, key=lambda p: p[0])

        def x_at(p, q, y):
            return p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1])

        legs = a.difference(Polygon([apex, (x_at(apex, left, -50), -50), (x_at(apex, right, -50), -50)]))
        cy = cap * lantern_y
        cx = (x_at(apex, left, cy) + x_at(apex, right, cy)) / 2
        return unary_union([legs, Point(cx, cy).buffer(stem * lantern_r, resolution=64)])

    # place each letter `clearance` stems from everything already set
    gap, placed, acc = stem * clearance, [], Polygon()
    for ch in text:
        g = outline(ch)
        if ch == "A":
            g = lantern_a(g)
        if placed:
            lo, hi = acc.bounds[2] - g.bounds[2], acc.bounds[2] + gap + 5
            for _ in range(40):
                mid = (lo + hi) / 2
                moved = translate(g, mid, 0)
                if moved.intersects(acc) or acc.distance(moved) < gap:
                    lo = mid
                else:
                    hi = mid
            g = translate(g, hi, 0)
        placed.append([ch, g])
        acc = unary_union([acc, g])

    # joined TT: bridge the last two T's across the full depth of the top bar
    ts = [p for p in placed if p[0] == "T"][-2:]
    if len(ts) == 2:
        t = ts[0][1]
        x0, y0, x1, y1 = t.bounds
        bar_bottom = y1
        for k in range(400):
            y = y1 - k * (y1 - y0) / 400
            row = t.intersection(box(x0 - 1, y - 0.2, x1 + 1, y + 0.2)).bounds
            if row and (row[2] - row[0]) < stem * 1.5:
                bar_bottom = y
                break
        ts[1][1] = unary_union([ts[1][1], box(t.bounds[2] - 1, bar_bottom + 0.5, ts[1][1].bounds[0] + 1, y1)])

    return unary_union([g for _, g in placed]), cap, stem
