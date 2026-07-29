# Scholarship Hub — 7-Day Launch Plan

**Goal:** Take the current MVP from "broken demo" to a live product taking real money from real students by end of Day 7.

**Constraints:** Solo + Claude · 8–10 hrs/day · ~$50 hard budget ceiling · free hosting available · public launch with payments

**Start date:** _____ **Launch date:** _____ (Day 7)

---

## Part 0 — What I found in the audit

I read the codebase before writing this. These are real, verified problems, not generic advice. The plan below is built around fixing them in dependency order.

### 🔴 Launch blockers (product literally cannot serve a stranger today)

| # | Problem | Where | Why it's fatal |
|---|---------|-------|----------------|
| 1 | **Email only delivers to one address** | `.env` → Resend sandbox | Resend sandbox mode only sends to `ahmedprogrammer2010@gmail.com`. Every real user's welcome email silently fails. Signup is broken for 100% of actual users. |
| 2 | **Payment goes to a fake phone number** | `src/app/pricing/page.tsx:79` | `wa.me/201000000000` is a placeholder. Manual payment (Vodafone Cash / InstaPay) is your *only* working payment path, and it leads nowhere. |
| 3 | **Stripe not configured** | `src/app/api/checkout/route.ts:36` | Returns HTTP 503 "Card payments unavailable". No card path exists. |
| 4 | **Credits page is a dead end** | `src/app/dashboard/credits/page.tsx:41,65` | Both buttons literally say "Coming Soon". The primary monetization surface is disabled. |
| 5 | **Pricing contradicts itself in 3 places** | credits page vs pricing page vs checkout route | Credits page: `$3/review`, `$15/mo Pro`, `Enterprise Custom`. Pricing page + checkout: `1/3/5 reviews at $3/$8/$12`. A user comparing the two pages loses all trust. |

### 🟠 Security (would embarrass you publicly)

| # | Problem | Where |
|---|---------|-------|
| 6 | **Live AI API key hardcoded in source** | `src/lib/ai-review.ts:2` — `sk-bl-iecc…` committed to git |
| 7 | **Resend key + Supabase service-role key in a committed doc** | `AGENTS.md` — service-role key = full DB admin access to anyone who sees the repo |
| 8 | **Middleware uses `getSession()` not `getUser()`** | `src/middleware.ts:33` — Supabase explicitly warns this doesn't validate the JWT server-side. Auth guard is spoofable. |
| 9 | **`/admin/payments` page not covered by middleware** | `src/middleware.ts:57` matcher — only the API is protected, not the page shell |

### 🟡 Data quality (kills the feature you want to build)

| # | Problem | Detail |
|---|---------|--------|
| 10 | **41% of scholarships have no deadline** | 80 of 195 scraped entries have `deadline: null`. Deadline is your core value prop *and* the roadmap feature you want depends entirely on it. |
| 11 | **Scraped data is unverified** | 195 records pulled from for9a.com. Some links are almost certainly dead. A student who applies to an expired scholarship never comes back. |

### 🟢 Product/UX gaps (what you already flagged)

| # | Problem | Detail |
|---|---------|--------|
| 12 | **English level dropdown conflates two questions** | `src/app/onboarding/page.tsx:50` mixes proficiency (beginner/intermediate/fluent) with test types (TOEFL/IELTS) in one select. There's no "do you have a test score?", no test date, no "willing to take it?". This is exactly what you want fixed. |
| 13 | **No application roadmap / timeline** | Deadlines exist as a data field but there's no calendar, no countdown, no "what to do when" view. |
| 14 | **Applications page is a 920-line monolith** | `dashboard/applications/[scholarshipId]/page.tsx` — unmaintainable, will fight you all week |
| 15 | **Essentially no tests** | 2 test files for ~120 source files |

---

## Part 1 — The strategy behind the schedule

Three rules shape the day order:

**Rule 1 — Money path before everything.** A pretty broken product earns $0. Days 1–2 make one complete path work end-to-end: *stranger lands → signs up → gets email → completes onboarding → sees matches → uploads CV → pays → gets AI review*. Nothing else gets touched until that path is unbreakable.

**Rule 2 — Cut scope, don't cut quality.** You cannot fix 15 problems, rebuild the UI, add 2 major features, and launch in 7 days at high quality. So: **Enterprise tier is deleted, subscriptions are deleted, compare page is deleted.** One product, one price, one flow, done well.

