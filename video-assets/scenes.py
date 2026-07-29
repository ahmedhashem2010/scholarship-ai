"""
SmartScholar — 58s launch film.

  1  0.0– 6.5  Chaos      tabs pile up, requirements swarm, everything collapses
  2  6.5–11.0  Reveal     silence, logo, one line
  3 11.0–22.0  Match      three questions → AI converges → ranked cards sort
  4 22.0–31.0  Eligible   checklist ticks, "Highly Recommended" badge lands
  5 31.0–41.0  Review     CV scan, sections light up, score counts to 91
  6 41.0–51.0  Journey    milestone roadmap fills, confetti on Accepted
  7 51.0–58.0  End        logo, "Stop searching. Start applying.", CTA

Direction notes that matter more than the code:

- **Scene 1 is light grey, everything after is dark navy.** The cut at 6.5s is
  the emotional hinge of the film; the palette does that work before any word.
- **Motion is never linear.** Entrances overshoot and settle; exits accelerate
  away. Anything that simply fades reads as a template.
- **Six words maximum on screen.** The interface carries the meaning.
"""

import math
import random

from PIL import Image, ImageDraw, ImageFilter

import logo
import ui
from ui import (BG, BG_DEEP, PRIMARY, SECONDARY, ACCENT, SUCCESS, WARN, DANGER,
                WHITE, INK, MUTED, DIM, GLASS, GLASS_EDGE,
                GREY_BG, GREY_CARD, GREY_LINE, GREY_TEXT, GREY_INK,
                clamp, lerp, mix, ease_out, ease_out_quint, ease_out_back,
                ease_in, ease_in_out, spring)

W, H = 1920, 1080

F = None            # injected: F(face, size), 0=bold 1=medium 2=regular
background = None   # injected
txt = None          # injected


# --------------------------------------------------------------------------
# Shared
# --------------------------------------------------------------------------

def cursor_path(t, pts):
    if t <= pts[0][0]:
        return pts[0][1], pts[0][2]
    for i in range(len(pts) - 1):
        t0, x0, y0 = pts[i]
        t1, x1, y1 = pts[i + 1]
        if t0 <= t <= t1:
            p = ease_in_out((t - t0) / max(1e-6, t1 - t0))
            return lerp(x0, x1, p), lerp(y0, y1, p)
    return pts[-1][1], pts[-1][2]


def headline(img, d, text, t, delay, size=76, colour=INK, y=None, face=0,
             dur=0.55, letter_rise=True):
    """Headline with a soft rise and a blur-off.

    The blur is the detail that makes it feel expensive: text that resolves
    from soft to sharp reads as a camera focusing, not as a fade.
    """
    lt = t - delay
    if lt <= 0:
        return
    p = clamp(lt / dur)
    e = ease_out_quint(p)
    a = int(255 * clamp(p * 1.6))
    yy = (y if y is not None else H / 2) + (1 - e) * 34
    f = F(face, size)
    if p < 0.55:
        lay = ui.layer_of(img)
        ImageDraw.Draw(lay).text((W / 2, yy), text, font=f, fill=colour + (a,), anchor="mm")
        img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(9 * (1 - p / 0.55))))
    else:
        d.text((W / 2, yy), text, font=f, fill=colour + (a,), anchor="mm")


def caption(img, d, text, t, delay, colour=MUTED, y=None, size=34):
    lt = t - delay
    if lt <= 0:
        return
    e = ease_out(clamp(lt / 0.45))
    a = int(255 * clamp(lt / 0.45 * 1.6))
    d.text((W / 2, (y or H - 96) + (1 - e) * 18), text, font=F(1, size),
           fill=colour + (a,), anchor="mm")


def transition_wipe(img, t, dur, colour=PRIMARY):
    """Light streak that crosses frame at the scene seam."""
    if t < 0 or t > dur:
        return
    p = t / dur
    x = lerp(-500, W + 500, ease_in_out(p))
    a = int(150 * math.sin(math.pi * p))
    ui.streak(img, x, H / 2, 420, H * 1.6, colour, a)


def fade_edges(img, t, dur, fin=0.3, fout=0.3):
    f = 1.0
    if t < fin:
        f = t / fin
    elif t > dur - fout:
        f = (dur - t) / fout
    f = clamp(f)
    if f < 1.0:
        return Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), img, f)
    return img


# ==========================================================================
# 1 — CHAOS  (6.5s)
# ==========================================================================

TABS = ["Fully funded scholarships 2026", "DAAD eligibility", "IELTS waiver?",
        "Chevening deadline", "MEXT requirements", "Erasmus+ countries",
        "scholarship for Egyptians", "GRE needed?"]

