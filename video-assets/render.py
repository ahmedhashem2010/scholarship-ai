#!/usr/bin/env python3
"""
Scholarship Hub — competition video renderer.

    python3 video-assets/render.py [domain]

Produces a ~56-second 1080p MP4 with synthesised sound effects. No paid tools,
no external services, no screen recording required.

    output: video-assets/out/scholarship-hub.mp4

WHY THE UI IS SIMULATED RATHER THAN RECORDED
The brief is "show your project". A screen recording needs a deployed site,
seeded data, and a steady hand — and it re-records from scratch every time you
want to change the pacing. Redrawing the interface from the product's own
design tokens gives a deterministic, re-renderable demo where the timing is
authored rather than performed. Same colours, same radii, same type scale.
"""

import math
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ui
from ui import (BG, BG_DEEP, PRIMARY, SECONDARY, ACCENT, SUCCESS, WARN, DANGER,
                WHITE, INK, MUTED, clamp, lerp, mix, ease_out, ease_out_back,
                ease_in_out)
import audio

W, H = 1920, 1080
FPS = 30

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
OUT_DIR = os.path.join(HERE, "out")
# Frames go to local disk, NOT the mounted project folder. The mount is a
# network filesystem — writing ~1,600 PNGs across it takes minutes and the
# frames are intermediate anyway.
FRAME_DIR = "/tmp/sh_frames"

FDIR = "/usr/share/fonts/truetype/google-fonts"
BOLD = os.path.join(FDIR, "Poppins-Bold.ttf")
MED = os.path.join(FDIR, "Poppins-Medium.ttf")
REG = os.path.join(FDIR, "Poppins-Regular.ttf")

_fc = {}


def F(path, size):
    k = (path, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]


TEAL_LIGHT = (94, 234, 212)

# --------------------------------------------------------------------------
# Background
# --------------------------------------------------------------------------

_bg = None


def background():
    """Deep navy ground with three coloured pools of light.

    Rendered once at 1/8 scale and upsampled: a per-pixel pass over 2M pixels
    in Python costs more than every other draw call in a frame combined, and
    the gradient is smooth enough that the interpolation is invisible.
    """
    global _bg
    if _bg is None:
        step = 8
        sw, sh = W // step, H // step
        small = Image.new("RGB", (sw, sh))
        px = small.load()
        pools = [(0.22, 0.16, PRIMARY, 0.30),
                 (0.82, 0.30, ACCENT, 0.22),
                 (0.55, 0.95, SECONDARY, 0.16)]
        for y in range(sh):
            for x in range(sw):
                fx, fy = x / sw, y / sh
                c = mix(BG_DEEP, BG, 0.35 + 0.65 * (1 - fy) * 0.8)
                for px_, py_, col, amt in pools:
                    dd = math.hypot((fx - px_) * 1.35, (fy - py_) * 1.9)
                    g = clamp(1 - dd / 0.95) ** 2.2
                    c = mix(c, col, g * amt)
                px[x, y] = c
        _bg = small.resize((W, H), Image.BILINEAR)
    return _bg.convert("RGBA")


def txt(d, xy, s, fnt, colour, anchor="mm", a=255):
    if a <= 0:
        return
    d.text(xy, s, font=fnt, fill=colour + (int(a),), anchor=anchor)


def rise(d, xy, s, fnt, colour, t, delay=0.0, dur=0.65, px=44, anchor="mm"):
    lt = (t - delay) / dur
    if lt <= 0:
        return
    e = ease_out(lt)
    x, y = xy
    txt(d, (x, y + (1 - e) * px), s, fnt, colour, anchor, 255 * clamp(lt * 1.5))


def fade_edges(img, t, dur, fade=0.4):
    f = 1.0
    if t < fade:
        f = t / fade
    elif t > dur - fade:
        f = (dur - t) / fade
    f = clamp(f)
    if f < 1.0:
        return Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), img, f)
    return img


# --------------------------------------------------------------------------
# Scenes live in scenes.py. They need fonts, the cached background and the text
# helper, which are injected here so there's exactly one definition of each.
# --------------------------------------------------------------------------

