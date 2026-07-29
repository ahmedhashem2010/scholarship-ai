"""
SmartScholar logo — rasterising and the roadmap trace animation.

THE IDEA

The mark is an S drawn as a winding road: lane dashes down the middle, a start
node bottom-left, a waypoint in the belly, a gold destination top-right. So the
reveal shouldn't be a fade or a scale — it should be the road *being built*,
bottom-left to top-right, exactly the way the product turns a deadline into a
sequence of steps.

HOW THE REVEAL WORKS

The SVG is a filled outline, not a stroke, so there is no path to "draw along"
with a dash offset the way you would in SVG. Instead:

  1. `CENTER` is a hand-calibrated polyline running down the middle of the road,
     verified against the artwork (see brand/_calib.png).
  2. That polyline is arc-length parameterised, so the trace advances at a
     constant speed instead of racing through the long straights and crawling
     round the curves.
  3. Progress `p` draws the polyline into an L-mode mask with a fat round-capped
     stroke, and the mask is multiplied into the mark's own alpha.

The stroke only has to be wide enough to cover the road's thickness. Wider than
that and tight turns start revealing sections the trace hasn't reached yet.

WHY THE BACKGROUND TILE

The mark is navy on white with white lane dashes. Dropped straight onto the
film's #0B1020 it would vanish. Rather than recolour it — which would mean
inventing a second colourway for the dashes and the gold node — it sits on a
white rounded tile, which is how the app icon works anyway. The brand stays
exactly as designed.
"""

import io
import math
import os
from functools import lru_cache

import cairosvg
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
MARK_SVG = os.path.join(HERE, "brand", "logo-mark.svg")

# Native artwork coordinate space.
SRC = 1024.0

# Centre of the road, start (bottom-left node) to finish (gold node).
# Calibrated against the artwork — do not "tidy" these numbers.
CENTER = [
    (334, 751), (400, 751), (470, 750), (528, 745), (578, 733), (618, 712),
    (648, 684), (664, 650), (664, 614), (648, 585), (620, 563), (585, 546),
    (548, 530), (512, 512), (472, 496), (432, 479), (398, 458), (374, 430),
    (360, 396), (360, 360), (374, 328), (400, 304), (434, 288), (474, 278),
    (520, 272), (580, 269), (640, 265), (682, 262),
]

# Road thickness in source units, plus margin for the nodes sitting on it.
MASK_W = 186.0

# Node positions in source units, as (x, y, radius). Used for the pulse that
# fires as the trace passes each one.
NODES = [(334, 751, 33), (512, 512, 33)]
DEST = (682, 262, 40)

GOLD = (198, 161, 75)


# --------------------------------------------------------------------------
# Geometry
# --------------------------------------------------------------------------

def _cumulative():
    """Arc lengths along CENTER, so progress maps to distance not vertex index."""
    lengths = [0.0]
    for i in range(1, len(CENTER)):
        x0, y0 = CENTER[i - 1]
        x1, y1 = CENTER[i]
        lengths.append(lengths[-1] + math.hypot(x1 - x0, y1 - y0))
    return lengths


_CUM = _cumulative()
_TOTAL = _CUM[-1]


def point_at(p):
    """Point on the road at fraction `p` of its total length."""
    p = max(0.0, min(1.0, p))
    target = p * _TOTAL
    for i in range(1, len(_CUM)):
        if _CUM[i] >= target:
            span = _CUM[i] - _CUM[i - 1]
            f = 0.0 if span <= 0 else (target - _CUM[i - 1]) / span
            x0, y0 = CENTER[i - 1]
            x1, y1 = CENTER[i]
            return x0 + (x1 - x0) * f, y0 + (y1 - y0) * f
    return CENTER[-1]


def polyline_to(p):
    """CENTER truncated at fraction `p`, ending exactly on the road."""
    if p <= 0:
        return [CENTER[0]]
    target = max(0.0, min(1.0, p)) * _TOTAL
    pts = [CENTER[0]]
    for i in range(1, len(_CUM)):
        if _CUM[i] < target:
            pts.append(CENTER[i])
        else:
            pts.append(point_at(p))
            break
    return pts


def node_progress(x, y):
    """Fraction of the road at which a node sits — when its pulse should fire."""
    best, best_d = 0.0, float("inf")
    for i in range(1, len(CENTER)):
        for f in (j / 8 for j in range(9)):
            px = CENTER[i - 1][0] + (CENTER[i][0] - CENTER[i - 1][0]) * f
            py = CENTER[i - 1][1] + (CENTER[i][1] - CENTER[i - 1][1]) * f
            dist = math.hypot(px - x, py - y)
            if dist < best_d:
                best_d = dist
                best = (_CUM[i - 1] + (_CUM[i] - _CUM[i - 1]) * f) / _TOTAL
    return best


