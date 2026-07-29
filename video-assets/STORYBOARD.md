# ScholarshipHub — 58s launch film

**Rendered:** `video-assets/out/scholarship-hub.mp4` · 1920×1080 · 30fps · 58.0s
**Rebuild:** `python3 video-assets/render.py yourdomain.com` (repeat until DONE) then `--encode`

---

## ⚠️ Read this before you publish it

The brief specified features that **your product does not have yet**. I built
the film as directed, but you should know exactly which shots are aspirational:

| On screen | Reality |
|---|---|
| University of Toronto / Melbourne / ETH Zurich | Your database is scraped listings — these specific programmes may not be in it |
| "92% match" acceptance probability | Your matcher outputs a fit score, not a probability of acceptance |
| Interview + Visa milestones | The roadmap generator has no interview or visa steps |
| CV section detection (Experience / Leadership / Projects) | Your AI review scores three axes; it doesn't segment a CV by section |
| "Fully funded — tuition, stipend, flights" | Funding detail isn't reliably in your scraped data |

**For the Lumos competition this matters.** Judges score "Results" and "Your
work", and a film showing capabilities you can't demo is the one thing that
can turn a strong entry into a credibility problem. Either build these before
you submit, or use the earlier honest cut for the competition and this one for
marketing once the features exist.

The universities are drawn as **monogram discs, not real logos** — those marks
are trademarked and can't ship in a promo.

---

## Timeline

| # | Scene | In | Out | Beat |
|---|---|---|---|---|
| 1 | Chaos | 0.0 | 6.5 | Search → tabs multiply → requirements swarm → collapse |
| 2 | Reveal | 6.5 | 11.0 | Logo springs in, wordmark wipes, one line |
| 3 | Match | 11.0 | 22.0 | 3 questions → AI converges → 3 cards land → re-sort |
| 4 | Eligibility | 22.0 | 31.0 | Card opens, scan, 5 ticks, HIGHLY RECOMMENDED |
| 5 | Review | 31.0 | 41.0 | CV lands, scan beam, sections light, 91/100 |
| 6 | Journey | 41.0 | 51.0 | 7 milestones fill, reminder toast, confetti |
| 7 | End | 51.0 | 58.0 | Logo, "Stop searching. Start applying.", CTA |

---

## Second-by-second

### 1 · CHAOS — 0.0–6.5s · light grey

The only light-mode scene in the film. **The cut to navy at 6.5s is the
emotional hinge** — the palette does the work of "relief" before a word is said.

| t | Action | Motion | Sound |
|---|---|---|---|
| 0.0–1.5 | Query types into the search bar, caret blinking | Per-character reveal, 3Hz caret | 22 mechanical key presses @62ms |
| 0.0–2.6 | Browser tabs multiply 1 → 8 | Each drops in with `ease_out_back`, 0.28s stagger | — |
| 1.5 | "About 4,310,000 results (0.42 seconds)" | Fade | Soft beep |
| 1.7–4.7 | Results scroll, **accelerating** (`ease_in`) | Cubic acceleration — scanning feels like labour | — |
| 2.6–4.3 | 10 requirement chips fly in from all four edges, rotated | `ease_out_back` overshoot, random angles, drop shadows | 10 pops, **rising in volume** 0.55 → 0.87 |
| 5.3–6.3 | Everything crushes to black | `ease_in` opacity to `#060914` | Falling whoosh + sub impact @5.55 |

**Camera:** static. The chaos moves; you don't. That's the point.
**Colour:** `#F0F1F5` ground, chips in `#FBBF24` / `#F87171`.

---

### 2 · REVEAL — 6.5–11.0s · navy

A held beat of near-silence. Everything that follows is calm.

| t | Action | Motion | Sound |
|---|---|---|---|
| 0.0–0.35 | Empty navy, particles drifting | Slow parallax field | Ambient pad only |
| 0.35 | Logo mark springs in | `spring(3.0, 5.5)` — overshoot then settle | Pop + low chime (G) |
| 0.75 | "ScholarshipHub" **wipes** in left→right | Rectangular mask, `ease_out_quint` | Short whoosh |
| 1.75 | "Find scholarships you'll actually get." | Rise + **blur-off** 9px → 0 | — |
| 4.0 | Light streak crosses frame | `ease_in_out` sweep | Whoosh |