SWARM = [("IELTS 7.0", DANGER), ("TOEFL 100", WARN), ("Deadline passed", DANGER),
         ("EU citizens only", WARN), ("GPA 3.5+", WARN), ("Expired", DANGER),
         ("2 refs required", WARN), ("Not eligible", DANGER),
         ("GRE required", WARN), ("Closed", DANGER)]


def s_chaos(t, dur, **kw):
    img = Image.new("RGBA", (W, H), GREY_BG + (255,))
    d = ImageDraw.Draw(img, "RGBA")

    # --- Browser with a growing tab strip ---------------------------------
    bx = [90, 70, W - 90, H - 70]
    ui.shadow(img, bx, 16, blur=40, alpha=90, offset=(0, 16))
    ui.rr(d, bx, 16, fill=GREY_CARD + (255,))

    n_tabs = 1 + int(clamp(t / 2.6) * (len(TABS) - 1))
    tw = min(230, (bx[2] - bx[0] - 40) / max(1, n_tabs))
    for i in range(n_tabs):
        e = ease_out_back(clamp((t - i * 0.28) / 0.3))
        if e <= 0:
            continue
        x0 = bx[0] + 20 + i * tw
        y0 = bx[1] + 12 + (1 - e) * 22
        active = i == n_tabs - 1
        ui.rr(d, [x0, y0, x0 + tw - 6, bx[1] + 58], 8,
              fill=(GREY_CARD if active else (228, 230, 238)) + (255,))
        label = TABS[i % len(TABS)]
        d.text((x0 + 14, (y0 + bx[1] + 58) / 2), label[:20] + "…", font=F(2, 15),
               fill=(GREY_INK if active else GREY_TEXT) + (255,), anchor="lm")

    # --- Search bar with typing -------------------------------------------
    sb = [bx[0] + 20, bx[1] + 72, bx[2] - 20, bx[1] + 126]
    ui.rr(d, sb, 27, fill=GREY_BG + (255,), outline=GREY_LINE + (255,), width=2)
    query = "fully funded scholarships for international students"
    shown = query[:int(clamp(t / 1.5) * len(query))]
    d.text((sb[0] + 28, (sb[1] + sb[3]) / 2), shown, font=F(2, 24),
           fill=GREY_INK + (255,), anchor="lm")
    if t < 1.6 and int(t * 3) % 2 == 0:
        cw = d.textlength(shown, font=F(2, 24))
        d.rectangle([sb[0] + 30 + cw, sb[1] + 16, sb[0] + 32 + cw, sb[3] - 16],
                    fill=PRIMARY + (255,))

    if t > 1.5:
        a = int(255 * clamp((t - 1.5) / 0.3))
        d.text((bx[0] + 30, bx[1] + 158), "About 4,310,000 results (0.42 seconds)",
               font=F(2, 20), fill=GREY_TEXT + (a,), anchor="lm")

    # --- Results, scrolling fast ------------------------------------------
    scroll = ease_in(clamp((t - 1.7) / 3.0)) * 900
    for i in range(16):
        y = bx[1] + 190 + i * 104 - scroll
        if y < bx[1] + 180 or y > bx[3] - 30:
            continue
        d.text((bx[0] + 30, y), "scholarshipsite" + str(i % 5) + ".com › funded",
               font=F(2, 17), fill=(26, 130, 90) + (255,), anchor="lm")
        d.text((bx[0] + 30, y + 30), TABS[i % len(TABS)].title(),
               font=F(2, 25), fill=(26, 60, 170) + (255,), anchor="lm")
        d.rounded_rectangle([bx[0] + 30, y + 58, bx[0] + 30 + 760, y + 68],
                            radius=5, fill=GREY_LINE + (255,))
        d.rounded_rectangle([bx[0] + 30, y + 76, bx[0] + 30 + 560, y + 86],
                            radius=5, fill=GREY_LINE + (255,))

    # --- Requirement swarm ------------------------------------------------
    # Chips fly in from the edges and pile up. This is the "confusion" beat —
    # the point isn't to read them, it's to feel outnumbered.
    rng = random.Random(12)
    for i, (label, colour) in enumerate(SWARM):
        st = 2.6 + i * 0.17
        lt = t - st
        if lt <= 0:
            continue
        e = ease_out_back(clamp(lt / 0.42), 1.4)
        tx = rng.uniform(220, W - 420)
        ty = rng.uniform(220, H - 220)
        edge = rng.choice([(-400, ty), (W + 400, ty), (tx, -300), (tx, H + 300)])
        x = lerp(edge[0], tx, e)
        y = lerp(edge[1], ty, e)
        rot = (1 - e) * rng.uniform(-30, 30)
        f = F(0, 30)
        wpx = d.textlength(label, font=f)
        cw, ch = int(wpx + 44), 56
        # Chip is composed at its own size and rotated there. Rotating a
        # full-frame layer per chip (10 of them) cost more than the rest of the
        # scene combined.
        pad = 40
        chip = Image.new("RGBA", (cw + pad * 2, ch + pad * 2), (0, 0, 0, 0))
        cd_ = ImageDraw.Draw(chip)
        cd_.rounded_rectangle([pad, pad, pad + cw, pad + ch], radius=14,
                              fill=WHITE + (245,), outline=colour + (255,), width=3)
        cd_.text((pad + cw / 2, pad + ch / 2), label, font=f,
                 fill=colour + (255,), anchor="mm")
        if abs(rot) > 0.5:
            chip = chip.rotate(rot, resample=Image.BILINEAR)
        ui.shadow(img, [x - cw / 2, y - ch / 2, x + cw / 2, y + ch / 2],
                  14, blur=16, alpha=70, offset=(0, 8))
        img.alpha_composite(chip, (int(x - cw / 2 - pad), int(y - ch / 2 - pad)))

    # --- Collapse ----------------------------------------------------------
    # Everything desaturates and crushes toward black — the moment before relief.
    if t > 5.3:
        p = ease_in(clamp((t - 5.3) / 1.0))
        img.alpha_composite(Image.new("RGBA", (W, H), BG_DEEP + (int(255 * p),)))

    ui.vignette(img, 0.32)
    return fade_edges(img, t, dur, 0.22, 0.001)


