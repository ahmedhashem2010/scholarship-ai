"""
Motion-graphics primitives — premium SaaS launch look.

Palette and treatment follow the director brief: deep navy ground, blue →
cyan → violet gradients, glassmorphic cards, soft shadows, generous easing.

Two rules govern everything here:

1. **Nothing appears. Things arrive.** Every element enters with position,
   scale or mask animation and a slight overshoot. A pure opacity fade is the
   single biggest tell of a cheap explainer.
2. **Translucency is composited, never drawn.** PIL's shape fills do not
   alpha-blend reliably — a fill at alpha 38 renders solid. Anything
   see-through goes through a layer and `alpha_composite`.
"""

import math
import random

from PIL import Image, ImageDraw, ImageFilter

# --- Palette ---------------------------------------------------------------
BG = (11, 16, 32)            # #0B1020
BG_DEEP = (6, 9, 20)
PRIMARY = (79, 124, 255)     # #4F7CFF
SECONDARY = (110, 231, 249)  # #6EE7F9
ACCENT = (139, 92, 246)      # #8B5CF6
SUCCESS = (34, 197, 94)      # #22C55E
WARN = (251, 191, 36)
DANGER = (248, 113, 113)
WHITE = (255, 255, 255)
INK = (237, 242, 255)
MUTED = (139, 152, 184)
DIM = (86, 98, 128)

GLASS = (30, 41, 74)
GLASS_EDGE = (86, 108, 168)

# Light-mode greys for the "old way" chaos scene
GREY_BG = (240, 241, 245)
GREY_CARD = (255, 255, 255)
GREY_LINE = (214, 217, 226)
GREY_TEXT = (110, 118, 138)
GREY_INK = (28, 33, 48)


# --- Maths -----------------------------------------------------------------

def clamp(t, lo=0.0, hi=1.0):
    return max(lo, min(hi, t))


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    t = clamp(t)
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))


def ease_out(t):
    return 1 - pow(1 - clamp(t), 3)


def ease_out_quint(t):
    return 1 - pow(1 - clamp(t), 5)


def ease_out_back(t, k=1.9):
    t = clamp(t)
    c3 = k + 1
    return 1 + c3 * pow(t - 1, 3) + k * pow(t - 1, 2)


def ease_in_out(t):
    t = clamp(t)
    return 4 * t * t * t if t < 0.5 else 1 - pow(-2 * t + 2, 3) / 2


def ease_in(t):
    return pow(clamp(t), 3)


def spring(t, freq=3.4, damp=5.0):
    """Damped oscillation for overshoot settles."""
    t = clamp(t)
    if t >= 1:
        return 1.0
    return 1 - math.exp(-damp * t) * math.cos(freq * math.pi * t)


# --- Drawing ---------------------------------------------------------------