**The blur-off is the detail that reads as expensive.** Text resolving from
soft to sharp looks like a camera finding focus; a plain opacity fade looks
like PowerPoint.

---

### 3 · MATCH — 11.0–22.0s

| t | Action | Motion | Sound |
|---|---|---|---|
| 0.0–0.5 | Three glass question cards stack in | 0.22s stagger, `ease_out_back` | — |
| 0.7 / 1.5 / 2.3 | Answers selected | Chosen pill fills with a **blue→violet gradient** + glow | Click + pop, ×3 |
| 2.9–4.6 | Cards fly up out of frame; particle field **converges** to centre | `converge` param pulls 150 particles inward 92% | Rising 3-oscillator AI texture + 16 data ticks |
| 3.0–4.6 | Spinner + breathing glow, "Matching 234 scholarships" | Pulse at 9Hz | — |
| 4.6–5.0 | Three result cards land | Slide from right + `ease_out_back`, 0.16s stagger | Pop + beep per card, rising pitch |
| 4.9–5.8 | Percentage rings fill and **count up** | `ease_out` over 0.9s | — |
| 6.7–7.5 | Cards **re-sort** — Toronto rises to first | `ease_in_out` slot interpolation, winner gains green glow | Whoosh |
| 7.6 | "Ranked by what you can actually win" | Rise | — |

**This is the scene that explains the product.** The re-sort is the single most
important motion in the film: it shows ranking happening rather than claiming it.

---

### 4 · ELIGIBILITY — 22.0–31.0s

| t | Action | Motion | Sound |
|---|---|---|---|
| 0.0–0.7 | Card **scales up from centre** as if the previous card opened | `ease_out_quint` on width and height | Whoosh |
| 0.8–1.8 | Scan beam sweeps the requirements | 28-segment trailing gradient | 10 data ticks |
| 1.8–3.5 | 5 checks tick in sequence | Disc pops (`ease_out_back` k=2.2), **tick strokes itself** in two segments | Beep + pop, rising pitch |
| 4.4 | **HIGHLY RECOMMENDED** badge | `spring(3.2, 6.0)`, green→cyan gradient fill, outer glow | 4-note rising arpeggio |
| 6.0 | "No guessing. It tells you where you stand." | Rise | — |

**Colour logic:** four green ticks, one amber ("Deadline in 19 days"). The
single amber is what makes the greens believable.

---

### 5 · REVIEW — 31.0–41.0s

| t | Action | Motion | Sound |
|---|---|---|---|
| 0.0–0.6 | CV lands | `ease_out_back` from below | Pop |
| 0.9–2.6 | **Scan beam** travels the document + flow lines | Trailing gradient, 5 sweeping particle lines | AI texture + 20 ticks |
| 2.7–4.2 | Four sections light up **in place** | Region expands `ease_out`, label appears above | 4 pops, rising |
| 2.7–3.0 | Feedback panel slides in from right | `ease_out_back` | — |
| 3.1–4.4 | Score ring counts **0 → 91** | `ease_out` over 1.3s | 12 fast ticks, then chime on landing |
| 3.6–4.6 | Four verdict rows + bars fill | 0.24s stagger | — |
| 7.4 | "Every document, reviewed in seconds" | Rise | — |

**Deliberate choice:** body text is grey bars, not lorem ipsum. Fake prose at
1080p invites the viewer to *read* instead of watch, and it never survives
compression.

---

### 6 · JOURNEY — 41.0–51.0s

| t | Action | Motion | Sound |
|---|---|---|---|
| 0.15 | "Every step, tracked." | Blur-off rise | — |
| 1.0–5.3 | 7 milestones fill left→right | Track draws with a **blue→green gradient**, glowing head travels with it | Beep + pop per node, rising |
| each | Node pops, tick draws itself, ripple expands | `ease_out_back` k=2.4 | — |
| 3.2 | Reminder toast slides in, leaves at 6.2 | In `ease_out_back`, out `ease_in` — exits faster than it entered | Two-note notification |
| 5.9 | **Accepted** — green node, big glow | Extra glow ring | Arpeggio + long chime |
| 5.9+ | **Confetti**, once, from the centre | Ballistic with gravity, per-piece rotation | — |
| 7.6 | "Deadlines never sneak up on you again" | Rise | — |