# ==========================================================================
# 2 — REVEAL  (4.5s)
# ==========================================================================

def s_reveal(t, dur, **kw):
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    # A held beat of near-silence, then the mark arrives.
    ui.particles(img, t, n=60, spread=620, alpha=70)

    # --- Beat 1: the road builds itself, large and centred ------------------
    #
    # The mark is a road, so the reveal is the route being drawn — start node,
    # through the waypoint, to the gold destination. This is the single most
    # important four seconds in the film: it states the entire product thesis
    # (a deadline becomes a route) before a word is spoken.
    #
    # It plays big and centre-frame first, then shrinks into the lockup. Doing
    # it small, in the corner, at lockup size — which is where this started —
    # made the animation invisible and wasted the idea.
    HERO_SIZE, HERO_X, HERO_Y = 400, W / 2, H / 2 - 70
    LOCK_SIZE, LOCK_X, LOCK_Y = 150, W / 2 - 268, H / 2 - 46

    lt = clamp((t - 0.3) / 0.7)
    if lt > 0:
        a = int(255 * clamp(lt * 2))

        # The move to the lockup. Before 2.55s this is 0 and the logo sits
        # centred at hero size.
        mv = ease_out_quint(clamp((t - 2.55) / 0.75))
        size = lerp(HERO_SIZE, LOCK_SIZE, mv)
        cx = lerp(HERO_X, LOCK_X, mv)
        cy = lerp(HERO_Y, LOCK_Y, mv)

        # Entry overshoot only while it's still the hero — springing during
        # the move would fight the move.
        if mv <= 0:
            size *= 0.86 + 0.14 * spring(lt, 3.0, 5.5)

        ui.glow(img, [cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2],
                30, PRIMARY, int(60 * lt * (1 - mv * 0.4)), 46, 16)

        # Slightly eased at both ends: a route being drawn accelerates away
        # from the start and settles into the destination. Constant speed
        # reads mechanical.
        trace = ease_in_out(clamp((t - 0.55) / 1.85))
        logo.draw(img, cx, cy, size, p=trace, alpha=a)
        logo.dest_burst(img, cx, cy, size, t - 2.4, alpha=a)

        # --- Beat 2: the name arrives, after the route completes ------------
        wt = clamp((t - 2.95) / 0.7)
        if wt > 0:
            f = F(0, 88)
            full = "SmartScholar"
            lay2 = ui.layer_of(img)
            ImageDraw.Draw(lay2).text((LOCK_X + 108, LOCK_Y), full, font=f,
                                      fill=INK + (255,), anchor="lm")
            tw = ImageDraw.Draw(img).textlength(full, font=f)
            m2 = Image.new("L", img.size, 0)
            ImageDraw.Draw(m2).rectangle(
                [0, 0, LOCK_X + 108 + tw * ease_out_quint(wt) + 30, H], fill=255)
            lay2.putalpha(Image.composite(lay2.getchannel("A"),
                                          Image.new("L", img.size, 0), m2))
            img.alpha_composite(lay2)

    headline(img, d, "Find scholarships you'll actually get.", t, 3.55,
             size=44, colour=MUTED, y=H / 2 + 108, face=1, dur=0.6)

    ui.vignette(img, 0.42)
    transition_wipe(img, t - (dur - 0.5), 0.5, SECONDARY)
    return fade_edges(img, t, dur, 0.35, 0.25)