**Rule 3 — Marketing starts Day 1, not Day 6.** Content takes time to seed. You'll start collecting waitlist emails and posting in communities from Day 1, so Day 7 launches to an audience instead of into silence.

### The scope cut (read this before you argue with it)

**Shipping:** signup → onboarding (with new IELTS/TOEFL questions) → matching → scholarship roadmap → document upload → AI review → credits purchase (manual + Stripe)

**Cutting for now:** Enterprise tier · monthly subscriptions · compare page · chat widget (unless it works flawlessly) · Arabic RTL *full* translation (keep the toggle, translate only landing + onboarding) · admin dashboard beyond the payment approval list

Cut things stay in git. You're not deleting them, you're not shipping them Day 7.

---

## DAY 1 — Stop the bleeding: security, secrets, and the money path

**Theme:** Nothing new gets built. You make the existing thing not embarrassing.

### Block 1 (2h) — Secrets purge
- [ ] Rotate the BazaarLink key. Move to `process.env.BAZAARLINK_API_KEY`, delete the hardcoded string from `src/lib/ai-review.ts:2`
- [ ] Rotate the Resend API key
- [ ] Rotate the Supabase service-role key (Supabase dashboard → Settings → API → Reset)
- [ ] Strip all three keys out of `AGENTS.md`, replace with `<set in .env>`
- [ ] Purge them from git history — `git filter-repo` or, faster and honestly fine here: since keys are now rotated, just commit the removal and move on
- [ ] Add a `.env.example` entry for every var so future-you knows what's needed
- [ ] Verify `.env` is gitignored (it is) and `git ls-files | grep env` shows only `.env.example`

### Block 2 (1.5h) — Auth hardening
- [ ] `src/middleware.ts`: swap `getSession()` → `getUser()` (validates JWT against Supabase, `getSession` just reads the cookie)
- [ ] Add `/admin/:path*` to the middleware matcher
- [ ] Add an `ADMIN_EMAIL` guard on the `/admin/payments` *page*, not just the API
- [ ] Test: log out, hit `/dashboard`, `/admin/payments`, `/onboarding` — all should bounce to login