import scenes

# Font handles by index: 0 = bold, 1 = medium, 2 = regular.
_FACES = [BOLD, MED, REG]
scenes.F = lambda face, size: F(_FACES[face], size)
scenes.background = background
scenes.txt = txt
SCENES = scenes.SCENES


def main():
    """Resumable renderer.

    The sandbox this was developed in kills background processes between
    commands, so a single 2-minute render can't run to completion in one go.
    Frames are therefore written idempotently and skipped if present, and the
    process exits cleanly once a wall-clock budget is spent. Re-run until it
    reports DONE, then run with --encode.

        python3 render.py                 # render frames (resumable)
        python3 render.py --encode        # mux frames + audio into the MP4
    """
    import time

    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    domain = args[0] if args else "smartscholar.org"
    encode_only = "--encode" in sys.argv
    # Wall-clock seconds before this pass bows out and asks to be re-run.
    # Overridable because the constraint is the *caller's* timeout, not the
    # renderer's: a shell that allows 45s wants ~36, a detached run wants
    # hours. RENDER_BUDGET=9999 to just let it finish.
    budget = float(os.environ.get("RENDER_BUDGET", 36.0))
    started = time.time()

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(FRAME_DIR, exist_ok=True)

    total = sum(s[2] for s in SCENES)
    total_frames = sum(int(d * FPS) for _, _, d in SCENES)

    # Shard the frame range across processes: --shard 0/2, --shard 1/2, ...
    # Frames are independent, so N workers is a near-linear speedup. Each
    # worker still skips frames already on disk, so sharding composes with
    # the resume behaviour rather than replacing it.
    shard, shards = 0, 1
    for a in sys.argv[1:]:
        if a.startswith("--shard="):
            shard, shards = (int(v) for v in a.split("=", 1)[1].split("/"))

    if not encode_only:
        n = 0
        made = skipped = 0
        for name, fn, dur in SCENES:
            for i in range(int(dur * FPS)):
                path = os.path.join(FRAME_DIR, f"f{n:05d}.png")
                n += 1
                if shards > 1 and (n - 1) % shards != shard:
                    continue
                # A zero-byte frame is a write that was killed mid-flight, not
                # a finished frame. Treating it as done is how a truncated PNG
                # ends up in the sequence — and ffmpeg's image demuxer stops
                # dead at the first unreadable file, silently producing a
                # video that ends there. Cost me a 7-second "59-second" film.
                if os.path.exists(path) and os.path.getsize(path) > 0:
                    skipped += 1
                    continue
                if time.time() - started > budget:
                    print(f"budget reached — {skipped + made}/{total_frames} done "
                          f"({made} this pass). Re-run to continue.")
                    return
                # Write then rename: rename is atomic on the same filesystem,
                # so a frame is either absent or complete. Never half-written.
                tmp = path + ".part"
                # format= is required: PIL infers it from the extension, and
                # the extension here is ".part".
                fn(i / FPS, dur, domain=domain).convert("RGB").save(
                    tmp, format="PNG", compress_level=1)
                os.replace(tmp, path)
                made += 1
        print(f"DONE — all {total_frames} frames present "
              f"({made} rendered this pass). Now run: python3 render.py --encode")
        return

    have = len([f for f in os.listdir(FRAME_DIR) if f.endswith(".png")])
    if have < total_frames:
        sys.exit(f"Only {have}/{total_frames} frames — keep re-running without --encode.")

    print("Building soundtrack…")
    wav = os.path.join(OUT_DIR, "audio.wav")
    audio.build(wav, SCENES, total)

    print("Encoding…")
    out = os.path.join(OUT_DIR, "smartscholar.mp4")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-framerate", str(FPS), "-i", os.path.join(FRAME_DIR, "f%05d.png"),
        "-i", wav,
        "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        out,
    ], check=True)

    mb = os.path.getsize(out) / 1e6
    print(f"\n✓ {out}  ({mb:.1f} MB · {total:.1f}s)")


if __name__ == "__main__":
    main()