# ==========================================================================
# 3 — MATCH  (11s)
# ==========================================================================

Q = [("Where are you from?", ["Egypt", "Jordan", "Nigeria"], 0),
     ("What degree?", ["Bachelor's", "Master's", "PhD"], 1),
     ("English level?", ["IELTS 7.0", "No test yet", "Not sure"], 1)]

CARDS = [("University of Toronto", "UT", "Canada  ·  Fully Funded", 92, SUCCESS),
         ("University of Melbourne", "UM", "Australia  ·  Fully Funded", 89, SECONDARY),
         ("ETH Zurich", "EZ", "Switzerland  ·  Tuition + Stipend", 84, PRIMARY)]


def s_match(t, dur, **kw):
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    ANSWER_T = [0.7, 1.5, 2.3]
    THINK_T, CARDS_T = 3.0, 4.6

    # --- Questions: a stack of glass cards, answered in sequence ----------
    if t < THINK_T + 0.9:
        out = ease_in(clamp((t - THINK_T) / 0.6))
        for qi, (question, opts, correct) in enumerate(Q):
            e = ease_out_back(clamp((t - qi * 0.22) / 0.5))
            if e <= 0:
                continue
            base_y = 250 + qi * 216
            y = base_y + (1 - e) * 60 - out * 420
            a = int(255 * (1 - out))
            if a <= 2:
                continue
            box = [W / 2 - 430, y, W / 2 + 430, y + 176]
            ui.glass(img, box, 22, alpha=int(150 * (1 - out)))
            d.text((box[0] + 34, y + 44), question, font=F(1, 30),
                   fill=MUTED + (a,), anchor="lm")
            for oi, opt in enumerate(opts):
                ox = box[0] + 34 + oi * 288
                ob = [ox, y + 84, ox + 262, y + 146]
                picked = oi == correct and t > ANSWER_T[qi]
                if picked:
                    ui.glow(img, ob, 16, PRIMARY, int(70 * (1 - out)), 26, 6)
                    lay = ui.layer_of(img)
                    lg = ImageDraw.Draw(lay)
                    for k in range(14):
                        p = k / 14
                        lg.rectangle([ox + (262 * p), ob[1], ox + 262 * (p + 1 / 14) + 1, ob[3]],
                                     fill=mix(PRIMARY, ACCENT, p) + (a,))
                    m = Image.new("L", img.size, 0)
                    ImageDraw.Draw(m).rounded_rectangle(ob, radius=16, fill=255)
                    lay.putalpha(Image.composite(lay.getchannel("A"),
                                                 Image.new("L", img.size, 0), m))
                    img.alpha_composite(lay)
                    col = WHITE
                else:
                    ui.panel(img, ob, 16, fill=(26, 34, 62) + (a,),
                             outline=(58, 72, 118) + (a,), width=2)
                    col = MUTED
                d.text(((ob[0] + ob[2]) / 2, (ob[1] + ob[3]) / 2), opt,
                       font=F(1, 26), fill=col + (a,), anchor="mm")

    # --- AI thinking: field converges into the centre ---------------------
    if THINK_T - 0.2 < t < CARDS_T + 0.5:
        lt = clamp((t - (THINK_T - 0.2)) / 1.7)
        ui.particles(img, t, n=150, spread=700, alpha=185, converge=lt)
        ui.flow_lines(img, t, [W / 2 - 560, 300, W / 2 + 560, 780], n=6, alpha=70)
        if t < CARDS_T:
            pulse = 0.5 + 0.5 * math.sin(t * 9)
            ui.glow(img, [W / 2 - 90, H / 2 - 90, W / 2 + 90, H / 2 + 90], 90,
                    SECONDARY, int(60 + 50 * pulse), 60, 30)
            ui.spinner(img, W / 2, H / 2, 54, t, 6)
            caption(img, d, "Matching 234 scholarships to your profile", t, THINK_T + 0.15,
                    SECONDARY, H / 2 + 150, 30)

    # --- Ranked cards ------------------------------------------------------
    if t >= CARDS_T:
        rt = t - CARDS_T
        # They land in source order, then re-sort so the best rises to the top.
        SORT_T = 2.1
        order = [0, 1, 2]
        pre = [1, 0, 2]
        for i, (name, mono, sub, pct, colour) in enumerate(CARDS):
            dl = i * 0.16
            lt = rt - dl
            if lt <= 0:
                continue
            e = ease_out_back(clamp(lt / 0.6), 1.5)
            a = int(255 * clamp(lt / 0.4))

            slot_from = pre.index(i)
            slot_to = order.index(i)
            sp = ease_in_out(clamp((rt - SORT_T) / 0.75))
            slot = lerp(slot_from, slot_to, sp)

            y = 250 + slot * 200
            x0 = W / 2 - 470 + (1 - e) * 120
            box = [x0, y, x0 + 940, y + 168]

            if rt > SORT_T and i == 0:
                ui.glow(img, box, 22, SUCCESS, int(46 * sp), 44, 10)
            ui.shadow(img, box, 22, blur=30, alpha=int(120 * (a / 255)), offset=(0, 14))
            ui.glass(img, box, 22, alpha=int(165 * (a / 255)))

            ui.monogram(img, box[0] + 76, y + 84, 40, mono, colour, F(0, 30), a)
            d.text((box[0] + 142, y + 62), name, font=F(0, 34), fill=INK + (a,), anchor="lm")
            d.text((box[0] + 142, y + 110), sub, font=F(2, 24), fill=MUTED + (a,), anchor="lm")

            fp = ease_out(clamp((lt - 0.3) / 0.9))
            cx, cy = box[2] - 96, y + 84
            ui.ring(img, cx, cy, 52, (pct / 100) * fp, 9, colour)
            d.text((cx, cy - 6), f"{int(pct * fp)}%", font=F(0, 32),
                   fill=colour + (a,), anchor="mm")
            d.text((cx, cy + 28), "match", font=F(2, 17), fill=MUTED + (a,), anchor="mm")

        caption(img, d, "Ranked by what you can actually win", t, CARDS_T + 3.0,
                SECONDARY, 880, 34)

    ui.vignette(img, 0.4)
    transition_wipe(img, t - (dur - 0.5), 0.5, ACCENT)
    return fade_edges(img, t, dur, 0.25, 0.25)


