# SmartScholar — session status

**Everything below is on disk.** Nothing was lost.
Renamed from "Scholarship Hub" · domain **smartscholar.org**

---

## ✅ BUILD IS GREEN

`npx tsc --noEmit` — clean. `npm run build` — compiled, 39/39 pages.
`/sitemap.xml` and `/robots.txt` are both live in the route table.

### Post-build cleanup (done after your run)

- **The three red "Dynamic server usage" stack traces were never failures.**
  Next tried to prerender routes that read auth cookies, failed, and correctly
  marked them dynamic. `export const dynamic = "force-dynamic"` on those three
  routes stops it attempting at all, so the build output is clean.
- **43 `console.log` calls in the review route now gated behind `AI_DEBUG`.**
  They were logging user IDs, document IDs and storage URLs into production
  logs on every review — on a product whose documents are students' personal
  statements. Still available locally with `AI_DEBUG=true`.
- **ESLint now allows `console.warn/error/info`.** 120 warnings for deliberate
  server logging were burying three `react-hooks/exhaustive-deps` warnings that
  point at real staleness bugs (see below).

**Delete `mtest.ts` from the project root.** Scratch file; the mount wouldn't
let me remove it so it's neutralised to an empty module.

### Three real warnings worth a look, not urgent

`react-hooks/exhaustive-deps` on `dashboard/compare` (missing `ids`),
`dashboard/profile` (missing `fetchProfile`) and `user-nav` (missing
`supabase.auth`). These can serve stale data after a navigation. None of them
block launch — check them when you have a quiet hour.

---

## Done this session

| | |
|---|---|
| **Renamed to SmartScholar** | code, emails, metadata, localStorage keys, video |
| **`scripts/metrics.mjs`** | funnel + daily trend + a paste-ready Results sentence |
| **`public/og.png`** | 1200×630 social card — the link preview was blank before |
| **OG / Twitter metadata** | Arabic title + description, image wired up |
| **`src/app/sitemap.ts`** | every visible scholarship gets a URL |
| **`src/app/robots.ts`** | public crawlable, authed routes excluded |
| **Per-scholarship metadata** | all 234 pages had identical titles until now |
| **58s launch film** | new navy palette, 7 scenes, synthesised sound |
| **`LAUNCH-KIT.md`** | ready-to-paste posts, AR + EN, plus how not to get banned |

---

## Why the social work mattered more than it looks

Your plan is to post the link into Egyptian Facebook groups and Telegram
scholarship channels. **In those feeds the link preview is the ad** — bigger
than the post text, and it decides whether anyone taps.

`twitter:card` was set to `summary_large_image` **with no image**, which renders
as a grey box. That's worse than having no card at all. Fixed.

The OG image is English on purpose: PIL has no text-shaping engine and Arabic
came out with unjoined letterforms. Shipping broken Arabic on an Arabic-first
product is worse than shipping none. **The Arabic lives in the meta tags
instead**, where Facebook and Telegram do real shaping — so the headline your
users read is Arabic, and only the picture is English.

Per-scholarship metadata is the highest-value SEO here. Nobody searches
"scholarship platform"; they search *"منحة بدون ايلتس"* or *"fully funded
masters Germany 2026"*. Each detail page is a shot at one of those — but until
now all 234 inherited the same site-wide title, so Google would treat them as
duplicates of each other.

---

## Two schema gaps I found but did NOT migrate

You were asleep and both need a `db push`, so I left them documented rather
than forcing a migration you couldn't supervise.

1. **`Scholarship` has no `createdAt` / `updatedAt`.** The sitemap wants a
   `lastModified` per URL and can only fall back to `verifiedAt`, which is null
   for the ~195 unverified scraped records. Adding `updatedAt DateTime @updatedAt
   @default(now())` would give Google a real freshness signal.
2. **`Payment.status` is a free-text `String`, not an enum.** Nothing stops a
   typo becoming a permanent orphan row. `metrics.mjs` filters on
   `["approved", "paid"]` — note the Stripe webhook's `"paid"` is *Stripe's*
   `session.payment_status`, not ours; both our success paths write
   `"approved"`. I nearly shipped a comment asserting the opposite.

---

## Next, in order

1. **Buy smartscholar.org** — check whether a live site holds the `.com` first
2. Nameservers → Vercel · Zoho free for mail · Resend for transactional
3. `.env`: site URL, from-address, `CRON_SECRET`, **rotate the Groq key**
4. **Supabase bucket → private** 🔴 student CVs are publicly readable right now
5. `npx tsc --noEmit && npm run build` → deploy
6. Smoke-test on the live domain, including a real reminder email
7. **Share it the same day** — posts are written for you in `LAUNCH-KIT.md`.
   Read the etiquette section first; scholarship groups ban promo links fast,
   and losing the big Egyptian groups on day one costs you your best channel.
8. `node scripts/metrics.mjs --daily` every couple of days
9. Submit ~20 August

Full checklist with commands: `MANUAL-TODO.md`.

---

## The one thing I'd say if I could only say one

**"Results" is a scored criterion and yours is empty.** It's also the only one
that can't be fixed in the final week — 40 real users takes calendar days, not
effort.

Everything left in the 7-day plan is optimisation. Launching is not. A rougher
product with 40 students using it and one Arabic testimonial beats a polished
one with zero, and you have 24 days.

Ship it, then keep building while people use it.