NODE_AT = [node_progress(x, y) for x, y, _ in NODES]
DEST_AT = node_progress(DEST[0], DEST[1])


# --------------------------------------------------------------------------
# Rasterising
# --------------------------------------------------------------------------

@lru_cache(maxsize=16)
def mark(size):
    """The mark at `size` px square, transparent background. Cached."""
    size = int(size)
    png = cairosvg.svg2png(url=MARK_SVG, output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")


@lru_cache(maxsize=16)
def _tile(size, radius_frac=0.225):
    """White rounded square the mark sits on."""
    size = int(size)
    t = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(t).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * radius_frac),
        fill=(255, 255, 255, 255))
    return t


def _trace_mask(size, p):
    """L-mode mask revealing the road up to fraction `p`."""
    s = size / SRC
    m = Image.new("L", (int(size), int(size)), 0)
    if p <= 0:
        return m
    pts = [(x * s, y * s) for x, y in polyline_to(p)]
    d = ImageDraw.Draw(m)
    w = max(2, int(MASK_W * s))
    if len(pts) > 1:
        d.line(pts, fill=255, width=w, joint="curve")
    # Round the ends: PIL's line joints are mitred and leave notches.
    for x, y in pts:
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)
    return m


# --------------------------------------------------------------------------
# Drawing
# --------------------------------------------------------------------------

def draw(img, cx, cy, size, p=1.0, alpha=255, ghost=0.10, head=True,
         tile=True, shadow=True):
    """
    Composite the logo centred on (cx, cy) at `size` px.

    p      0 → 1, how much of the road has been built
    ghost  opacity of the not-yet-built road, so the S silhouette is present
           from the first frame. A snake growing out of nothing reads as a
           loading spinner; a road filling in reads as progress.
    head   bright travelling dot at the build point
    """
    size = int(size)
    if size < 8 or alpha <= 0:
        return

    x0, y0 = int(cx - size / 2), int(cy - size / 2)

    if shadow and tile:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle(
            [x0, y0 + int(size * 0.045), x0 + size, y0 + size + int(size * 0.045)],
            radius=int(size * 0.225), fill=(0, 0, 0, int(110 * alpha / 255)))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * 0.05)))

    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))

    if tile:
        t = _tile(size).copy()
        if alpha < 255:
            t.putalpha(t.getchannel("A").point(lambda v: v * alpha // 255))
        layer.alpha_composite(t, (x0, y0))

    m = mark(size)
    base_a = m.getchannel("A")

    if ghost > 0 and p < 1.0:
        g = m.copy()
        g.putalpha(base_a.point(lambda v: int(v * ghost * alpha / 255)))
        layer.alpha_composite(g, (x0, y0))

    if p > 0:
        built = m.copy()
        mask = _trace_mask(size, p)
        combined = Image.new("L", (size, size), 0)
        combined.paste(base_a, (0, 0), mask)
        if alpha < 255:
            combined = combined.point(lambda v: v * alpha // 255)
        built.putalpha(combined)
        layer.alpha_composite(built, (x0, y0))

    img.alpha_composite(layer)

    if head and 0.02 < p < 0.995:
        hx, hy = point_at(p)
        px, py = x0 + hx * size / SRC, y0 + hy * size / SRC
        r = size * 0.030
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse(
            [px - r * 3, py - r * 3, px + r * 3, py + r * 3],
            fill=GOLD + (int(150 * alpha / 255),))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(r * 1.6)))
        ImageDraw.Draw(img, "RGBA").ellipse(
            [px - r, py - r, px + r, py + r], fill=(255, 255, 255, alpha))


def dest_burst(img, cx, cy, size, lt, alpha=255):
    """
    Expanding gold ring at the destination node.

    Fires when the road completes. `lt` is seconds since arrival; the ring is
    done by ~0.7s. Arrival needs a punctuation mark or the trace just stops.
    """
    if lt < 0 or lt > 0.75:
        return
    s = size / SRC
    px = cx - size / 2 + DEST[0] * s
    py = cy - size / 2 + DEST[1] * s
    e = 1 - (1 - lt / 0.75) ** 3
    r = size * (0.045 + 0.11 * e)
    a = int(210 * (1 - e) * alpha / 255)
    if a <= 0:
        return
    ring = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([px - r, py - r, px + r, py + r],
                                 outline=GOLD + (a,), width=max(2, int(size * 0.012)))
    img.alpha_composite(ring.filter(ImageFilter.GaussianBlur(size * 0.006)))