# ==========================================================================
# 4 — ELIGIBILITY  (9s)
# ==========================================================================

CHECKS = [("You are eligible", SUCCESS),
          ("Fully funded — tuition, stipend, flights", SUCCESS),
          ("Deadline in 19 days", WARN),
          ("IELTS waiver accepted", SUCCESS),
          ("Matches your field and degree", SUCCESS)]


def s_eligible(t, dur, **kw):
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    # Hero card scales up as though the previous card opened into it.
    e = ease_out_quint(clamp(t / 0.7))
    if e <= 0:
        return fade_edges(img, t, dur)
    box = [W / 2 - 560 * e, 150, W / 2 + 560 * e, 150 + 800 * e]
    ui.shadow(img, box, 26, blur=44, alpha=150, offset=(0, 22))
    ui.glass(img, box, 26, alpha=175)

    if e > 0.75:
        a = int(255 * clamp((e - 0.75) / 0.25))
        ui.monogram(img, box[0] + 92, 246, 44, "UT", SUCCESS, F(0, 32), a)
        d.text((box[0] + 162, 224), "University of Toronto", font=F(0, 44),
               fill=INK + (a,), anchor="lm")
        d.text((box[0] + 162, 274), "Vanier Graduate Scholarship  ·  Canada",
               font=F(2, 26), fill=MUTED + (a,), anchor="lm")
        d.line([box[0] + 60, 320, box[2] - 60, 320], fill=(58, 72, 118, a), width=2)

    # Scanning the requirements, then ticking them one at a time.
    if 0.8 < t < 1.8:
        ui.scan_beam(img, [box[0] + 40, 340, box[2] - 40, 800], (t - 0.8) / 1.0)

    for i, (label, colour) in enumerate(CHECKS):
        st = 1.8 + i * 0.42
        lt = t - st
        if lt <= 0:
            continue
        a = int(255 * clamp(lt / 0.3))
        y = 400 + i * 82
        sl = ease_out_back(clamp(lt / 0.45), 1.3)
        x = box[0] + 70 + (1 - sl) * 46

        bs = 42
        pop = ease_out_back(clamp(lt / 0.3), 2.2)
        r = bs / 2 * pop
        lay = ui.layer_of(img)
        ImageDraw.Draw(lay).ellipse([x - r, y - r, x + r, y + r],
                                    fill=colour + (int(a * 0.9),))
        img.alpha_composite(lay)
        if lt > 0.12:
            ui.tick_mark(d, x - bs / 2, y - bs / 2, bs, clamp((lt - 0.12) / 0.25),
                         BG_DEEP + (a,), 5)
        d.text((x + 48, y), label, font=F(1, 32), fill=INK + (a,), anchor="lm")

    # The verdict badge — the emotional payoff of the scene.
    bt = t - 4.4
    if bt > 0:
        s = spring(clamp(bt / 0.8), 3.2, 6.0)
        bw, bh = 470 * (0.8 + 0.2 * s), 96 * (0.8 + 0.2 * s)
        cx, cy = W / 2, 838
        bb = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2]
        ui.glow(img, bb, 26, SUCCESS, 80, 50, 16)
        lay = ui.layer_of(img)
        lg = ImageDraw.Draw(lay)
        for k in range(18):
            p = k / 18
            lg.rectangle([bb[0] + bw * p, bb[1], bb[0] + bw * (p + 1 / 18) + 1, bb[3]],
                         fill=mix(SUCCESS, SECONDARY, p * 0.55) + (255,))
        m = Image.new("L", img.size, 0)
        ImageDraw.Draw(m).rounded_rectangle(bb, radius=24, fill=255)
        lay.putalpha(Image.composite(lay.getchannel("A"), Image.new("L", img.size, 0), m))
        img.alpha_composite(lay)
        d.text((cx, cy), "HIGHLY RECOMMENDED", font=F(0, 36), fill=BG_DEEP + (255,), anchor="mm")

    caption(img, d, "No guessing. It tells you where you stand.", t, 6.0, MUTED, H - 74)
    ui.vignette(img, 0.42)
    transition_wipe(img, t - (dur - 0.5), 0.5, PRIMARY)
    return fade_edges(img, t, dur, 0.25, 0.25)


