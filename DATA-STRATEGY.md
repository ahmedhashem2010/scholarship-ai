# Scholarship Data Strategy — how to actually win MENA

**The question:** how do we build the largest, best scholarship database in MENA
without being a worse copy of for9a?

**Short answer:** stop ingesting *aggregators* and start ingesting *providers*.
Then compete on freshness and accuracy, which is where every aggregator is weak.

---

## First, a hard truth about the goal

"Biggest database in MENA" is a fine ambition, but as a *launch* goal it's a trap.

for9a already has volume. If your pitch is "more listings," you're competing on
their strongest axis with a fraction of their head start, and every listing you
add is another one you have to keep accurate.

Here's what actually happens to a student using scholarship aggregators today:

1. They search and get 200 results
2. Half are expired
3. A third don't accept their nationality
4. They spend 3 hours reading before finding one they can actually apply to

**Volume is not the bottleneck for the user. Trust is.**

So the sequencing that wins:

> **Accurate first → relevant second → big third.**

Get to 150 scholarships a student can *trust completely*, then scale. A database
of 5,000 where 40% are wrong is worth less than 150 that are right, because the
first wrong one destroys belief in all the others.

You'll still get to "biggest" — the sources below have far more than 195 records
in them. But ordering it this way means every record you add is defensible.

---

## The three tiers

### Tier 1 — Official providers (your moat) 🥇

**~50 programmes cover perhaps 80% of what MENA students actually search for.**

These are government and foundation programmes with real money, published on
their own websites, in a stable format, updated annually.

**Governments & national agencies**

| Programme | Country | Notes |
|---|---|---|
| Türkiye Bursları | Turkey | Enormous in MENA. Single annual window |
| DAAD | Germany | ~100 sub-programmes in their database |
| Chevening | UK | Annual, fixed cycle |
| Commonwealth Scholarships | UK | |
| Fulbright (per-country) | USA | Separate commission per MENA country |
| Erasmus Mundus Joint Masters | EU | ~180 courses, each its own deadline |
| MEXT | Japan | Via embassies — per-country deadlines |
| Chinese Government Scholarship (CSC) | China | |
| Korean Government (GKS) | Korea | |
| Campus France / Eiffel | France | |
| Holland Scholarship / NL-OKP | Netherlands | |
| Swedish Institute | Sweden | |
| Australia Awards | Australia | Explicitly targets developing countries |
| Russian Government Quota | Russia | Popular in Egypt/Syria |
| Hungary Stipendium Hungaricum | Hungary | Big MENA intake, underrated |
| Romanian/Polish/Czech govt schemes | EU | Underrated, low competition |

**Foundations & regional funders — these are your MENA differentiator**

| Programme | Notes |
|---|---|
| Abdullah Al Ghurair Foundation | UAE, explicitly Arab students |
| Mastercard Foundation Scholars | Africa incl. Egypt/Sudan/Morocco |
| Aga Khan Foundation ISP | Strong MENA presence |
| Said Foundation | Syria, Jordan, Lebanon, Palestine |
| Alwaleed Philanthropies | |
| Qatar Foundation / HBKU | |
| KAUST | Saudi, fully funded, high value |
| MBZUAI | UAE, AI-focused, fully funded |
| Open Society Foundations | |
| Hariri Foundation | Lebanon |
| Welfare Association / Taawon | Palestine |
| Arab Fund (AFESD) | Pan-Arab |
| Islamic Development Bank (IsDB) | **Specifically for member states — hugely relevant, almost nobody indexes it well** |

**Why this tier is a moat:** it's boring, unglamorous compilation work that
takes weeks. Competitors haven't done it properly because scraping an aggregator
is faster. That's exactly why it's defensible.

**Effort:** ~15–20 hours to compile the first 50 properly. Then ~2 hours/month
to maintain.

### Tier 2 — Universities (scale) 🥈

Once Tier 1 is solid, scale through institutions. Every university with
international students publishes a scholarships page.

Target list, in order of MENA relevance:
- Turkish, Malaysian, Egyptian and Gulf universities (closest, cheapest, most applied-to)
- German, Dutch, Italian, Hungarian publics (low/no tuition)
- UK/US/Canada (aspirational, high search volume)

This is where you go from 150 → 2,000+. It's also where a **semi-automated
pipeline** earns its keep: fetch page → LLM extracts structured fields → human
approves in a queue. One person can clear 100+ records/day that way.