def rr(d, box, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def layer_of(img):
    return Image.new("RGBA", img.size, (0, 0, 0, 0))


def panel(img, box, radius, fill=None, outline=None, width=2):
    """Rounded rect with a genuinely translucent fill."""
    lay = layer_of(img)
    ImageDraw.Draw(lay).rounded_rectangle(box, radius=radius, fill=fill,
                                          outline=outline, width=width)
    img.alpha_composite(lay)


def shadow(img, box, radius, blur=30, alpha=140, offset=(0, 18), spread=0):
    """Blurs only the region around the box.

    Gaussian-blurring a full 1920x1080 layer per shadow was the single most
    expensive call in the renderer — several per frame, each ~40ms. Cropping to
    the affected area first is visually identical and roughly 10x faster.
    """
    x0, y0, x1, y1 = [int(v) for v in box]
    m = int(blur * 2.5 + spread + 4)
    rx0, ry0 = max(0, x0 + offset[0] - spread - m), max(0, y0 + offset[1] - spread - m)
    rx1 = min(img.width, x1 + offset[0] + spread + m)
    ry1 = min(img.height, y1 + offset[1] + spread + m)
    if rx1 <= rx0 or ry1 <= ry0:
        return
    lay = Image.new("RGBA", (rx1 - rx0, ry1 - ry0), (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle(
        [x0 + offset[0] - spread - rx0, y0 + offset[1] - spread - ry0,
         x1 + offset[0] + spread - rx0, y1 + offset[1] + spread - ry0],
        radius=radius + spread, fill=(0, 0, 0, alpha))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(blur)), (rx0, ry0))


def glass(img, box, radius=22, tint=GLASS, alpha=190, edge=GLASS_EDGE,
          edge_alpha=110, blur_backdrop=False, highlight=True):
    """Glassmorphic card.

    Real glass needs three things, and skipping any one of them is what makes
    a "glass" card look like a flat grey rectangle:
      - the backdrop behind it is blurred
      - the fill is translucent and slightly lighter at the top
      - there is a 1px bright edge catching the light
    """
    x0, y0, x1, y1 = [int(v) for v in box]
    if x1 <= x0 or y1 <= y0:
        return

    if blur_backdrop:
        pad = 30
        rx0, ry0 = max(0, x0 - pad), max(0, y0 - pad)
        rx1, ry1 = min(img.width, x1 + pad), min(img.height, y1 + pad)
        region = img.crop((rx0, ry0, rx1, ry1)).filter(ImageFilter.GaussianBlur(18))
        mask = Image.new("L", (rx1 - rx0, ry1 - ry0), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [x0 - rx0, y0 - ry0, x1 - rx0, y1 - ry0], radius=radius, fill=255)
        img.paste(region, (rx0, ry0), mask)

    # Built at card size rather than frame size — the ramp is ~25 rectangles
    # and the mask composite is O(pixels), so working on 900x170 instead of
    # 1920x1080 is a 13x saving per card.
    cw, ch = x1 - x0, y1 - y0
    lay = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    steps = 24
    for i in range(steps):
        p = i / steps
        a = int(alpha * lerp(1.15, 0.72, p))
        c = mix(tint, (58, 74, 122), p * 0.5)
        ld.rectangle([0, ch * p, cw, ch * (p + 1 / steps) + 1],
                     fill=c + (min(255, max(0, a)),))
    m = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, cw - 1, ch - 1], radius=radius, fill=255)
    lay.putalpha(Image.composite(lay.getchannel("A"), Image.new("L", (cw, ch), 0), m))

    ed = ImageDraw.Draw(lay)
    ed.rounded_rectangle([0, 0, cw - 1, ch - 1], radius=radius,
                         outline=edge + (edge_alpha,), width=2)
    if highlight:
        ed.line([(radius, 1), (cw - radius, 1)], fill=(190, 210, 255, 90), width=2)
    img.alpha_composite(lay, (x0, y0))


def glow(img, box, radius, colour, alpha=90, blur=42, spread=14):
    x0, y0, x1, y1 = [int(v) for v in box]
    m = int(blur * 2.5 + spread + 4)
    rx0, ry0 = max(0, x0 - spread - m), max(0, y0 - spread - m)
    rx1, ry1 = min(img.width, x1 + spread + m), min(img.height, y1 + spread + m)
    if rx1 <= rx0 or ry1 <= ry0:
        return
    lay = Image.new("RGBA", (rx1 - rx0, ry1 - ry0), (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle(
        [x0 - spread - rx0, y0 - spread - ry0, x1 + spread - rx0, y1 + spread - ry0],
        radius=radius + spread, fill=colour + (alpha,))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(blur)), (rx0, ry0))


def streak(img, x, y, w, h, colour, alpha=120, angle=0):
    """Light streak — a soft elongated flare used on transitions."""
    lay = layer_of(img)
    ImageDraw.Draw(lay).ellipse([x - w / 2, y - h / 2, x + w / 2, y + h / 2],
                                fill=colour + (alpha,))
    lay = lay.filter(ImageFilter.GaussianBlur(26))
    if angle:
        lay = lay.rotate(angle, center=(x, y))
    img.alpha_composite(lay)


_vig_cache = {}