# ==========================================================================
# 5 — DOCUMENT REVIEW  (10s)
# ==========================================================================

SECTIONS = [("Experience", 0.86, SUCCESS, "Strong, quantified"),
            ("Leadership", 0.41, DANGER, "Examples missing"),
            ("Projects", 0.78, SUCCESS, "Relevant and specific"),
            ("Personal statement", 0.55, WARN, "Weak opening")]


def s_review(t, dur, **kw):
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    left = [150, 150, 880, 950]
    right = [930, 150, W - 150, 950]

    # --- Document lands, then gets scanned --------------------------------
    e = ease_out_back(clamp(t / 0.6), 1.3)
    if e <= 0:
        return fade_edges(img, t, dur)
    lb = [left[0], left[1] + (1 - e) * 60, left[2], left[3] + (1 - e) * 60]
    ui.shadow(img, lb, 22, blur=36, alpha=140, offset=(0, 18))
    ui.glass(img, lb, 22, alpha=170)
    a0 = int(255 * clamp(t / 0.4))
    d.text((lb[0] + 40, lb[1] + 52), "Ahmed_CV.pdf", font=F(0, 32), fill=INK + (a0,), anchor="lm")
    d.text((lb[0] + 40, lb[1] + 96), "Uploaded just now", font=F(2, 22),
           fill=MUTED + (a0,), anchor="lm")

    # Body text as bars — real prose is unreadable at this size and invites
    # the viewer to read instead of watch.
    rng = random.Random(5)
    ly = lb[1] + 150
    rows = []
    for i in range(21):
        yy = ly + i * 34
        wpx = (lb[2] - lb[0] - 80) * (0.95 if i % 4 else 0.6)
        rows.append((yy, wpx))
        d.rounded_rectangle([lb[0] + 40, yy, lb[0] + 40 + wpx, yy + 11],
                            radius=5, fill=(58, 72, 118, 150))

    SCAN0, SCAN1 = 0.9, 2.6
    if SCAN0 < t < SCAN1 + 0.2:
        ui.scan_beam(img, [lb[0] + 20, ly - 20, lb[2] - 20, lb[3] - 30],
                     (t - SCAN0) / (SCAN1 - SCAN0))
        ui.flow_lines(img, t, [lb[0] + 20, ly, lb[2] - 20, lb[3] - 30], n=5, alpha=60)

    # Sections light up in place as the AI resolves each one.
    for i, (name, score, colour, note) in enumerate(SECTIONS):
        st = SCAN1 + 0.1 + i * 0.38
        lt = t - st
        if lt <= 0:
            continue
        a = int(255 * clamp(lt / 0.3))
        band = rows[3 + i * 4][0]
        h = 4 * 34
        lay = ui.layer_of(img)
        ImageDraw.Draw(lay).rounded_rectangle(
            [lb[0] + 28, band - 12, lb[0] + 28 + (lb[2] - lb[0] - 56) * ease_out(clamp(lt / 0.4)),
             band + h - 18], radius=10, fill=colour + (int(46 * (a / 255)),),
            outline=colour + (int(150 * (a / 255)),), width=2)
        img.alpha_composite(lay)
        d.text((lb[0] + 44, band - 34), name.upper(), font=F(0, 18),
               fill=colour + (a,), anchor="lm")

    # --- Feedback panel ----------------------------------------------------
    rt = t - (SCAN1 + 0.1)
    if rt > 0:
        re_ = ease_out_back(clamp(rt / 0.55), 1.3)
        rb = [right[0] + (1 - re_) * 90, right[1], right[2], right[3]]
        ui.shadow(img, rb, 22, blur=36, alpha=140, offset=(0, 18))
        ui.glass(img, rb, 22, alpha=170)

        ar = int(255 * clamp(rt / 0.35))
        d.text((rb[0] + 44, rb[1] + 56), "AI review", font=F(0, 34), fill=INK + (ar,), anchor="lm")

        # Score ring counts up.
        sp = ease_out(clamp((rt - 0.4) / 1.3))
        cx, cy = rb[2] - 130, rb[1] + 96
        ui.ring(img, cx, cy, 62, 0.91 * sp, 11, SUCCESS)
        d.text((cx, cy - 6), f"{int(91 * sp)}", font=F(0, 42), fill=SUCCESS + (ar,), anchor="mm")
        d.text((cx, cy + 30), "/100", font=F(2, 18), fill=MUTED + (ar,), anchor="mm")

        for i, (name, score, colour, note) in enumerate(SECTIONS):
            dl = 0.9 + i * 0.24
            if rt < dl:
                continue
            aa = int(255 * clamp((rt - dl) / 0.3))
            sl = ease_out_back(clamp((rt - dl) / 0.45), 1.2)
            y = rb[1] + 220 + i * 118
            x = rb[0] + 44 + (1 - sl) * 40
            d.text((x, y), name, font=F(1, 30), fill=INK + (aa,), anchor="lm")
            d.text((x, y + 40), note, font=F(2, 24), fill=colour + (aa,), anchor="lm")
            bp = ease_out(clamp((rt - dl) / 0.7))
            ui.bar(img, [x, y + 66, rb[2] - 60, y + 78], score * bp, colour, 6)

    caption(img, d, "Every document, reviewed in seconds", t, 7.4, MUTED, H - 74)
    ui.vignette(img, 0.42)
    transition_wipe(img, t - (dur - 0.5), 0.5, SECONDARY)
    return fade_edges(img, t, dur, 0.25, 0.25)