### Tier 3 — Inbound supply (compounding) 🥉

The tier that makes you bigger than for9a *without more work*.

1. **"Submit a scholarship" form** — free listings. Universities and NGOs
   actively want applicants; they'll submit to you once you have traffic.
2. **"Report an error" button on every listing** — your users become your QA
   team. This is how Google Maps got accurate.
3. **University partnerships** — international offices will feed you data in
   exchange for reaching Arab applicants.
4. **Embassy & cultural mission newsletters** — many announce scholarships by
   email before they hit any aggregator. **Being first is a real edge.**

---

## The actual moat: freshness, not size

Every aggregator in this space has the same rot problem — listings go stale and
nobody notices. You already saw it in your own data: expired records still
showing, deadlines that were never captured.

**Build monitoring in from the start:**

- Re-check every active scholarship's source URL on a schedule (weekly for
  Tier 1, monthly for Tier 2)
- Detect: page 404s, deadline text changed, "applications closed" appearing
- Flag changes into an admin review queue
- Show the user **"Verified 3 days ago"** on every listing

That badge is the single most persuasive thing on your site, and for9a can't
easily copy it because they'd have to admit how stale they are.

The `isVerified` / `verifiedAt` fields I added on Day 2 exist for exactly this.

---

## Legal footing

You were right to be uneasy about scraping competitors. The distinction that
matters:

**Facts are not copyrightable. Prose is.**

- ✅ A deadline, eligible countries, degree levels, GPA minimums, award amounts
  — these are facts. Compiling facts from public sources is standard practice
  for every directory and job board.
- ❌ Copying an aggregator's *written description* verbatim is copying their
  creative work. Your current DB is full of for9a's prose.
- ⚠️ Systematically harvesting a competitor's *whole database* can breach their
  terms of service regardless of copyright — separate risk from copyright.

**Practical rules:**

1. Take data from the **provider**, not the aggregator, wherever possible
2. Extract **facts**, write your **own** descriptions (an LLM can rewrite 195 in
   an afternoon)
3. Respect `robots.txt` and rate limits
4. Always store and display `sourceUrl` — link back to the official page
5. Never claim a scholarship is yours to award

**Action item:** your 195 scraped records currently carry for9a's description
text. Before you scale marketing, rewrite those descriptions. It's cheap, and it
removes both the legal exposure and the duplicate-content SEO penalty that's
currently capping your search rankings.

---

## Recommended sequencing

### ❌ NOT during the 7-day launch sprint

Building a real data pipeline is a 4–8 week programme. Starting it now means you
don't launch, and you learn nothing about whether students will pay you.

**For launch you need ~150 accurate, MENA-relevant scholarships. Not 5,000.**

### ✅ During the sprint (cheap, high leverage)

| When | Task | Time |
|---|---|---|
| Day 2 (now) | Finish the re-scrape, deactivate US-domestic and irrelevant records | 30 min |
| Day 2 (now) | Cull to what's genuinely MENA-relevant — quality over count | 30 min |
| Day 4 | **"Submit a scholarship" form** — starts collecting supply from launch day | 2 h |
| Day 4 | **"Report an error" button** on every listing | 30 min |
| Day 5 | Show `verifiedAt` on listings — trust signal | 30 min |

That's ~4 hours total, and it means launch day starts the flywheel instead of
waiting for it.

### 📅 After launch

**Week 2–3 — Tier 1**
Compile the ~50 official programmes by hand. This is the highest-value work in
the entire project. Do it yourself; don't delegate or automate it. You'll learn
more about your market from reading 50 scholarship pages than from any research.

**Week 4–6 — the pipeline**
Build the ingest → LLM extract → human approve queue. Then Tier 2 at scale.

**Week 6+ — monitoring + inbound**
Scheduled re-verification, error reports, university partnerships.

---

## Reframe worth considering

Right now the product says: *"here are scholarships."*

With Tier 1 done plus the roadmap feature, it can say:

> **"Here are the 12 scholarships you can actually win this year, when each one
> opens, and exactly what to prepare — starting today."**

for9a cannot say that. It requires accurate deadlines, real eligibility data,
and the roadmap generator — all three of which you're building this week.

That's a much stronger position than "we have more listings," and it's the one
students will pay for.