**Confetti fires exactly once in the whole film.** Celebration on every beat
stops meaning anything.

---

### 7 · END — 51.0–58.0s

| t | Action | Motion | Sound |
|---|---|---|---|
| 0.0 | Logo lockup | `spring(2.6, 5.0)` | Pop + long chime |
| 0.9 / 1.15 | "Stop searching." / "Start applying." | Staggered blur-off rise, second line in cyan | Two pops |
| 1.7 | Subtitle | Rise | — |
| 2.2 | **Get Started** CTA | Spring in, then **breathing glow** at 2.2Hz — never settles, so the eye stays on it | Pop |
| 3.0 | Domain | Fade | — |
| 6.2–7.0 | Slow fade to black | 0.8s — longer than every other transition, so the film lands rather than stops | Pad decays |

---

## Voiceover — 78 words

Record this yourself. On a founder-led film, a real voice outperforms any AI
narration, and for the competition the judges are scoring *you*.

| In | Line |
|---|---|
| **0.5** | "Finding a scholarship shouldn't feel like a second job." |
| **4.2** | "Thousands of results. None of them about you." |
| **7.2** | "This is ScholarshipHub." |
| **11.5** | "Answer three questions." |
| **15.0** | "Our AI ranks every scholarship by what you can actually win." |
| **22.5** | "Open one, and you know instantly if you qualify." |
| **31.5** | "Upload your CV. Get real feedback in seconds — not opinions, specifics." |
| **41.5** | "Then we track every step, and remind you before every deadline." |
| **51.5** | "Stop searching. Start applying." |

**Delivery:** calm, unhurried, slightly warm. Do **not** perform it — the
motion is already energetic; the voice should be the steady thing underneath.
Leave the gaps; silence over good motion reads as confidence.

**Recording free:** phone voice memo, in a small room, with a duvet or coat
over your head. This kills reflections better than most USB microphones. Record
each line 3× and pick.

**Mixing:** duck the existing bed by about 6dB under each line — in CapCut or
Audacity, drop the music track volume where the VO sits.

---

## Sound design as built

All synthesised from arithmetic — **no samples, nothing to license**, which
matters when the same file goes to a landing page, paid social and a pitch deck.

| Element | Where |
|---|---|
| Ambient pad — minor-9th stack, 0.055Hz swell | Whole film, ≈ −32dB |
| Mechanical key presses | Scene 1 typing |
| Rising pops | Requirement swarm, volume climbing with the pile |
| Sub impact | The collapse at 5.55s |
| 3-oscillator upward sweep | AI processing, scenes 3 and 5 |
| Data ticks | Scanning and counting |
| Two-note notification | Reminder toast |
| Rising arpeggio | Verdict badge, Accepted |
| Whooshes | Scene seams only — one per cut, never decorative |

---

## Format exports

The master is 16:9. For vertical placements:

```bash
# 9:16 for TikTok / Reels — centre crop, safe for the centred layouts
ffmpeg -i scholarship-hub.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy sh-vertical.mp4

# 1:1 for feed
ffmpeg -i scholarship-hub.mp4 -vf "crop=ih:ih,scale=1080:1080" -c:a copy sh-square.mp4

# Silent loop for a website hero — no audio, smaller file
ffmpeg -i scholarship-hub.mp4 -an -crf 26 -vf scale=1280:720 sh-hero.mp4
```

Scenes 2, 4, 6 and 7 are centre-composed and crop cleanly. **Scenes 3 and 5 are
two-column and will lose content in a 9:16 crop** — for vertical, cut those to
the left column only, or re-render with a vertical layout.

---

## What would push this further

1. **Record the voiceover.** The film is built with gaps for it. Silent, it's a
   good product demo; with a voice it's a commercial.
2. **Real screen recording for 3–5 seconds**, cut in around 35s. One shot of
   the actual product moving anchors everything else as real.
3. **Ship the missing features** in the table at the top, then this film is
   simply true.
4. **A second of black before the logo** in scene 2 — I hold 0.35s. If you want
   it more Apple, take it to 0.8s. Confidence is measured in how long you're
   willing to hold nothing.
