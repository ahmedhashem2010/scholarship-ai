#!/usr/bin/env python3
"""
Builds SmartScholar-Brand-Guidelines.pdf from the brand assets.

    pip install weasyprint --break-system-packages
    python3 scripts/build-brand-book.py

WHY A SCRIPT AND NOT A DESIGN FILE

Same reason the logo assets are generated: a brand book that lives in someone's
Figma account goes stale the moment a value changes, and then two sources of
truth disagree. This reads the real SVGs off disk and hard-codes the same hex
values as BRAND-IDENTITY.md, so regenerating is cheap enough to actually do.

If you change a colour, change it in BRAND-IDENTITY.md AND here, then re-run.
"""

import os
import subprocess
import sys
from datetime import date

from weasyprint import HTML

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BRAND = os.path.join(ROOT, "public", "brand")
OUT = os.path.join(ROOT, "SmartScholar-Brand-Guidelines.pdf")

NAVY = "#162C4C"
GOLD = "#C6A14B"
PAPER = "#FAF9F6"
LINE = "#E8E4DC"
MUTED = "#5F6B7F"
DIM = "#8C97A8"


def asset(name):
    p = os.path.join(BRAND, name)
    if not os.path.exists(p):
        sys.exit(f"Missing asset: {p}\nRun `node scripts/build-brand.mjs` first.")
    return "file://" + p.replace(os.sep, "/")


def swatch_row(items, height=54):
    """A flush row of colour chips. Hex sits inside when there's room."""
    cells = []
    for hexv, label, on in items:
        cells.append(
            f'<div style="flex:1;height:{height}px;background:{hexv};'
            f'display:flex;align-items:flex-end;padding:6px 8px;">'
            f'<span style="font-size:7pt;color:{on};letter-spacing:.02em;">{label}</span></div>'
        )
    return (
        '<div style="display:flex;border-radius:6px;overflow:hidden;'
        'margin:10px 0 4px;">' + "".join(cells) + "</div>"
    )


NAVY_RAMP = [
    ("#0D1A2D", "900", "#93A8C4"), ("#162C4C", "800", "#93A8C4"),
    ("#1F3D63", "700", "#C6D2E1"), ("#2B527F", "600", "#E5EBF3"),
    ("#3B6A9E", "500", "#FFFFFF"), ("#93A8C4", "300", "#0D1A2D"),
    ("#C6D2E1", "200", "#0D1A2D"), ("#E5EBF3", "100", "#0D1A2D"),
    ("#F2F6FA", "50", "#0D1A2D"),
]

GOLD_RAMP = [
    ("#8A6E2C", "700", "#FBF7EC"), ("#C6A14B", "500", "#2C2208"),
    ("#EDE0BE", "200", "#6B5320"), ("#FBF7EC", "50", "#8A6E2C"),
]

NEUTRALS = [
    ("#FAF9F6", "paper", "#5F6B7F"), ("#FFFFFF", "card", "#5F6B7F"),
    ("#E8E4DC", "line", "#5F6B7F"), ("#8C97A8", "dim", "#FFFFFF"),
    ("#5F6B7F", "muted", "#FFFFFF"),
]

MEANING = [
    ("#2E7D62", "eligible", "You qualify · verified · step done", "#E8F1ED", "#1E5744", False),
    ("#BF6B3A", "urgent", "Deadline close · act soon", "#F8EDE7", "#8A4A26", False),
    ("#A8443A", "blocked", "Not eligible · expired · broken", "#F6E9E7", "#7A2F28", False),
    ("#6B7387", "unknown", "The source didn't say", "#EEF0F3", "#4C5361", True),
]

TYPE_SCALE = [
    ("display", "56 / 38", "600", "Landing hero only"),
    ("h1", "36 / 28", "600", "Page title"),
    ("h2", "28 / 23", "600", "Section"),
    ("h3", "20 / 18", "600", "Card title"),
    ("body", "16", "400", "Everything"),
    ("small", "14", "400", "Secondary"),
    ("caption", "12", "500", "Labels, metadata"),
]


def rows(data, widths):
    out = []
    for r in data:
        cells = "".join(
            f'<td style="width:{w};padding:7px 10px;border-bottom:.5px solid {LINE};'
            f'font-size:8.5pt;color:{"#162C4C" if i == 0 else MUTED};'
            f'{"font-weight:600;" if i == 0 else ""}">{c}</td>'
            for i, (c, w) in enumerate(zip(r, widths))
        )
        out.append(f"<tr>{cells}</tr>")
    return "".join(out)