### Block 3 (2h) — Fix email delivery ← **the biggest single blocker**
- [ ] Buy the domain now (~$1–12, Namecheap `.xyz` or `.com` — this is the one thing worth spending on). Suggested: something short, Latin-script, pronounceable in both Arabic and English
- [ ] Add the domain to Resend → verify via DNS (SPF, DKIM, DMARC records). Takes 15 min to add, up to a few hours to propagate — **which is exactly why this is Day 1 not Day 6**
- [ ] Switch the `from:` address to `noreply@yourdomain.com`
- [ ] Send a test welcome email to a *different* address (a friend's, a burner). If it lands, signup works for strangers for the first time.

### Block 4 (2h) — Unify pricing and unbreak payment
- [ ] Pick ONE price table. Recommendation:
  - **1 review — $3** · **3 reviews — $8** (mark "Popular") · **5 reviews — $12**
  - Delete the $15/mo Pro tier and Enterprise entirely from the UI
- [ ] Extract it to `src/lib/pricing.ts` as a single exported constant. Import it in the pricing page, the credits page, and the checkout route. **One source of truth — this class of bug should be impossible after today.**
- [ ] Rewrite `dashboard/credits/page.tsx` to render from that constant with working buttons (no more "Coming Soon")
- [ ] Replace the fake WhatsApp number with your real one
- [ ] Consider EGP-equivalent display alongside USD — $3 reads differently in Cairo than in Dubai. Show both.

### Block 5 (1h) — Marketing seed (do this every day)
- [ ] Register handles: Instagram, TikTok, X, plus a Telegram channel. Same name as the domain.
- [ ] Join 10 Arabic scholarship Facebook groups (search "منح دراسية", "المنح الدراسية", "دراسة في الخارج"). Many have 100k+ members. **Join today — approval takes 1–3 days, and you need to be a member before you can post on Day 6.**
- [ ] Don't post anything yet. Read. Note the 10 most-asked questions — that's your content calendar and your FAQ page.

### Block 6 (0.5h) — Wrap
- [ ] `npx tsc --noEmit` → zero errors. Commit. Push.

**Day 1 done means:** No secrets in git. Auth is real. Email reaches strangers. Pricing is consistent and the buy button works.

---

## DAY 2 — Fix the data, finish the money path

**Theme:** Make the product's core claim (finding real scholarships) actually true.

### Block 1 (3h) — Scholarship data cleanup
This is unglamorous and it is the highest-leverage work of the week.
- [ ] Write a script that flags every scholarship with `deadline: null` (80 records)
- [ ] For each: open `sourceUrl`, find the real deadline, fill it in. If the scholarship is expired or the link is dead → mark `isActive: false` (add the field) rather than deleting
- [ ] Add `deadline` + `isActive` filters to the scholarships query so dead entries never surface
- [ ] **Accept the tradeoff:** 120 verified, accurate scholarships beat 234 where a third are wrong. Quality is the moat here — for9a.com already wins on volume.
- [ ] Add an `applicationOpenDate` field where you can find it — the roadmap feature on Day 4 needs it

*If you run out of time: prioritize the 40 most prestigious/popular scholarships (Chevening, Fulbright, DAAD, Erasmus Mundus, Turkiye Burslari, MEXT, Chinese Government, KAUST). Those are what people search for.*

### Block 2 (2h) — Stripe live
- [ ] Create the Stripe account, complete verification (Egypt is supported via Stripe Atlas or a supported-country entity — **if Stripe rejects you, don't burn a day fighting it**; manual payment + Paymob/Fawry later is a fine Day-7 answer)
- [ ] Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to env
- [ ] Test the webhook with the Stripe CLI: does a completed checkout actually increment `user.reviewCredits`? Read `src/app/api/stripe/webhook/route.ts` carefully — verify it's idempotent (Stripe retries; you don't want to grant credits twice)
- [ ] Test a real $3 charge on yourself. Refund it.

### Block 3 (2h) — Manual payment flow, done properly
Manual payment will be the majority of your revenue in MENA. Treat it as a first-class flow, not a fallback.
- [ ] Build a real manual-payment page: choose package → shows your Vodafone Cash / InstaPay number → "I've paid" button → creates a `Payment` row with `status: pending` and a reference field
- [ ] User uploads a screenshot of the receipt (you already have Supabase storage working)
- [ ] Admin page lists pending payments with the screenshot → one-click approve → increments credits → sends a "credits added" email
- [ ] Test the whole loop yourself end-to-end

### Block 4 (1.5h) — End-to-end smoke test as a stranger
- [ ] Open an incognito window. Use an email you've never used. Go through: land → signup → receive email → login → onboarding → dashboard → view matches → upload a CV → buy credits → get an AI review.
- [ ] Write down every single thing that breaks, confuses, or looks wrong. **This list is your Day 3 and Day 5 backlog.** Don't fix as you go — just log it.

### Block 5 (0.5h) — Marketing
- [ ] Build a dead-simple waitlist landing page or just add an email capture to the existing hero: "Launching in 5 days — get 3 free reviews at launch"
- [ ] Post once in 2 Facebook groups: *not* promotion. Answer someone's question thoroughly and helpfully. Build the account's credibility before you ever ask for anything.

**Day 2 done means:** Data you'd stake your reputation on. Both payment paths work. You have a written list of everything wrong with the UX.

---

## DAY 3 — The UI rebuild

**Theme:** You said the UI is bad. Today it stops being bad. Focus on the 5 screens that matter — ignore the rest.

The five screens: **Landing · Onboarding · Dashboard · Scholarship detail · Review results**

### Block 1 (1h) — Design decisions, made once
- [ ] Lock the design system. You have `design-system.md` (blue) and the code has drifted to teal. **Pick teal, update the doc, never think about it again.**
- [ ] Fix the type scale. Pick one font pairing and stop. Suggestion: keep Poppins for headings, add Tajawal for Arabic (you already load it).
- [ ] Rule for the day: **no gradients on gradients, one accent colour, generous whitespace, real content in every state.** Most "bad UI" is actually cramped spacing and inconsistent radii, not bad colours.

### Block 2 (2.5h) — Landing page rebuild (`src/app/page.tsx`, currently 569 lines)
Structure that converts for this audience:
1. **Hero** — headline in Arabic *and* English. Not "AI-Powered Scholarship Platform" (meaningless). Try: *"Find the scholarships you can actually win."* Sub: what it does in one sentence. One CTA button.
2. **Social proof strip** — "234 scholarships · X students matched". Use real numbers, even small ones.
3. **How it works** — 3 steps, icons, 10 words each
4. **The differentiator** — a screenshot of the fit-score + roadmap. This is what for9a.com doesn't have. Lead with it.
5. **Sample scholarships** — 6 real cards. Let people see the goods before signing up.
6. **Pricing** — the 3 packages, from `pricing.ts`
7. **FAQ** — the 10 questions you collected from Facebook groups on Day 1
8. **Footer** — real links, contact, socials

### Block 3 (2h) — Dashboard rebuild
- [ ] Above the fold answers one question: **"what do I do next?"** Not stats. A single primary action card.
- [ ] Then: next 3 deadlines with countdowns · top 5 matches with fit scores · document progress
- [ ] Real empty states with a CTA — never a blank panel
- [ ] Loading skeletons everywhere (`src/components/ui/skeleton.tsx` exists — use it)

### Block 4 (2h) — Scholarship detail + review results
- [ ] Detail page: fit score ring prominent, **why you match / why you don't** (the matcher already returns `reasons` and `disqualifiers` — surface them, this is your differentiator), deadline countdown, required documents checklist, apply CTA
- [ ] Review results page: score up top, then strengths / weaknesses / top improvements as scannable cards. Currently it's a wall of text.

### Block 5 (1h) — Mobile + dark mode pass
- [ ] **Test every screen at 375px width.** Your audience is overwhelmingly on phones. If it's broken on mobile it's broken.
- [ ] Dark mode: check every screen for hardcoded `bg-white` / `text-black`. `git log` shows you fought this already — finish it.

### Block 6 (0.5h) — Marketing
- [ ] Record 3 short vertical videos on your phone (Arabic): "3 scholarships open right now for Egyptian students", "The #1 mistake in scholarship personal statements", "How to know if you qualify before you waste 3 hours applying"
- [ ] Don't post yet. Bank them for Days 6–7.

**Day 3 done means:** Five screens you're not embarrassed to put in front of 10,000 people. Mobile works.

---

## DAY 4 — The new features

**Theme:** The two things you specifically asked for.

### Block 1 (3h) — Onboarding rebuild with proper English-test questions
The current dropdown mixes proficiency with test type. Split it into a real branch:

```
Q1: Do you have an English test score?
    ├─ Yes → Which? [IELTS / TOEFL / Duolingo / PTE / Cambridge]
    │        → Score: ___   → Test date: ___
    │        → (flag if expiring within 6 months — most scholarships require ≤2yr validity)
    ├─ No, but I'm willing to take one
    │        → When could you take it? [<1mo / 1-3mo / 3-6mo / 6mo+]
    │        → Estimate your current level: [Beginner→Native]
    └─ No, and I'd prefer scholarships that don't require one
             → (this is a real segment — many German, Turkish, Chinese, and Egyptian
                government scholarships don't need IELTS. Big underserved niche.)
```

- [ ] Add to `UserProfile` schema: `hasEnglishTest`, `englishTestType`, `englishTestScore`, `englishTestDate`, `willingToTakeTest`, `testTimeframe`
- [ ] Migrate: `prisma migrate dev`
- [ ] Update `scholarship-matcher.ts` — an actual IELTS 7.0 should score very differently from "I'm willing to take a test someday". Add a `readinessScore` distinct from `fitScore`.
- [ ] **This is a genuine differentiator.** "Show me scholarships I can apply to *without* IELTS" is a query nobody serves well and thousands of students search for.

**While you're in there, add these too** (cheap, high signal for matching):
- Nationality vs country of residence (different — matters for eligibility)
- Current GPA scale (4.0 / 5.0 / percentage — you're currently storing a bare float, which is ambiguous and silently wrong)
- Graduation year
- Preferred destination countries (multi-select)
- Financial need level

### Block 2 (3.5h) — Scholarship roadmap with dates ← the feature you asked for
The single most valuable thing you can build. Nobody in this market does it well.

For any scholarship a user saves, generate a **backwards-planned timeline** from the deadline:

```
Deadline: March 15, 2027
────────────────────────────────────────────────
Nov 15  │ ⬤ Start IELTS prep            [12 weeks out]
Dec 20  │ ○ Take IELTS                   [book by Dec 1]
Jan 05  │ ○ Request recommendation letters  ← give referees 6 weeks
Jan 15  │ ○ Draft personal statement
Jan 25  │ ○ AI review round 1
Feb 05  │ ○ Revise + AI review round 2
Feb 15  │ ○ Order official transcripts   ← universities are slow
Mar 01  │ ○ Final review, everything assembled
Mar 08  │ ○ SUBMIT (one week early — servers crash on deadline day)
Mar 15  │ ⬤ DEADLINE
```

- [ ] Build `src/lib/roadmap-generator.ts` — takes a scholarship + user profile, returns dated milestones
- [ ] Rules engine: work backwards from deadline. Required docs come from `scholarship.requiredDocuments`. Skip the IELTS block if the user already has a valid score. Add a research-proposal block for PhD applications. Compress the timeline (with a warning) if the deadline is close.
- [ ] Milestones are checkable and persist — new `RoadmapMilestone` model
- [ ] Views: **timeline** (per scholarship) and **calendar** (all scholarships merged, this month)
- [ ] Overdue milestones go red. Show "you are X days behind."
- [ ] Email reminder hook — 7 days before each milestone (you have Resend working now)

*This feature alone is worth more than the AI review. It turns a one-time lookup into a tool people open weekly.*

### Block 3 (1.5h) — Wire it together
- [ ] "Save scholarship" → auto-generates the roadmap
- [ ] Dashboard shows the next 3 milestones across all saved scholarships
- [ ] Test with a deadline 3 weeks out and one 8 months out — both must produce sane timelines

### Block 4 (0.5h) — Marketing
- [ ] Write the Product Hunt draft: tagline, description, first comment
- [ ] Write the Arabic launch post for Facebook groups

**Day 4 done means:** Onboarding asks smart questions. Roadmaps generate. You have something for9a.com doesn't.

---

## DAY 5 — Harden, test, and make it real

**Theme:** Break it before 10,000 strangers do.

### Block 1 (2h) — Work the Day 2 bug list
- [ ] Fix everything you logged during the Day 2 stranger walkthrough. Most will be small.

### Block 2 (2h) — Error handling and edge cases
Go through these deliberately — every one will happen in week one:
- [ ] AI review API fails / times out → user must not lose their credit. Refund on failure. (Your git history is full of AI-call failures — assume it fails.)
- [ ] User uploads a 50MB file → size limit with a clear message
- [ ] User uploads a corrupt PDF or a scanned image → graceful message, not a 500
- [ ] Empty states everywhere: no matches, no documents, no saved scholarships, no payments
- [ ] Rate limit `/api/documents/[id]/review` and `/api/chat` — one abusive user could drain your AI budget overnight
- [ ] Global error boundary + a real 404 page
- [ ] Every API route returns a user-readable error, never a raw stack trace

### Block 3 (1.5h) — Tests on the paths where bugs cost money
You have 2 test files. You don't need 200. You need ~15 covering:
- [ ] `scholarship-matcher.ts` — disqualifiers, age boundaries, GPA scales
- [ ] `roadmap-generator.ts` — near deadlines, far deadlines, missing dates
- [ ] Credit deduction and refund-on-failure logic
- [ ] Stripe webhook idempotency
- [ ] `npm test` green

### Block 4 (1.5h) — Performance, SEO, analytics
- [ ] `npm run build` — must pass clean
- [ ] Lighthouse on landing + dashboard. Target 85+ mobile performance.
- [ ] **Every scholarship gets a static SEO page** — you have 120+ verified scholarships. That's 120 indexed pages targeting "[scholarship name] eligibility / deadline / how to apply". This is your compounding free traffic channel. Add `generateMetadata` per page, plus JSON-LD structured data.
- [ ] `sitemap.xml` + `robots.txt`
- [ ] OG images so shared links don't look dead
- [ ] Plausible or GA4 (`src/components/analytics.tsx` exists — verify it fires). Track: signup, onboarding complete, match viewed, doc uploaded, checkout started, purchase.
- [ ] Legal: your privacy policy and terms pages exist — make sure they mention AI processing of uploaded documents and are actually accurate

### Block 5 (2h) — Deploy to production
- [ ] Deploy to Vercel free tier (do this even if your relative offers hosting — Vercel's free tier handles Next.js properly and costs nothing; use the relative's hosting as backup)
- [ ] Point the domain, verify SSL
- [ ] All env vars set in production
- [ ] Run migrations against production DB
- [ ] Seed the cleaned scholarship data
- [ ] **Full stranger walkthrough again — on the live production URL, on your actual phone**

### Block 6 (0.5h) — Marketing
- [ ] Beta invite to 10 real students you know personally. Ask for one thing: *"Try to buy a review and tell me where you got confused."*

**Day 5 done means:** Live on a real domain. Tested. Doesn't lose money when things fail.

---

## DAY 6 — Marketing assets and the soft launch

**Theme:** Build the ammunition, then fire the first shot.

### Block 1 (2h) — Fix what the 10 beta testers found
- [ ] Their confusion is data. Fix the top 5 things. Do not add features.

### Block 2 (2.5h) — Content assets
- [ ] **Landing page copy in Arabic** — not machine-translated. Write it yourself. Your audience is Arabic-first; this doubles conversion.
- [ ] **3 SEO blog posts**, targeting real searches:
  - "منح دراسية بدون آيلتس 2026" (scholarships without IELTS) — links straight to your new filter
  - "Fully funded scholarships for Egyptian students 2026"
  - "How to write a scholarship personal statement (with a real example)"
- [ ] **10 social posts** scheduled: 5 Arabic, 5 English. Mix: scholarship-of-the-day, deadline alerts, tips, one product post. **9:1 value-to-promotion ratio** — MENA Facebook groups will ban you instantly for spam.
- [ ] Finish the 3 TikTok/Reels videos from Day 3. Post the first one today.

### Block 3 (1.5h) — Directory and backlink submissions
Free, permanent, compounding. Submit to:
- [ ] Product Hunt (schedule for Day 7, 12:01am PT)
- [ ] BetaList, AlternativeTo, SaaSHub, Uneed, Startup Stash, There's An AI For That, Futurepedia
- [ ] Reddit: r/SideProject, r/InternetIsBeautiful (Day 7)
- [ ] Arabic startup directories and university student-union pages
- [ ] Your own Telegram channel — post the first scholarship digest

### Block 4 (1.5h) — Soft launch
- [ ] Post in the **3 friendliest** Facebook groups (the ones where you've been genuinely helping since Day 1). Not a sales post — a value post: *"I built a free tool that shows which scholarships you actually qualify for based on your profile. 120 verified scholarships, deadlines included. Free to try — feedback welcome."*
- [ ] Post to your Telegram + personal socials
- [ ] **Sit and watch analytics live.** Where do people drop off? That's your Day 7 morning fix list.

### Block 5 (1h) — Launch-day prep
- [ ] Write every Day 7 post in advance. On launch day you're responding, not writing.
- [ ] Set up a support inbox and a WhatsApp number you'll actually answer
- [ ] Prepare a launch offer: **first 100 users get 3 free reviews** (cost: ~$0 in AI credits, huge in conversion)
- [ ] Add a "🎉 Launch week: 3 free reviews" banner, ready to toggle on

### Block 6 (0.5h) — Monitoring
- [ ] Vercel alerts on. Error tracking on (Sentry free tier). Set a hard spend cap on your AI provider.

**Day 6 done means:** Content banked, directories submitted, first real users through the door, a fix list for tomorrow.

---

## DAY 7 — Launch

**Theme:** Execute. Do not build.

### Block 1 (1h) — Morning fixes only
- [ ] Fix only what's actively breaking from yesterday's traffic. **Zero new features. Zero refactoring.** The temptation will be enormous. Resist it.

### Block 2 (1h) — Fire everything
- [ ] Product Hunt goes live (12:01am PT — set an alarm; timing is most of PH ranking)
- [ ] Post in all 10 Facebook groups (**stagger over 4 hours** — simultaneous posts across groups trips spam filters)
- [ ] X/Twitter thread: the build story. "I built this in 7 days because [personal reason]" outperforms feature lists.
- [ ] LinkedIn post — reaches counselors, professors, and university staff who forward things
- [ ] Telegram, Instagram, TikTok (all 3 videos), WhatsApp status
- [ ] Reddit: r/SideProject + relevant country subs
- [ ] Email the waitlist you've been collecting since Day 2

### Block 3 (4h) — Live response
This is the actual work of launch day.
- [ ] **Reply to every single comment within 15 minutes.** Engagement velocity drives Product Hunt ranking and Facebook group reach.
- [ ] Watch analytics in real time. If everyone drops at onboarding step 3, fix that step *today*.
- [ ] DM everyone who signs up: *"Hey, thanks for trying it — what were you hoping it would do?"* You will learn more from 20 of these than from any analytics dashboard.
- [ ] Hotfix breakages immediately

### Block 4 (1.5h) — Second wave
- [ ] Post in the remaining groups you were saving
- [ ] Reach out to 5 Arabic education influencers / scholarship-page admins with a genuine offer (free unlimited credits for their audience, affiliate cut)
- [ ] Email 10 university career offices in Egypt/Jordan/Morocco

### Block 5 (1h) — Measure
Numbers to record at end of Day 7:

| Metric | Target | Actual |
|--------|--------|--------|
| Visitors | 500–2,000 | |
| Signups | 50–200 | |
| Onboarding completion rate | >60% | |
| Documents uploaded | 20–80 | |
| **Paying customers** | **3–15** | |
| Revenue | $10–100 | |

Be honest about these. A soft launch that gets 3 paying customers is a *real* validation signal — that's 3 strangers who trusted you with money. Most launches get zero.

### Block 6 (0.5h) — Week 2 plan
Write down the top 5 things users asked for. That's your next sprint, and it will be better than anything you'd have guessed.

---

## Part 2 — Things that will go wrong (and what to do)

| Risk | Likelihood | Response |
|------|-----------|----------|
| **Stripe rejects an Egypt-based account** | High | Don't fight it. Ship manual payment only. Add Paymob or Fawry in week 2 — they're better for this market anyway. |
| **Resend domain verification is slow** | Medium | That's why it's Day 1 Block 3. If DNS is still propagating Day 3, buy the domain from a registrar with instant DNS (Cloudflare). |
| **Data cleanup eats all of Day 2** | High | Cap it at 3 hours. Ship 40 perfect scholarships over 195 mediocre ones. |
| **Roadmap feature balloons past Day 4** | High | Ship v1 as a static checklist with dates. Calendar view and email reminders can wait for week 2. |
| **AI provider fails under real load** | Medium | Refund-on-failure is built Day 5. Have a second provider key ready as fallback. |
| **Facebook groups ban you for promotion** | Medium | Genuinely help for 5 days before promoting once. Never post the same text in two groups. Never post the link in the first line. |
| **Zero traction on launch day** | Medium | Normal. Launch day is a data-collection event, not a revenue event. The SEO pages you built Day 5 compound for months. |

## Part 3 — Budget

| Item | Cost |
|------|------|
| Domain (.xyz or .com, first year) | $1–12 |
| Hosting (Vercel free tier) | $0 |
| Supabase free tier | $0 |
| Resend free tier (3,000 emails/mo) | $0 |
| AI credits for reviews | ~$5–15 |
| Everything else | $0 |
| **Total** | **~$20–30** |

Comfortably under $50, with headroom if something breaks.

## Part 4 — What NOT to do this week

Writing these down so you can point at them when tempted:

- ❌ Don't refactor the 920-line applications page. It's ugly, it works, it's not what's blocking you.
- ❌ Don't add a mobile app, or a chat feature, or a community forum
- ❌ Don't translate the entire site to Arabic. Landing + onboarding only.
- ❌ Don't build an admin dashboard beyond the payment approval list
- ❌ Don't chase 100% test coverage
- ❌ Don't redesign anything after Day 3
- ❌ Don't add new features after Day 4

---

## The one-line summary of each day

| Day | Focus | Success looks like |
|-----|-------|--------------------|
| **1** | Secrets, auth, email, pricing | Email reaches strangers. Buy button works. No keys in git. |
| **2** | Data quality + payments | Every scholarship is real. Both payment paths tested end-to-end. |
| **3** | UI rebuild | 5 screens you'd show anyone. Mobile works. |
| **4** | Roadmap + IELTS onboarding | The two features that make you different from for9a.com. |
| **5** | Harden + deploy | Live on your domain. Tested. Fails gracefully. |
| **6** | Marketing assets + soft launch | Content banked, directories submitted, first real users. |
| **7** | Launch | Fire everything. Respond to everyone. Count what happened. |

---

*Plan generated from an audit of the actual codebase, July 2026. Item numbers in Part 0 reference real files and line numbers — start there.*
