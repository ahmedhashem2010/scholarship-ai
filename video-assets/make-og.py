#!/usr/bin/env python3
"""
Generates the social sharing image.

    python3 video-assets/make-og.py
    → public/og.png  (1200x630)

WHY THIS MATTERS MORE THAN IT LOOKS
The launch plan is "post the link into Egyptian Facebook groups and Telegram
scholarship channels". In those feeds the link preview *is* the ad — it's
larger than the post text and it's what decides whether anyone taps. A missing
image renders as a grey box, and `twitter:card = summary_large_image` with no
image is worse than no card at all.

ENGLISH ONLY, ON PURPOSE
PIL has no text-shaping engine. Arabic rendered through it comes out with
unjoined letterforms — legible to nobody, and shipping broken Arabic on an
Arabic-first product is worse than shipping none. The Arabic lives in the
og:title and og:description meta tags instead, where the browser and the social
platform do real shaping. Best of both.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image, ImageDraw, ImageFont

import ui
from ui import (BG, BG_DEEP, PRIMARY, SECONDARY, ACCENT, SUCCESS,
                INK, MUTED, mix, clamp)

W, H = 1200, 630
HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
OUT = os.path.join(PROJECT, "public", "og.png")

FDIR = "/usr/share/fonts/truetype/google-fonts"
BOLD = os.path.join(FDIR, "Poppins-Bold.ttf")
MED = os.path.join(FDIR, "Poppins-Medium.ttf")
REG = os.path.join(FDIR, "Poppins-Regular.ttf")


def F(p, s):
    return ImageFont.truetype(p, s)


def background():
    """Same three-pool navy gradient as the launch film, so the shared link and
    the video look like one brand."""
    step = 4
    sw, sh = W // step, H // step
    small = Image.new("RGB", (sw, sh))
    px = small.load()
    import math
    pools = [(0.18, 0.14, PRIMARY, 0.34),
             (0.86, 0.28, ACCENT, 0.26),
             (0.52, 1.02, SECONDARY, 0.18)]
    for y in range(sh):
        for x in range(sw):
            fx, fy = x / sw, y / sh
            c = mix(BG_DEEP, BG, 0.35 + 0.65 * (1 - fy) * 0.8)
            for pxc, pyc, col, amt in pools:
                dd = math.hypot((fx - pxc) * 1.3, (fy - pyc) * 1.7)
                g = clamp(1 - dd / 0.95) ** 2.2
                c = mix(c, col, g * amt)
            px[x, y] = c
    return small.resize((W, H), Image.BILINEAR).convert("RGBA")


def main():
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    # --- Logo lockup -------------------------------------------------------
    box = 84
    cx, cy = 84, 84
    lay = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    for i in range(20):
        p = i / 20
        ld.rectangle([0, box * p, box, box * (p + 1 / 20) + 1],
                     fill=mix(PRIMARY, SECONDARY, p) + (255,))
    m = Image.new("L", (box, box), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, box - 1, box - 1], radius=24, fill=255)
    lay.putalpha(m)
    img.alpha_composite(lay, (cx, cy))
    d.text((cx + box / 2, cy + box / 2 - 3), "S", font=F(BOLD, 48),
           fill=BG_DEEP + (255,), anchor="mm")
    d.text((cx + box + 22, cy + box / 2), "SmartScholar", font=F(BOLD, 42),
           fill=INK + (255,), anchor="lm")

    # --- Headline ----------------------------------------------------------
    # Two lines, second in cyan. Short enough to stay readable at the ~350px
    # wide thumbnail most feeds actually render.
    d.text((84, 262), "Find the scholarships", font=F(BOLD, 74), fill=INK + (255,), anchor="lm")
    d.text((84, 348), "you can actually win.", font=F(BOLD, 74), fill=SECONDARY + (255,), anchor="lm")

    d.text((84, 430), "AI matching · document review · a dated plan for every deadline",
           font=F(REG, 27), fill=MUTED + (255,), anchor="lm")

    # --- Proof chips -------------------------------------------------------
    chips = [("234 scholarships", PRIMARY), ("Arabic-first", SECONDARY),
             ("Free to search", SUCCESS)]
    x = 84
    for label, colour in chips:
        f = F(MED, 24)
        tw = d.textlength(label, font=f)
        w = tw + 44
        ui.panel(img, [x, 498, x + w, 552], 27,
                 fill=colour + (34,), outline=colour + (170,), width=2)
        d.text((x + w / 2, 525), label, font=f, fill=colour + (255,), anchor="mm")
        x += w + 16

    # --- Domain ------------------------------------------------------------
    d.text((W - 84, 525), "smartscholar.org", font=F(MED, 26),
           fill=MUTED + (255,), anchor="rm")

    ui.vignette(img, 0.34)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.convert("RGB").save(OUT, quality=92, optimize=True)
    kb = os.path.getsize(OUT) / 1024
    print(f"✓ {OUT}  ({W}x{H}, {kb:.0f} KB)")
    if kb > 300:
        print("  ! over 300KB — some platforms downscale aggressively above this")


if __name__ == "__main__":
    main()
