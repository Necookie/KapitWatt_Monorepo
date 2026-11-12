"""KapitWatt symbol: a firefly drawn on a 100-unit grid, one colour.

Construction (all units on the 100 grid):
  stroke 4, gap 3 (every separation between parts)
  lantern r14 at (50, 62): the largest shape
  head r8 at (50, 30); antennae 4 wide at 25 deg with r3.5 tips
  wings: ellipses 17 x 38 at +/-55 deg, centred (30, 45) and (70, 45)
  glow: two arcs centred on the lantern, centrelines r20 and r28, both cut at the 40 and 140 deg rays,
        so lantern, gap, arc, gap, arc all step by 4
"""
import math

from shapely.affinity import rotate, scale
from shapely.geometry import LineString, Point
from shapely.ops import unary_union

GAP = 3
STROKE = 4
LANTERN = (50, 62, 14)  # x, y, r
HEAD = (50, 30, 8)


def _circle(cx, cy, r):
    return Point(cx, cy).buffer(r, resolution=64)


def _ellipse(cx, cy, rx, ry, angle):
    return rotate(scale(Point(cx, cy).buffer(1, resolution=64), rx, ry), angle, origin=(cx, cy))


def _stroke(points, width):
    return LineString(points).buffer(width / 2, cap_style=1, join_style=1, resolution=32)


def _cut(shape, *others):
    """Remove `others` from `shape`, keeping a GAP-wide clearance."""
    return shape.difference(unary_union(others).buffer(GAP, resolution=32))


def firefly():
    lx, ly, lr = LANTERN
    head = _circle(*HEAD)
    lantern = _circle(lx, ly, lr)

    def antenna(sign):
        a = math.radians(25)
        x0, y0, length = 50 + sign * 3.5, 24, 13
        x1, y1 = x0 + sign * length * math.sin(a), y0 - length * math.cos(a)
        return unary_union([_stroke([(x0, y0), (x1, y1)], STROKE), _circle(x1, y1, 3.5)])

    def arc(r, a0=40, a1=140):
        pts = [(lx + r * math.cos(math.radians(a)), ly + r * math.sin(math.radians(a))) for a in range(a0, a1 + 1)]
        return _stroke(pts, STROKE)

    antennae = unary_union([antenna(-1), antenna(1)])
    wings = unary_union([_ellipse(30, 45, 8.5, 19, 55), _ellipse(70, 45, 8.5, 19, -55)])
    glow = unary_union([arc(lr + 6), arc(lr + 14)])
    body = unary_union([head, lantern])
    return unary_union([body, _cut(wings, body), antennae, _cut(glow, wings)])


def to_path(shape, sx=1.0, ox=0.0, oy=0.0, flip_y=False):
    """Shapely geometry -> SVG path data. flip_y converts font units (y up) to page units (y down)."""
    parts = []
    for poly in getattr(shape, "geoms", [shape]):
        for ring in [poly.exterior, *poly.interiors]:
            pts = [(ox + x * sx, oy - y * sx if flip_y else oy + y * sx) for x, y in ring.coords]
            parts.append("M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts) + "Z")
    return " ".join(parts)