# ==========================================================================
# 6 — JOURNEY  (10s)
# ==========================================================================

MILESTONES = ["Discover", "Match", "Apply", "Review", "Interview", "Visa", "Accepted"]


def s_journey(t, dur, **kw):
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    headline(img, d, "Every step, tracked.", t, 0.15, 58, INK, 220, 0, 0.6)

    y = 560
    x0, x1 = 220, W - 220
    gap = (x1 - x0) / (len(MILESTONES) - 1)

    d.line([(x0, y), (x1, y)], fill=(40, 52, 88, 255), width=8)

    STEP0, STEP_GAP = 1.0, 0.72
    prog = clamp((t - STEP0) / (STEP_GAP * (len(MILESTONES) - 1)))
    if prog > 0:
        lay = ui.layer_of(img)
        lg = ImageDraw.Draw(lay)
        end = x0 + (x1 - x0) * ease_in_out(prog)
        segs = 40
        for k in range(segs):
            p = k / segs
            xa = x0 + (end - x0) * p
            xb = x0 + (end - x0) * (p + 1 / segs) + 2
            lg.line([(xa, y), (xb, y)], fill=mix(PRIMARY, SUCCESS, p) + (255,), width=8)
        img.alpha_composite(lay)
        # Leading glow travels with the head of the bar.
        ui.glow(img, [end - 22, y - 22, end + 22, y + 22], 22, SECONDARY, 130, 30, 8)

    for i, name in enumerate(MILESTONES):
        st = STEP0 + i * STEP_GAP
        lt = t - st
        cx = x0 + i * gap
        done = lt > 0
        last = i == len(MILESTONES) - 1

        r = 30
        if done:
            pop = ease_out_back(clamp(lt / 0.32), 2.4)
            rr_ = r * (0.5 + 0.5 * pop)
            colour = SUCCESS if last else PRIMARY
            if last:
                ui.glow(img, [cx - rr_, y - rr_, cx + rr_, y + rr_], int(rr_),
                        SUCCESS, 150, 40, 14)
            lay = ui.layer_of(img)
            ImageDraw.Draw(lay).ellipse([cx - rr_, y - rr_, cx + rr_, y + rr_],
                                        fill=colour + (255,))
            img.alpha_composite(lay)
            if lt > 0.1:
                ui.tick_mark(d, cx - 17, y - 17, 34, clamp((lt - 0.1) / 0.22), WHITE + (255,), 4)
            ui.ripple(img, cx, y, lt, 0.45, SECONDARY)
        else:
            d.ellipse([cx - r, y - r, cx + r, y + r], fill=(24, 32, 58, 255),
                      outline=(58, 72, 118, 255), width=3)

        a = int(255 * clamp((lt + 0.35) / 0.35)) if done else 150
        col = (SUCCESS if last else INK) if done else DIM
        yy = y + 76 + (0 if done else 6)
        d.text((cx, yy), name, font=F(0 if last else 1, 27), fill=col + (a,), anchor="mm")

    # Reminder toast — the product doing work while the student sleeps.
    if 3.2 < t < 7.0:
        lt = t - 3.2
        e = ease_out_back(clamp(lt / 0.5), 1.4)
        out = ease_in(clamp((lt - 3.0) / 0.6))
        box = [W - 700 + (1 - e) * 460 + out * 500, 800, W - 160 + (1 - e) * 460 + out * 500, 940]
        ui.shadow(img, box, 18, blur=28, alpha=120, offset=(0, 12))
        ui.glass(img, box, 18, alpha=190)
        d.rounded_rectangle([box[0] + 22, box[1] + 26, box[0] + 28, box[3] - 26],
                            radius=3, fill=WARN + (255,))
        d.text((box[0] + 50, box[1] + 46), "Reminder · 19 days left", font=F(0, 26),
               fill=INK + (255,), anchor="lm")
        d.text((box[0] + 50, box[1] + 90), "Request your recommendation letters",
               font=F(2, 22), fill=MUTED + (255,), anchor="lm")

    if t > 5.9:
        ui.confetti(img, t - 5.9, 150)

    caption(img, d, "Deadlines never sneak up on you again", t, 7.6, MUTED, H - 74)
    ui.vignette(img, 0.4)
    transition_wipe(img, t - (dur - 0.5), 0.5, ACCENT)
    return fade_edges(img, t, dur, 0.25, 0.25)


