# Lumos Builder Competition — submission kit

**Early deadline: 9 August 2026 · Final deadline: 23 August 2026**
Winners announced 31 August. 10 winners × ($4,500 tuition + $1,000 cash).

> ⚠️ The competition page renders "Applications closed" alongside the open
> state in its HTML. Every date on it is still in the future, so this is almost
> certainly a CSS-toggled variant — but **email help@lumosfellows.com to confirm
> before you build a plan around it.** Ten minutes now beats a wasted fortnight.

---

## What they actually score

| Criterion | What it means | Where you stand |
|---|---|---|
| **Your work** | What you did and why | Strong — you built this solo |
| **Getting started** | How you made the idea real | Strong |
| **Results** | How your project helped | ⚠️ **Empty. This is the gap.** |
| **Problem-solving** | How you used time and tools | Strong — unusually well documented |
| **Clear story** | How clearly you explain it | The video decides this |

**"Results" needs calendar time, not effort.** You cannot generate usage numbers
in the last week. Everything below is ordered around that.

---

## The five submissions

1. Project story — 150 words max
2. **One-minute video**
3. Project links
4. Results — with numbers
5. What you did

---

## 1. Project story — draft

> Replace this with your own wording. Judges read hundreds of these and the
> ones written by a real person always read differently. Use this for the
> *structure*, not the sentences.

**Draft (147 words):**

> Students across the Arab world lose scholarships they qualified for — not
> because they missed the deadline, but because they started three weeks too
> late. Referees need six weeks' notice. IELTS results take two.
>
> I built Scholarship Hub, an Arabic-first platform that turns any scholarship
> deadline into a dated backwards plan and emails you before each step is due.
>
> The hardest problem wasn't the roadmap. It was honesty. My matcher scored
> every scholarship 66% because it treated missing eligibility data as a
> disqualification — so a student with no country data looked ineligible
> everywhere. I rebuilt it as tri-state logic: eligible, not eligible, or
> **unknown and labelled as unknown**. Missing data is now shown as "not stated
> by the source" rather than quietly implied.
>
> A tool that tells students they qualify when nobody has said so is worse than
> no tool.

**Why this structure works:** opens with the problem in human terms, states what
you built in one line, then spends over half the words on a *specific* technical
problem and the judgement call inside it. That's "problem-solving" and "clear
story" in the same paragraph.

---

## 2. The one-minute video

### Toolchain — all free

| Step | Tool | Notes |
|---|---|---|
| Screen recording | **Win + Alt + R** (Xbox Game Bar) | Built into Windows. Records the active window. Zero install. |
| More control | **OBS Studio** | Free, open source. Use if Game Bar won't capture the browser. |
| Editing | **CapCut Desktop** | Free. Auto-captions, transitions, text animation. Genuinely professional output. |
| Alternative editor | **DaVinci Resolve** | Free, more powerful, steeper learning curve. |
| Titles / motion graphics | `video-assets/titles.html` | I built this — see below. |
| Voiceover | **Your own voice** | Recommended. See note. |

**Use your own voice.** This is a builder competition. Judges scoring "your
work" and "clear story" respond to a real person explaining their own project,
accents and all. An AI voice on a solo student project reads as distance.
Record it on your phone in a quiet room with a blanket over your head — that is
not a joke, it kills the room echo and sounds better than most USB mics.

If you truly don't want your voice: Edge's Read Aloud (free, neural voices) or
ElevenLabs' free tier (10,000 characters/month).

### Script — 60 seconds

Timings are generous. Read it out loud with a stopwatch before recording.

---

**[0:00–0:08] — Cold open. Screen: your landing page, Arabic.**

> "Every year, students across the Arab world lose scholarships they were
> qualified for. Not because they missed the deadline — because they started
> three weeks too late."

*On screen: the hero. Let the Arabic sit there. Don't narrate it.*

---

**[0:08–0:18] — The gap. Screen: a competitor listing, then yours.**

> "Every scholarship site shows you the same thing: a deadline. But a deadline
> doesn't tell you that your referees need six weeks' notice, or that IELTS
> results take two."

*On screen: scroll a plain listing site, then cut to your scholarship page.*

---

**[0:18–0:32] — The differentiator. Screen: the roadmap, scrolling.**