def vignette(img, strength=0.55):
    """Cinematic falloff. Cheap depth — the eye reads a darkened edge as a lens."""
    key = (img.size, round(strength, 3))
    if key not in _vig_cache:
        w, h = img.size
        small = Image.new("L", (w // 12, h // 12), 0)
        ImageDraw.Draw(small).ellipse(
            [-small.width * 0.18, -small.height * 0.30,
             small.width * 1.18, small.height * 1.30], fill=255)
        mask = small.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(60))
        dark = Image.new("RGBA", (w, h), (0, 0, 0, int(255 * strength)))
        dark.putalpha(mask.point(lambda v: 255 - v))
        _vig_cache[key] = dark
    img.alpha_composite(_vig_cache[key])


def motion_ghost(draw_fn, img, x, y, dx, dy, samples=4, falloff=0.55):
    """Poor-man's motion blur: stamp the element along its motion vector with
    decaying alpha. Convincing at 30fps on fast moves and far cheaper than
    accumulating sub-frames."""
    for i in range(samples, 0, -1):
        p = i / samples
        draw_fn(img, x - dx * p, y - dy * p, int(255 * (falloff ** i)))


# --- Components ------------------------------------------------------------

def cursor(img, x, y, scale=1.0, pressed=False, alpha=255):
    d = ImageDraw.Draw(img, "RGBA")
    s = 27 * scale * (0.9 if pressed else 1.0)
    pts = [(0, 0), (0, s), (s * 0.27, s * 0.78), (s * 0.44, s * 1.16),
           (s * 0.60, s * 1.09), (s * 0.43, s * 0.72), (s * 0.70, s * 0.70)]
    poly = [(x + px, y + py) for px, py in pts]
    d.polygon([(px + 2, py + 3) for px, py in poly], fill=(0, 0, 0, int(alpha * 0.5)))
    d.polygon(poly, fill=WHITE + (alpha,))
    d.line(poly + [poly[0]], fill=(18, 22, 38, int(alpha * 0.8)), width=2)


def ripple(img, x, y, t, dur=0.5, colour=SECONDARY):
    if t < 0 or t > dur:
        return
    p = t / dur
    r = 10 + ease_out(p) * 70
    a = int(190 * (1 - p))
    ImageDraw.Draw(img, "RGBA").ellipse(
        [x - r, y - r, x + r, y + r], outline=colour + (a,),
        width=max(1, int(5 * (1 - p))))


def ring(img, cx, cy, r, p, width=10, colour=PRIMARY, track=(38, 48, 82)):
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=track + (255,), width=width)
    if p > 0.004:
        d.arc([cx - r, cy - r, cx + r, cy + r], start=-90,
              end=-90 + 360 * clamp(p), fill=colour + (255,), width=width)


def spinner(img, cx, cy, r, t, width=7, colour=SECONDARY):
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(38, 48, 82, 255), width=width)
    a0 = (t * 340) % 360
    d.arc([cx - r, cy - r, cx + r, cy + r], start=a0,
          end=a0 + 75 + 40 * math.sin(t * 3.4), fill=colour + (255,), width=width)


def bar(img, box, p, colour, radius=8, track=(30, 40, 70)):
    d = ImageDraw.Draw(img, "RGBA")
    rr(d, box, radius, fill=track + (255,))
    w = (box[2] - box[0]) * clamp(p)
    if w > 2:
        rr(d, [box[0], box[1], box[0] + w, box[3]], radius, fill=colour + (255,))


def tick_mark(d, x, y, size, p, colour=WHITE, width=4):
    """Checkmark that draws itself, in two strokes."""
    p = clamp(p)
    a = (x + size * 0.22, y + size * 0.52)
    b = (x + size * 0.42, y + size * 0.72)
    c = (x + size * 0.79, y + size * 0.28)
    if p < 0.45:
        q = p / 0.45
        d.line([a, (lerp(a[0], b[0], q), lerp(a[1], b[1], q))], fill=colour, width=width)
    else:
        q = (p - 0.45) / 0.55
        d.line([a, b], fill=colour, width=width)
        d.line([b, (lerp(b[0], c[0], q), lerp(b[1], c[1], q))], fill=colour, width=width)


def monogram(img, cx, cy, r, letters, colour, fnt, alpha=255):
    """Stand-in for an institution logo.

    Real university marks are trademarked and can't be shipped in a promo, so
    each institution gets a tinted monogram disc instead. Reads as a logo lockup
    without borrowing anyone's identity.
    """
    lay = layer_of(img)
    ImageDraw.Draw(lay).ellipse([cx - r, cy - r, cx + r, cy + r],
                                fill=colour + (int(alpha * 0.22),),
                                outline=colour + (alpha,), width=2)
    img.alpha_composite(lay)
    ImageDraw.Draw(img, "RGBA").text((cx, cy), letters, font=fnt,
                                     fill=colour + (alpha,), anchor="mm")