# ==========================================================================
# 7 — END  (7s)
# ==========================================================================

def s_end(t, dur, domain="smartscholar.org", **kw):
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    # Slow drifting field — the background is alive but never distracting.
    ui.particles(img, t * 0.5, n=80, spread=760, alpha=80)

    lt = clamp(t / 0.8)
    if lt > 0:
        s = spring(lt, 2.6, 5.0)
        a = int(255 * clamp(lt * 2))
        size = 118 * (0.86 + 0.14 * s)
        cx, cy = W / 2 - 224, 300

        # Second, faster build. The audience has already seen the road drawn
        # once; repeating it at the same speed would drag the ending. This is
        # a recall, not a reveal.
        trace = ease_out_quint(clamp((t - 0.15) / 0.9))
        logo.draw(img, cx, cy, size, p=trace, alpha=a)
        logo.dest_burst(img, cx, cy, size, t - 1.05, alpha=a)

        d.text((cx + 92, cy), "SmartScholar", font=F(0, 66), fill=INK + (a,), anchor="lm")

    headline(img, d, "Stop searching.", t, 0.9, 96, INK, 520, 0, 0.6)
    headline(img, d, "Start applying.", t, 1.15, 96, SECONDARY, 630, 0, 0.6)
    headline(img, d, "AI-powered scholarship matching for ambitious students.",
             t, 1.7, 32, MUTED, 730, 1, 0.6)

    # CTA with a breathing glow — the last thing the eye rests on.
    bt = t - 2.2
    if bt > 0:
        s = spring(clamp(bt / 0.7), 3.0, 5.5)
        bw, bh = 340 * (0.85 + 0.15 * s), 88 * (0.85 + 0.15 * s)
        cx, cy = W / 2, 852
        bb = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2]
        breathe = 0.5 + 0.5 * math.sin((t - 2.2) * 2.2)
        ui.glow(img, bb, 22, PRIMARY, int(60 + 55 * breathe), 46, 14)
        lay = ui.layer_of(img)
        lg = ImageDraw.Draw(lay)
        for k in range(18):
            p = k / 18
            lg.rectangle([bb[0] + bw * p, bb[1], bb[0] + bw * (p + 1 / 18) + 1, bb[3]],
                         fill=mix(PRIMARY, ACCENT, p) + (255,))
        m = Image.new("L", img.size, 0)
        ImageDraw.Draw(m).rounded_rectangle(bb, radius=22, fill=255)
        lay.putalpha(Image.composite(lay.getchannel("A"), Image.new("L", img.size, 0), m))
        img.alpha_composite(lay)
        d.text((cx, cy), "Get Started", font=F(0, 34), fill=WHITE + (255,), anchor="mm")

    if t > 3.0:
        a = int(255 * clamp((t - 3.0) / 0.5))
        d.text((W / 2, 960), domain, font=F(1, 30), fill=MUTED + (a,), anchor="mm")

    ui.vignette(img, 0.5)
    return fade_edges(img, t, dur, 0.3, 0.8)


SCENES = [
    ("chaos", s_chaos, 6.5),
    # 4.5 -> 5.6: the roadmap trace needs room to read. Total film 59.1s,
    # still inside the one-minute limit.
    ("reveal", s_reveal, 5.6),
    ("match", s_match, 11.0),
    ("eligible", s_eligible, 9.0),
    ("review", s_review, 10.0),
    ("journey", s_journey, 10.0),
    ("end", s_end, 7.0),
]