> "So I built the plan instead. Scholarship Hub takes any deadline and works
> backwards — fifteen dated steps, ordered, with the lead times built in. If
> there isn't enough time to do it properly, it says so."

*This is your money shot. Let it breathe. Scroll slowly.*

---

**[0:32–0:42] — Personalisation. Screen: onboarding English step, then match scores.**

> "It adapts. If you already hold IELTS, the English track disappears. If you'd
> rather avoid the test entirely, scholarships that don't require one rank
> twelve points higher."

*On screen: click through the three-way English question, then show two
different match percentages.*

---

**[0:42–0:52] — Honesty. Screen: a scholarship detail page with a "not listed" field.**

> "And when the source doesn't state a requirement, it says 'not listed' — it
> never implies you qualify when nobody has said so."

*Point the cursor at an actual "not stated by the source" field.*

---

**[0:52–1:00] — Close. Screen: /dashboard/roadmap, then logo card.**

> "Arabic-first, mobile-first, and it emails you before every step is due.
> [Your domain]."

---

### Shot list — record these before you touch the editor

Record each as a separate clip. Editing is far easier with clean takes than one
long messy one.

- [ ] Landing page, Arabic, slow scroll top to bottom
- [ ] Scholarship detail page — scroll to the roadmap, pause on it
- [ ] Roadmap timeline, slow scroll through the milestones
- [ ] Onboarding — the three-way IELTS question, click each option
- [ ] Match results — two scholarships with visibly different percentages
- [ ] A "not stated by the source" field, cursor resting on it
- [ ] `/dashboard/roadmap` — the merged plan with several scholarships saved
- [ ] Phone-width view (DevTools 375px) — 3 seconds, proves mobile-first
- [ ] Language toggle — Arabic → English, one click

**Recording tips**

- Browser in fullscreen (F11). No bookmarks bar, no tabs, no dev tools visible.
- Move the mouse **slowly and deliberately.** Fast cursor movement reads as
  panic on video.
- Record at 1920×1080. Don't record a maximised window on a 4K screen — the UI
  becomes unreadable when compressed to a submission upload.
- Seed real-looking data first. Empty states make a product look unfinished.
- Do a silent pass first, then record audio separately over it. Trying to talk
  and drive at the same time is why most demo videos are bad.

---

## 3. Project links

- Live site — **required, and you don't have it yet**
- GitHub repo — make it public. Your commit history is evidence of "your work".
- `SESSION-STATUS.md` and `MANUAL-TODO.md` — these are unusually good artefacts.
  Most entrants have nothing like them.

---

## 4. Results — the part that needs time, starting now

You have none yet. Everything here needs **calendar days**, so it starts the day
you deploy, not the week you submit.

Realistic targets before 23 August:

- [ ] Deployed and publicly reachable
- [ ] 20–50 real signups from Egyptian/MENA student communities
- [ ] 5+ completed onboardings (someone actually filled the profile)
- [ ] 3+ saved roadmaps
- [ ] 1–2 written testimonials — even two sentences in Arabic, screenshotted
- [ ] Any paid review at all — one real transaction is a wildly different claim
      than zero

**Where to find those users** — free, and where your market actually is:

- Facebook groups: "منح دراسية", "الدراسة في الخارج", Egyptian university groups
- Reddit: r/Egypt, r/scholarships, r/ApplyingToCollege
- Your own school and university friends
- Telegram scholarship channels — large in Egypt and under-served

Track the numbers from day one. "43 signups in 11 days, 12 completed profiles,
6 saved plans" is a real answer to "Results". "People liked it" is not.

---

## 5. What you did

Draft the honest list. You did all of it, which is the point:

- Designed and built the whole platform solo — Next.js, TypeScript, Postgres
- Wrote the deterministic roadmap generator (no AI, no network, fully testable)
- Built the scraper and data pipeline for 234 scholarships
- Diagnosed and fixed a broken AI provider chain across four vendor failures
- Made it Arabic-first: RTL layout, Arabic typography, 195 translated records
- Found and fixed a matcher bug that scored every scholarship identically

---

## The honest risk

**Your biggest weakness is "Results", and it is the only criterion you cannot
fix in the final week.** A polished product with zero users scores worse than a
rougher product with 40 real ones and a screenshot of someone saying it helped.

Ship it. Then keep building while people use it.