def particles(img, t, n=90, seed=4, cx=None, cy=None, spread=520, colour=SECONDARY,
              alpha=150, converge=None):
    """Drifting particle field.

    `converge` in 0..1 pulls every particle toward the centre — used when the AI
    "thinks", so the field visibly gathers into the result rather than just
    twinkling.
    """
    rng = random.Random(seed)
    cx = cx if cx is not None else img.width / 2
    cy = cy if cy is not None else img.height / 2
    lay = layer_of(img)
    d = ImageDraw.Draw(lay)
    for i in range(n):
        ang = rng.uniform(0, math.tau)
        rad = rng.uniform(0.2, 1.0) ** 0.6 * spread
        sp = rng.uniform(0.25, 1.0)
        drift = math.sin(t * sp * 1.4 + i) * 22
        r0 = rad + drift
        if converge is not None:
            r0 *= (1 - ease_in_out(converge) * 0.92)
        x = cx + math.cos(ang) * r0 * 1.6
        y = cy + math.sin(ang) * r0
        s = rng.uniform(1.4, 3.6)
        a = int(alpha * rng.uniform(0.35, 1.0) * (0.5 + 0.5 * math.sin(t * 2 + i)))
        col = colour if i % 3 else PRIMARY
        d.ellipse([x - s, y - s, x + s, y + s], fill=col + (max(0, a),))
    img.alpha_composite(lay)


def flow_lines(img, t, box, n=7, colour=PRIMARY, alpha=90, seed=2):
    """Gradient lines sweeping through a region — the 'AI is working' texture."""
    rng = random.Random(seed)
    lay = layer_of(img)
    d = ImageDraw.Draw(lay)
    x0, y0, x1, y1 = box
    for i in range(n):
        yy = y0 + (y1 - y0) * ((i + 0.5) / n)
        phase = rng.uniform(0, math.tau)
        w = (x1 - x0) * 0.42
        head = x0 + ((t * (140 + i * 26) + phase * 60) % ((x1 - x0) + w)) - w / 2
        for k in range(14):
            p = k / 14
            xx = head - w * p
            if xx < x0 or xx > x1:
                continue
            a = int(alpha * (1 - p) ** 1.6)
            c = SECONDARY if i % 2 else colour
            d.ellipse([xx - 3, yy - 3, xx + 3, yy + 3], fill=c + (a,))
    img.alpha_composite(lay)


def scan_beam(img, box, p, colour=SECONDARY):
    """Horizontal scanning beam with a soft trailing gradient."""
    x0, y0, x1, y1 = box
    y = y0 + (y1 - y0) * clamp(p)
    lay = layer_of(img)
    d = ImageDraw.Draw(lay)
    for k in range(28):
        a = int(110 * (1 - k / 28) ** 2)
        d.rectangle([x0, y - k * 4, x1, y - k * 4 + 3], fill=colour + (a,))
    d.rectangle([x0, y - 2, x1, y + 2], fill=colour + (220,))
    img.alpha_composite(lay)


def confetti(img, t, n=140, seed=9, colours=None):
    """Only at the very end, and only once — celebration that fires on every
    beat stops meaning anything."""
    if t <= 0:
        return
    colours = colours or [PRIMARY, SECONDARY, ACCENT, SUCCESS, WHITE]
    rng = random.Random(seed)
    lay = layer_of(img)
    d = ImageDraw.Draw(lay)
    for i in range(n):
        ang = rng.uniform(-math.pi * 0.85, -math.pi * 0.15)
        v = rng.uniform(620, 1500)
        x0 = img.width / 2 + rng.uniform(-160, 160)
        y0 = img.height * 0.62
        x = x0 + math.cos(ang) * v * t
        y = y0 + math.sin(ang) * v * t + 900 * t * t
        if y > img.height + 40:
            continue
        w, h = rng.uniform(7, 15), rng.uniform(4, 9)
        rot = rng.uniform(0, math.tau) + t * rng.uniform(4, 12)
        c = colours[i % len(colours)]
        a = int(255 * clamp(1.6 - t * 0.75))
        dx, dy = math.cos(rot) * w / 2, math.sin(rot) * h / 2
        d.polygon([(x - dx, y - dy), (x + dy, y - dx), (x + dx, y + dy), (x - dy, y + dx)],
                  fill=c + (a,))
    img.alpha_composite(lay)


def scrollbar(d, x, y0, y1, frac, pos):
    d.rounded_rectangle([x, y0, x + 8, y1], radius=4, fill=GREY_LINE + (160,))
    h = (y1 - y0) * frac
    top = y0 + (y1 - y0 - h) * clamp(pos)
    d.rounded_rectangle([x, top, x + 8, top + h], radius=4, fill=GREY_TEXT + (210,))