def meaning_cards():
    out = []
    for solid, name, desc, tint, ink, dashed in MEANING:
        border = f"1px dashed {solid}" if dashed else f".5px solid {solid}"
        out.append(
            f'<div style="background:{tint};border:{border};border-radius:8px;'
            f'padding:11px 13px;">'
            f'<div style="display:flex;align-items:center;gap:7px;">'
            f'<span style="width:9px;height:9px;border-radius:50%;background:{solid};'
            f'display:inline-block;"></span>'
            f'<span style="font-size:9.5pt;font-weight:600;color:{ink};">{name}</span></div>'
            f'<p style="margin:5px 0 0;font-size:8pt;color:{solid};line-height:1.45;">{desc}</p>'
            f'<p style="margin:4px 0 0;font-size:7pt;color:{ink};opacity:.65;'
            f'font-family:monospace;">{solid}</p></div>'
        )
    return "".join(out)


CSS = f"""
@page {{
  size: A4;
  margin: 17mm 16mm 15mm 16mm;
  @bottom-left {{
    content: "SmartScholar — Brand Guidelines";
    font-family: Poppins, sans-serif; font-size: 7pt; color: {DIM};
  }}
  @bottom-right {{
    content: counter(page);
    font-family: Poppins, sans-serif; font-size: 7pt; color: {DIM};
  }}
}}
@page cover {{ margin: 0; @bottom-left {{ content: "" }} @bottom-right {{ content: "" }} }}

* {{ box-sizing: border-box; }}
body {{ font-family: Poppins, "DejaVu Sans", sans-serif; color: {NAVY};
        font-size: 9.5pt; line-height: 1.62; margin: 0; }}
h1 {{ font-size: 21pt; font-weight: 600; margin: 0 0 3mm; letter-spacing: -.01em; }}
h2 {{ font-size: 12.5pt; font-weight: 600; margin: 8mm 0 2.5mm; letter-spacing: -.005em; }}
h3 {{ font-size: 9.5pt; font-weight: 600; margin: 5mm 0 1.5mm; }}
p  {{ margin: 0 0 3mm; color: {MUTED}; }}
b, strong {{ color: {NAVY}; font-weight: 600; }}
code {{ font-family: "DejaVu Sans Mono", monospace; font-size: 8pt;
        background: #F2F6FA; padding: 1px 4px; border-radius: 3px; color: #1F3D63; }}
.page {{ page-break-after: always; }}
.page:last-child {{ page-break-after: auto; }}
.eyebrow {{ font-size: 7.5pt; letter-spacing: .13em; text-transform: uppercase;
            color: {GOLD}; font-weight: 600; margin: 0 0 2mm; }}
.lede {{ font-size: 10.5pt; line-height: 1.6; color: {MUTED}; margin-bottom: 6mm; }}
.rule {{ border: 0; border-top: .5px solid {LINE}; margin: 6mm 0; }}
.grid2 {{ display: flex; gap: 5mm; }}
.grid2 > * {{ flex: 1; }}
.cards {{ display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }}
.note {{ background: {PAPER}; border-left: 2.5px solid {GOLD}; border-radius: 0;
         padding: 4mm 5mm; margin: 5mm 0; }}
.note p:last-child {{ margin-bottom: 0; }}
.tile {{ border: .5px solid {LINE}; border-radius: 8px; padding: 4mm;
         text-align: center; background: #fff; }}
.cap {{ font-size: 7.5pt; color: {DIM}; margin: 2mm 0 0; }}
table {{ width: 100%; border-collapse: collapse; }}
th {{ text-align: left; font-size: 7.5pt; letter-spacing: .06em; text-transform: uppercase;
      color: {DIM}; font-weight: 600; padding: 0 10px 5px; border-bottom: .5px solid {LINE}; }}
"""


def build_html():
    today = date.today().strftime("%B %Y")

    cover = f"""
<div class="page" style="page:cover;background:{NAVY};height:297mm;padding:26mm 22mm;
     display:flex;flex-direction:column;justify-content:space-between;">
  <div>
    <img src="{asset('app-icon.svg')}" style="width:30mm;height:30mm;border-radius:7mm;">
  </div>
  <div>
    <p style="font-size:8pt;letter-spacing:.18em;text-transform:uppercase;
       color:{GOLD};font-weight:600;margin:0 0 5mm;">Brand guidelines</p>
    <h1 style="font-size:40pt;color:#fff;margin:0 0 4mm;letter-spacing:-.02em;
       line-height:1.05;">SmartScholar</h1>
    <p style="font-size:12pt;color:#93A8C4;margin:0;max-width:120mm;line-height:1.55;">
      Turning a scholarship deadline into a route a student can actually walk.
    </p>
  </div>
  <div style="border-top:.5px solid #2B527F;padding-top:5mm;display:flex;
       justify-content:space-between;font-size:8pt;color:#93A8C4;">
    <span>smartscholar.org</span><span>Version 1.0 · {today}</span>
  </div>
</div>"""

    mark = f"""
<div class="page">
  <p class="eyebrow">01 — The mark</p>
  <h1>An S drawn as a road</h1>
  <p class="lede">Lane dashes down the middle, a start node bottom-left, a waypoint
  in the belly, a gold destination top-right.</p>

  <div style="text-align:center;background:{PAPER};border-radius:10px;padding:11mm 0;margin-bottom:6mm;">
    <img src="{asset('logo-mark.svg')}" style="width:44mm;height:44mm;">
  </div>

  <p>It works because it isn't a metaphor bolted onto a letter — <b>the letter is
  the route</b>. That's the product in one shape: a deadline becomes a path with
  steps on it, and the last step is arrival rather than another search result.</p>

  <div class="note">
    <p><b>Why not a graduation cap.</b> Every scholarship site uses one, which
    makes you look like the category rather than a specific thing inside it. A cap
    also fails the practical tests below — it turns to mush at favicon size and has
    no natural motion.</p>
  </div>

  <h2>What the mark has to survive</h2>
  <table>
    <tr><th style="width:36%">Test</th><th>Why it matters</th></tr>
    {rows([
        ("Legible at 16px", "The browser tab is where people mostly see it"),
        ("Works in one colour", "Print, embroidery, WhatsApp avatars"),
        ("Reversed on dark", "Half the app is dark mode"),
        ("No gradient dependency", "Gradients die in email clients and favicons"),
        ("Animatable", "The road can draw itself — used in the launch film"),
    ], ["36%", "64%"])}
  </table>
</div>"""

    files = f"""
<div class="page">
  <p class="eyebrow">02 — Assets</p>
  <h1>Six files, one source</h1>
  <p class="lede">Everything is generated by <code>node scripts/build-brand.mjs</code>
  from <code>logo-source.svg</code>. Never hand-edit an output.</p>

  <div class="cards" style="margin-bottom:5mm;">
    <div class="tile"><img src="{asset('app-icon.svg')}" style="width:26mm;height:26mm;border-radius:6mm;">
      <p class="cap">app-icon.svg</p></div>
    <div class="tile" style="background:{NAVY};border-color:{NAVY};">
      <img src="{asset('app-icon-dark.svg')}" style="width:26mm;height:26mm;border-radius:6mm;">
      <p class="cap" style="color:#93A8C4;">app-icon-dark.svg</p></div>
    <div class="tile"><img src="{asset('logo-mark.svg')}" style="width:26mm;height:26mm;">
      <p class="cap">logo-mark.svg</p></div>
    <div class="tile" style="background:{GOLD};border-color:{GOLD};">
      <img src="{asset('favicon.svg')}" style="width:26mm;height:26mm;">
      <p class="cap" style="color:#4A3A12;">favicon.svg</p></div>
  </div>

  <div class="note">
    <p><b>Two viewBoxes, deliberately.</b> The artwork has heavy padding — the road
    occupies under half the canvas. That's correct inside an app-icon tile, where
    the OS expects margin, and badly wrong everywhere else: at 16px it leaves about
    seven real pixels of mark. Icons keep the full canvas; everything else crops
    tight.</p>
    <p style="margin-top:2.5mm;"><b>The favicon drops the lane dashes.</b> At 16px
    each dash is under a pixel wide and they grey the road into mud. The road, the
    nodes and the gold destination survive. That's a detail budget, not a second
    logo.</p>
  </div>

  <h2>Rules</h2>
  <table>
    {rows([
        ("Clear space", "Equal to the diameter of the gold node, on every side"),
        ("Minimum size", "16px. Below that, use nothing at all"),
        ("On dark", "White road, gold node kept. Gold never changes"),
        ("In the app", "Compose the mark with live text — don't use the lockup file"),
    ], ["30%", "70%"])}
  </table>

  <h3 style="color:{'#A8443A'};">Never</h3>
  <p style="margin-bottom:0;">Recolour the road · drop the gold node · add a gradient ·
  rotate the mark · stretch it · place it inside any shape other than the app-icon
  tile · set the wordmark in a face other than the brand font.</p>
</div>"""

    colour = f"""
<div class="page">
  <p class="eyebrow">03 — Colour</p>
  <h1>Navy is the voice. Gold is the reward.</h1>
  <p class="lede">Both come straight out of the logo. Everything else exists to
  support them.</p>

  <div class="grid2" style="margin-bottom:6mm;">
    <div style="background:{NAVY};border-radius:9px;padding:6mm;">
      <p style="margin:0;font-size:8pt;color:#93A8C4;">Navy — structure, text, buttons</p>
      <p style="margin:2mm 0 0;font-size:17pt;font-weight:600;color:#fff;
         font-family:'DejaVu Sans Mono',monospace;">#162C4C</p>
    </div>
    <div style="background:{GOLD};border-radius:9px;padding:6mm;">
      <p style="margin:0;font-size:8pt;color:#4A3A12;">Gold — arrival, and only arrival</p>
      <p style="margin:2mm 0 0;font-size:17pt;font-weight:600;color:#2C2208;
         font-family:'DejaVu Sans Mono',monospace;">#C6A14B</p>
    </div>
  </div>

  <p><b>Gold is rationed.</b> It appears when a student arrives at something —
  verified, eligible, matched, step completed. That's what the gold node means in
  the mark. Spray it everywhere and it stops meaning arrival, which is exactly how
  the previous teal system died.</p>

  <h2>Navy</h2>
  {swatch_row(NAVY_RAMP)}
  <p style="font-size:8pt;">Links and interactive text use <b>500 · #3B6A9E</b> —
  5.2:1 on white. The logo navy itself is too dark to read as a link.</p>

  <h2>Gold</h2>
  {swatch_row(GOLD_RAMP)}
  <div class="note" style="border-left-color:#A8443A;">
    <p><b>Never set body text in #C6A14B.</b> It's 2.1:1 on white — a contrast
    failure at every size. Use <b>700 · #8A6E2C</b> on light and
    <b>200 · #EDE0BE</b> on dark.</p>
  </div>

  <h2>Neutrals — warm, not grey</h2>
  {swatch_row(NEUTRALS, height=44)}
  <p style="font-size:8pt;margin-bottom:0;">Cold greys fight gold and make navy look
  like a corporate default. A paper-white ground makes both look chosen.</p>
</div>"""

    meaning = f"""
<div class="page">
  <p class="eyebrow">04 — Colour</p>
  <h1>Four meanings, four colours</h1>
  <p class="lede">Muted deliberately. Bright semantic colours on a navy-and-gold
  ground look like error dialogs, and this product should feel calm about a
  stressful thing.</p>

  <div class="cards" style="margin-bottom:6mm;">{meaning_cards()}</div>

  <div class="note">
    <p><b>The most important rule in this document: "unknown" is its own colour.</b></p>
    <p style="margin-top:2.5mm;">The entire trust proposition is admitting what a
    source didn't state. Most platforms fold that into a warning colour, or worse
    into the success colour, and imply the student qualifies when nobody said so.</p>
    <p style="margin-top:2.5mm;">A distinct, deliberately unexciting slate — always
    with a <b>dashed</b> border, never solid — says <i>we don't know</i> without
    saying <i>be alarmed</i>.</p>
    <p style="margin-top:2.5mm;">It is <b>not</b> amber. Amber sits next to gold, and
    gold means arrival. Two meanings competing for one hue is how a palette stops
    communicating.</p>
  </div>

  <h2>Dark mode</h2>
  <div style="background:#0D1A2D;border-radius:9px;padding:6mm;">
    <div style="display:flex;gap:4mm;">
      <div style="flex:1;background:#14263F;border:.5px solid #22374F;border-radius:7px;padding:4mm;">
        <p style="margin:0;font-size:8pt;color:#93A8C4;">Card</p>
        <p style="margin:1mm 0 0;font-size:10pt;color:#E8EEF6;font-weight:600;">#14263F</p>
      </div>
      <div style="flex:1;background:#14263F;border:.5px solid {GOLD};border-radius:7px;padding:4mm;">
        <p style="margin:0;font-size:8pt;color:{GOLD};">Gold is the constant</p>
        <p style="margin:1mm 0 0;font-size:10pt;color:{GOLD};font-weight:600;">#C6A14B</p>
      </div>
    </div>
  </div>
  <p style="font-size:8pt;margin-top:3mm;margin-bottom:0;">Ground <code>#0D1A2D</code> ·
  surface <code>#14263F</code> · line <code>#22374F</code> · text <code>#E8EEF6</code>.
  Gold does not shift between modes.</p>
</div>"""

    typography = f"""
<div class="page">
  <p class="eyebrow">05 — Type</p>
  <h1>IBM Plex Sans + IBM Plex Sans Arabic</h1>
  <p class="lede" style="margin-bottom:4mm;">One superfamily, drawn together,
  metrically harmonised.</p>

  <p>This is the <b>fourth</b> Arabic font this project has tried. The previous three
  failed for the same reason: the Arabic and Latin faces were chosen separately, so
  they never sat on a line properly. Plex removes the problem — they're one design.
  It suits the mark too: engineered rather than friendly, quietly serious, calm over
  long reading. A geometric face reads consumer-app where this brand needs
  <b>dependable</b>.</p>

  <div style="background:{PAPER};border-radius:9px;padding:4mm 5mm;margin:4mm 0;">
    <p style="margin:0 0 1mm;font-size:7.5pt;color:{DIM};">Latin · 600</p>
    <p style="margin:0 0 3mm;font-size:19pt;font-weight:600;color:{NAVY};
       letter-spacing:-.02em;line-height:1.2;">Stop searching. Start applying.</p>
    <p style="margin:0 0 1mm;font-size:7.5pt;color:{DIM};">Arabic · 400 · line-height 1.8</p>
    <p dir="rtl" style="margin:0;font-size:13pt;color:{MUTED};line-height:1.8;
       font-family:'DejaVu Sans',sans-serif;">
      المشكلة ليست أنك لا تجد المنح — المشكلة أنك تبدأ متأخراً.</p>
  </div>

  <h2>Scale — only these sizes</h2>
  <table>
    <tr><th style="width:22%">Token</th><th style="width:24%">px desktop / mobile</th>
        <th style="width:16%">Weight</th><th>Use</th></tr>
    {rows(TYPE_SCALE, ["22%", "24%", "16%", "38%"])}
  </table>
  <p style="font-size:8pt;margin-top:3mm;">Headings at <b>600, not 700</b>. Plex at 700
  is heavy enough to feel loud, and loud is the opposite of what this brand does.</p>

  <div class="note" style="border-left-color:#A8443A;">
    <p><b>16px minimum on form inputs. Non-negotiable.</b> iOS Safari zooms the page
    on any focused control under 16px and never zooms back. That single bug made
    signup feel broken on iPhone for a week.</p>
  </div>

  <h2>Arabic</h2>
  <table>
    {rows([
        ("Line height 1.8", "vs 1.6 Latin. Tailwind's default crops descenders"),
        ("No uppercase", "It does nothing in Arabic and signals nobody checked"),
        ("No letter-spacing", "It breaks the joins between letters"),
        ("Isolate numerals", "Numbers, emails and URLs stay LTR: unicode-bidi: isolate"),
    ], ["30%", "70%"])}
  </table>
</div>"""

    layout = f"""
<div class="page">
  <p class="eyebrow">06 — Layout</p>
  <h1>Rules, not measurements</h1>

  <h2>Spacing</h2>
  <p>Multiples of four only: <code>4 8 12 16 24 32 48 64 96</code>. Nothing else.
  Arbitrary values like <code>p-[13px]</code> are how a system rots.</p>

  <h2>Radius</h2>
  <table>
    <tr><th style="width:22%">Token</th><th style="width:16%">px</th><th>Use</th></tr>
    {rows([("sm", "8", "Inputs, chips"), ("md", "12", "Buttons, badges"),
           ("lg", "16", "Cards"), ("xl", "24", "Modals, hero panels"),
           ("full", "999", "Pills, avatars")], ["22%", "16%", "62%"])}
  </table>
  <p style="font-size:8pt;">The app-icon tile uses a 22.5% corner radius, matching the
  artwork. That ratio belongs to the icon — don't apply it elsewhere.</p>

  <h2>Direction</h2>
  <p><b>Logical properties only.</b> <code>ms/me</code>, <code>ps/pe</code>,
  <code>start/end</code>. Never <code>ml/mr/pl/pr/left/right</code>. The app is
  RTL-first and physical directions don't mirror — that's what put the input icons
  on top of the text in Arabic.</p>

  <h2>Breakpoints</h2>
  <p><code>xs 400</code> · <code>sm 640</code> · <code>md 768</code> ·
  <code>lg 1024</code> · <code>xl 1280</code>. <b>xs</b> exists because Tailwind's
  smallest default is 640px, which is a tablet — without it, 360–390px phones always
  got the most cramped layout.</p>

  <h2>Elevation</h2>
  <p>Shadows are navy-tinted, never pure black. Black shadows on a warm paper ground
  look dirty.</p>
  <table>
    {rows([
        ("1 · rest", "0 1px 2px rgba(22,44,76,.08)"),
        ("2 · hover", "0 6px 20px rgba(22,44,76,.10)"),
        ("3 · modal", "0 20px 44px rgba(22,44,76,.16)"),
    ], ["25%", "75%"])}
  </table>

  <p style="margin-bottom:0;font-size:8pt;">Motion is specified on the next page.</p>
</div>

<div class="page">
  <p class="eyebrow">07 — Motion</p>
  <h1>Things arrive; they don't appear</h1>
  <p class="lede">Position or scale plus a slight overshoot. A pure opacity fade is
  the clearest tell of a cheap interface.</p>

  <table>
    <tr><th style="width:22%">Speed</th><th style="width:18%">Duration</th><th>Use</th></tr>
    {rows([
        ("Fast", "150ms", "Hover, focus, colour change"),
        ("Base", "250ms", "Cards, panels, most things"),
        ("Slow", "400ms", "Page and modal transitions"),
    ], ["22%", "18%", "60%"])}
  </table>
  <p style="margin-top:3mm;">Easing <code>cubic-bezier(0.16, 1, 0.3, 1)</code> for
  entrances, <code>ease-out</code> for exits. Entrances land softly; exits leave
  quickly.</p>

  <div style="text-align:center;background:{NAVY};border-radius:10px;
       padding:9mm 0;margin:5mm 0;">
    <img src="{asset('app-icon-dark.svg')}" style="width:32mm;height:32mm;border-radius:7mm;">
    <p style="margin:4mm 0 0;font-size:8pt;color:#93A8C4;">The road draws itself,
    start node to gold destination</p>
  </div>

  <div class="note">
    <p><b>The signature motion is the road drawing itself</b> — start node to gold
    destination, about 1.8 seconds, eased at both ends, with a travelling light at
    the build point and a gold ring on arrival.</p>
    <p style="margin-top:2.5mm;">Use it for the logo reveal and for anything
    representing a completed journey. <b>Never for loading.</b> It means
    <i>progress toward a goal</i>, not <i>please wait</i>, and spending it on a
    spinner burns the one piece of motion the brand owns.</p>
    <p style="margin-top:2.5mm;">Reference implementation:
    <code>video-assets/logo.py</code>.</p>
  </div>

  <p style="font-size:8pt;margin-bottom:0;">Respect <code>prefers-reduced-motion</code>
  — cut every duration to 0.01ms. Vestibular disorders are common and the road
  animation is exactly the kind of sustained movement that triggers them.</p>
</div>"""

    voice = f"""
<div class="page">
  <p class="eyebrow">08 — Voice</p>
  <h1>Calm about something stressful</h1>
  <p class="lede">Arabic first. English is the translation, not the other way round.</p>

  <table>
    <tr><th style="width:38%">Do</th><th>Don't</th></tr>
    {rows([
        ("منحة بدون آيلتس", "فرص تعليمية متميزة"),
        ("خلال ١٩ يوماً", "قريباً"),
        ("غير مذكور في المصدر", "أنت مؤهل (when nobody said so)"),
        ("Helps you apply well", "Gets you accepted"),
    ], ["38%", "62%"])}
  </table>

  <h2>The four rules</h2>
  <p><b>Say what you don't know.</b> <span dir="rtl" style="font-family:'DejaVu Sans';">غير مذكور في المصدر</span>
  is the most important string in the product. Every competitor implies eligibility
  it can't verify; not doing that is the whole brand.</p>

  <p><b>Numbers over adjectives.</b> "Nineteen days" tells a student what to do.
  "Soon" tells them to worry.</p>

  <p><b>Never promise an outcome.</b> You help people apply well. You don't get them
  accepted, and claiming otherwise is the fastest way to lose the trust the rest of
  this document is built on.</p>

  <p><b>The student is already anxious.</b> The interface must not be. No urgency
  theatre, no countdown drama, no red where slate will do.</p>

  <hr class="rule">
  <h2>Positioning, in one paragraph</h2>
  <p style="font-size:10pt;line-height:1.7;">Students across the Arab world lose
  scholarships they qualified for — not because they miss deadlines, but because
  they start three weeks too late. Recommendation letters take six weeks. IELTS
  results take two. No listings site tells them that. SmartScholar turns any
  deadline into a dated plan and reminds you before every step.</p>
</div>"""

    impl = f"""
<div class="page">
  <p class="eyebrow">09 — Implementation</p>
  <h1>Making it real</h1>
  <p class="lede">The full token block lives in <code>BRAND-IDENTITY.md</code>, which
  is the machine-readable source of truth. This page is the order of work.</p>

  <h2>Migration order</h2>
  <table>
    <tr><th style="width:8%">#</th><th>Step</th></tr>
    {rows([
        ("1", "Paste the token block into <code>globals.css</code>"),
        ("2", "Delete every teal, brand-deep, brand-mid and accent-warm token"),
        ("3", "Add <code>unknown</code> to tailwind.config.ts"),
        ("4", "Replace the S-in-a-box placeholder in nav.tsx with logo-mark.svg"),
        ("5", "Wire favicon.svg and the app icons into layout.tsx"),
        ("6", "Load IBM Plex Sans + Sans Arabic; delete Majara and Poppins"),
        ("7", "Fix every danger-50 / success-200 class — see below"),
        ("8", "Regenerate og.png; sweep for off-scale spacing"),
    ], ["8%", "92%"])}
  </table>

  <div class="note" style="border-left-color:#A8443A;">
    <p><b>Step 7 matters more than it sounds.</b> Numeric colour scales such as
    <code>danger-50</code> and <code>success-200</code> do not exist in the Tailwind
    config and never have. Every one of them renders as nothing — which is why the
    error boxes in the auth flow appeared unstyled for months. Use alpha modifiers
    instead: <code>bg-danger/10</code>, <code>border-danger/30</code>.</p>
  </div>

  <h2>Keeping it from drifting</h2>
  <p>This identity is the fourth attempt. The first three drifted because decisions
  lived in people's heads and in scattered CSS, and because the favicon, the app icon
  and the nav logo were three files edited separately.</p>
  <p>Two safeguards now exist. <b>Every asset is generated</b> from one SVG by
  <code>scripts/build-brand.mjs</code>, so the geometry cannot diverge. And
  <b>BRAND-IDENTITY.md is authoritative</b>: if a value isn't in it, it doesn't
  exist. Change it there first, then in code.</p>

  <hr class="rule">
  <p style="font-size:8pt;color:{DIM};margin-bottom:0;">
    <b style="color:{MUTED};">Colophon.</b> Generated by
    <code>scripts/build-brand-book.py</code> from the live brand assets. Typeset in
    Poppins because IBM Plex was not installed on the build machine — the brand face
    is Plex, as specified on page 5, and this document is the one place it isn't
    used. Arabic set in DejaVu Sans for the same reason.
  </p>
</div>"""

    return (
        "<!DOCTYPE html><html><head><meta charset='utf-8'>"
        f"<style>{CSS}</style></head><body>"
        + cover + mark + files + colour + meaning + typography + layout + voice + impl
        + "</body></html>"
    )


def main():
    html = build_html()
    HTML(string=html, base_url=ROOT).write_pdf(OUT)
    size = os.path.getsize(OUT) / 1024
    print(f"\n  ✓ {OUT}  ({size:.0f} KB)\n")


if __name__ == "__main__":
    main()
