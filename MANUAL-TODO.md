# SmartScholar — manual to-do

> Renamed from "Scholarship Hub" on 27 July. Domain: **smartscholar.org**

---

## 🚀 LAUNCH SEQUENCE — do these in this order

Everything below is blocked by the step above it. Nothing else matters until
this list is done, because **"Results" is a scored competition criterion and it
needs calendar days, not effort.**

### 1 · Buy smartscholar.org  ⏱ 10 min
Namecheap, Porkbun or Cloudflare Registrar. ~$10–14/yr for .org.
**Check first:** is `smartscholar.com` held by a live site? If someone active
owns it you'll fight them in search forever — worth knowing before you commit.

### 2 · Point DNS at Vercel  ⏱ 5 min + propagation
Add the domain in your Vercel project, then set your registrar's nameservers to
the two Vercel gives you (`ns1.vercel-dns.com` / `ns2.vercel-dns.com`).
Allow up to 48h, though it's usually minutes.

### 3 · Email — Zoho only  ⏱ 20 min
**Resend has been removed from the codebase.** Everything now goes through
`care@smartscholar.org` on Zoho over SMTP: confirmation links, deadline
reminders, payment receipts.

- [ ] **Install the new dependency** — `npm install` (adds `nodemailer`)
- [ ] **Generate a Zoho app password.** Zoho Account → Security → App Passwords.
      With 2FA on, your normal login password will **not** authenticate over
      SMTP. This is the single most common way this setup fails.
- [ ] **Check SMTP access is enabled** for the mailbox in the Zoho admin
      console. Some free tiers ship with it off.
- [ ] **Add the DNS records** in Vercel DNS, from Zoho Mail Admin:
      MX (already done if mail is arriving), plus DKIM and DMARC.
      ```
      SPF    TXT  @        (copy the EXACT value from Zoho — see below)
      DKIM   TXT  zmail._domainkey   (value from Zoho Admin → DKIM)
      DMARC  TXT  _dmarc   v=DMARC1; p=none; rua=mailto:care@smartscholar.org
      ```
      ⚠️ **Do not copy an SPF include from a blog post or from me.** Zoho's
      include differs by region (`zoho.com`, `zoho.eu`, `zoho.in`) and has
      changed over the years. Take the exact string Zoho's own DNS setup page
      shows for your account. A wrong include is worse than no SPF: it fails
      authentication instead of merely being absent.
      ⚠️ **Only one SPF record is allowed per domain.** If one already exists,
      merge the include into it. Two SPF records is the same as none.
- [ ] **Verify it end to end** — `node scripts/test-email.mjs you@gmail.com`.
      The script checks config, logs in to Zoho, then sends a real message.
      Do this before you trust signup or the reminder cron.

### 4 · Environment  ⏱ 10 min
```
NEXT_PUBLIC_SITE_URL=https://smartscholar.org
SMTP_HOST=smtp.zoho.com          # or smtp.zoho.eu / smtp.zoho.in — region matters
SMTP_PORT=465
SMTP_USER=care@smartscholar.org
SMTP_PASSWORD=<Zoho APP password, not your login password>
EMAIL_FROM=SmartScholar <care@smartscholar.org>
EMAIL_REPLY_TO=care@smartscholar.org
CRON_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
GROQ_API_KEY=<rotate the one you pasted in chat>
```
Then delete the dead `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `GEMINI_API_KEY`
and `AGENTROUTER_API_KEY` — from `.env` **and** from Vercel.

**`NEXT_PUBLIC_SITE_URL` is now load-bearing.** Confirmation links are built
from it. If it's wrong or missing in Vercel, every new student gets a link
pointing at localhost and nobody can create an account.

### 5 · Make the storage bucket private  ⏱ 2 min  🔴
Supabase → Storage → `documents` → Settings → **Public bucket OFF**.
Students' CVs are readable by anyone with the URL until you do this.

### 6 · Deploy  ⏱ 20 min
```powershell
npx tsc --noEmit
npm run build
```
Fix anything that fails, then push to Vercel. Add every `.env` value to the
Vercel project's Environment Variables — they do **not** come from your local
file.

### 7 · Smoke-test on the live domain  ⏱ 20 min
Sign up with a real address · complete onboarding · see matches · save a plan ·
upload a document · run a review · check the reminder email actually arrives.

```powershell
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://smartscholar.org/api/cron/reminders
```

### 8 · Start getting users — THE SAME DAY  🔴
This is the one that needs calendar time. Facebook groups ("منح دراسية",
Egyptian university groups), Telegram scholarship channels, r/Egypt, your own
school and university friends.

Track it from day one:
```powershell
node scripts/metrics.mjs           # funnel snapshot
node scripts/metrics.mjs --daily   # signups per day
```

Target before 20 August: **20–50 signups, 5+ completed profiles, 3+ saved
plans, 1–2 written testimonials, ideally 1 real payment.**

### 9 · Submit ~20 August
Not on the 23rd. Deadline-day submissions are how people lose entries.

---

## 🔴 BLOCKING — do these first

### Key rotation (from Day 1)
These four keys were committed to git. Rotating them is what actually closes
the exposure — the code no longer reads any of them from source.

- [ ] 🔴 **Supabase service-role key** — dashboard for project `kkqhvlizcbxikypsaxff`
      → Settings → API → Reset. **Highest priority:** this key is full admin over
      your auth project and it sat in a committed markdown file.
- [ ] ✅ **Resend API key** — no longer used anywhere. Revoke it at
      resend.com → API Keys and delete the account if you want; nothing reads it.
- [ ] 🔴 **AgentRouter key** — was in `scripts/test-agentrouter.mjs`
- [ ] 🟠 **BazaarLink key** — was hardcoded in `src/lib/ai-review.ts`.
      If you've stopped using BazaarLink, leave `BAZAARLINK_API_KEY` blank; the
      code skips it cleanly and falls through to AgentRouter.

After rotating, paste the new values into `.env`.

### Domain + email  ← *the single biggest launch blocker*
Nobody can create an account until email works — signup now requires a real
confirmed address, so a broken mailer means zero users, not just a missing
welcome note.

- [x] Domain bought — smartscholar.org
- [x] Zoho mailbox created — care@smartscholar.org
- [ ] 🔴 `npm install` (adds nodemailer), then fill the SMTP block in `.env`
- [ ] 🔴 `SMTP_PASSWORD` = a Zoho **app password**, not your login password
- [ ] 🔴 Set `NEXT_PUBLIC_SITE_URL=https://smartscholar.org` in `.env` **and in
      Vercel**. Confirmation links are built from it.
- [ ] 🔴 `node scripts/test-email.mjs you@gmail.com` — must reach the inbox, not spam
- [ ] 🔴 **Test the real thing:** sign up with an address that is NOT yours,
      click the link in the email, confirm you land on `/onboarding` already
      signed in. That single test covers the whole chain.

### Payment details
Until these are set, the manual payment button is hidden — meaning **nobody can
pay you**. Manual payment is now the primary revenue path, so this is critical.

- [ ] 🔴 `NEXT_PUBLIC_WHATSAPP_NUMBER` — digits only, country code first,
      no `+` or spaces. e.g. `201012345678`
- [ ] 🔴 `NEXT_PUBLIC_VODAFONE_CASH_NUMBER` — the number students send money to
- [ ] 🔴 `NEXT_PUBLIC_INSTAPAY_HANDLE` — your InstaPay handle
- [ ] 🟡 `NEXT_PUBLIC_BANK_TRANSFER_DETAILS` — optional, shown on the payment page

### Admin access
- [ ] 🔴 **Confirm `ADMIN_EMAIL` in `.env`.** I set it to
      `ahmedprogrammer2010@gmail.com`. Your old `.env.example` suggested
      `ahmed_m_hashem@outlook.com`. It must match the email you actually log in
      with, or **you lock yourself out of the admin panel** and can't approve
      any payments.

---

### Added Day 2 — run these now
Nothing typechecks until the first one is done.

- [ ] 🔴 **`npx prisma generate`** — I added fields to `Scholarship` and
      `Payment`. The generated client is stale until you run this, and TypeScript
      will show errors on the new fields. That's expected, not a bug.
- [ ] 🔴 **`npx prisma db push`** — apply the schema to your database.
- [ ] 🟠 **`node scripts/audit-scholarships.mjs`** — prints your real data
      quality and writes `scholarship-verification-worklist.csv`.
- [ ] 🟠 **⭐ RE-SCRAPE for9a — the highest-value command of the week.**
      Your original scraper skipped every structured block on the page. The
      eligibility data you're missing is still sitting there. Run:
      ```bash
      node scripts/rescrape-for9a.mjs --fetch --limit 5   # test 5 first
      node scripts/rescrape-for9a.mjs --parse --limit 5   # check the preview
      node scripts/rescrape-for9a.mjs --fetch             # all (~5 min)
      node scripts/rescrape-for9a.mjs --parse --apply     # write
      ```
      Recovers eligible countries (one page listed **55**), age ranges, degree
      levels, GPA minimums, benefits, requirements, application open dates and
      whether a scholarship is fixed-deadline or genuinely rolling.
      Safe: only fills empty fields, caches pages so you fetch once.
- [ ] 🟠 **`node scripts/enrich-scholarships.mjs`** — run this **after** the
      re-scraper. Dry run first; `--apply` if the preview looks sane. Infers
      whatever the scraper couldn't recover, from text you already have.
- [ ] 🟠 **`node scripts/audit-scholarships.mjs --fix`** — deactivates expired
      records so students never see them.

### Added Day 2 — decisions
- [ ] 🔴 **Your referral code is leaking money.** The code `scholarships` grants
      **15 credits** with 32 uses — that's **$1,440 of free reviews** behind a
      guessable English word. Anyone who types it gets $45 of product free.
      Change the code, cut it to 2–3 credits, or disable it before launch.
- [ ] 🟠 **39 scholarships have a 2030 deadline** — almost certainly the scraper
      mapping "rolling"/"ongoing" to a far-future date. Check a few and decide
      whether to null them or set real dates.

---

### Added Day 4 — turn on reminders 🟠

The deadline-reminder job is built and scheduled, but it will **silently send
nothing** until two things are true:

1. **`CRON_SECRET` in `.env`.** Without it the endpoint refuses to run — an
   unauthenticated reminder endpoint is a free way for anyone to make you email
   your own users. Generate one:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Working Zoho SMTP.** Already on your list above. Confirm with
   `node scripts/test-email.mjs you@gmail.com` first — the cron logs a failure
   per user but does not retry, so a broken mailer costs you a whole day of
   reminders silently.

   Note Zoho's free tier caps daily sends. Once you're past a few hundred
   students the reminder digest will start hitting it, and the fix is a paid
   Zoho plan or a dedicated sending service — not something to solve now, but
   worth knowing before it surprises you.

Test it once both are set:
```powershell
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/reminders
```
It returns `{ users, milestones, sent, skipped }`. Safe to run repeatedly — it's
idempotent, so a second run in the same day sends nothing.

Hosting note: `vercel.json` schedules it daily at 06:00 UTC. If your relative's
hosting isn't Vercel, any scheduler that can make an authenticated daily GET
will do — even a free cron-job.org account.

---

### Added Day 3 — one Arabic name left to fix by hand 🟡

195 of 196 names translated. **One was rejected** and still shows the
placeholder:

> **Fully Funded Research Scholarships at CQUniversity**

The validator flagged the word "central" as invented. It was a false positive —
CQUniversity *is* Central Queensland University, so expanding the acronym was
correct. The guard can't know that, and I'd rather it err toward refusing than
toward writing a fabricated institution into your database.

Fix it directly in the DB, or leave it — it's one card out of 234.

Also worth a manual look: **A & J Duct Cleaning Scholarship** came back as
`تنظيف المجاري`, which means *sewers*. HVAC ducts would be `مجاري الهواء` or
`قنوات التهوية`. Nothing was invented, so the validator passed it — this is
the class of error only a human reader catches.

---

### Added Day 3 — AI provider ✅ RESOLVED (Groq)

**Your AI document review has no working provider.** That's the feature people
pay $3 for. Three vendors failed in a row:

| Provider | Error | Meaning |
|---|---|---|
| AgentRouter | `401 unauthorized client` | App wasn't sending the client-ID headers. **Fixed in code.** |
| AgentRouter | `503 无可用渠道` | Your account group has no provider channel for the model. Account issue. |
| Gemini | `429 limit: 0` | That Google project has **no free-tier allowance at all** — never granted, not exhausted. |

A fourth failure was **mine, not a vendor's**: Groq returns 400 unless the
literal word "json" appears in the messages when you request `json_object`
mode. The app now only sends `response_format` when the prompt contains it.

The app uses **Groq** first, through a generic OpenAI-compatible client so the
next dead vendor is a config change instead of a code change.

**`GROQ_API_KEY` is set and verified working.** ✅

Two follow-ups:

- **Rotate the Groq key.** It was pasted into a chat window. Free to
  regenerate at https://console.groq.com/keys.
- **Delete `GEMINI_API_KEY` and `AGENTROUTER_API_KEY` from `.env`** once
  you're confident in Groq. Both are dead weight, and every failing fallback
  adds latency to a request that's already going to fail.

Free tier is roughly 14,000 requests/day — far beyond launch volume.

If `test-ai.mjs` reports the model was not found, Groq retired it. Pick a
current one from https://console.groq.com/docs/models and set `GROQ_MODEL`
in `.env` — no code change needed.

**Always run `node scripts/test-ai.mjs` before a test review.** A failed review
costs a credit.

---

### Added Day 3 — make the documents bucket private 🔴

**Your students' CVs and personal statements are currently readable by anyone
with the link.** The `documents` storage bucket was created with
`public: true`, so every uploaded file has a permanent, unauthenticated URL —
no login, no expiry. These files contain full names, addresses, grades and
referee contact details.

I've fixed this in code: the bucket is now created private, and every "view
file" link in the app goes through `/api/documents/[id]/file`, which verifies
you own the document before streaming it.

**But code can't change a bucket that already exists.** You have to flip it:

1. Supabase dashboard → your **DB project** (`fpgnuksswpivdltcldbi`) → Storage
2. Click the `documents` bucket → Settings
3. Turn **Public bucket** OFF → Save

Do this before you have real users. After launch it becomes a disclosure
you'd have to notify people about; right now it's a two-click fix.

Any URL that leaked before you flip it stays valid until the file is deleted,
so if you've shared test documents anywhere, re-upload them afterwards.

---

## 🟠 BLOCKING LATER DAYS

- [ ] 🟠 **Try to create a Stripe account** and report back whether Egypt is
      accepted. *Not urgent* — manual payment now works standalone. If Stripe
      rejects you, we skip cards entirely for launch and look at Paymob/Fawry
      in week 2. Don't burn a day fighting this.
- [ ] 🟠 **Verify the seeded scholarship data.** Run the audit script, then open
      `scholarship-verification-worklist.csv` (sorted worst-first, with source
      URLs and exactly which fields are missing). Work top-down.
      **Cap it at 3 hours.** Target the ~40 scholarships people actually search
      for: Chevening, Fulbright, DAAD, Erasmus Mundus, Türkiye Bursları, MEXT,
      Chinese Government, KAUST. 40 verified beats 195 unverified.
      This is the one task I genuinely cannot do at scale, and it's the highest
      leverage work of the week.
- [ ] 🟠 **Decide on the `documents` storage bucket.** It's created with
      `public: true`, so anyone holding a URL can read a student's CV or personal
      statement. Receipts already use a private bucket. Making documents private
      needs signed URLs throughout — scheduled for Day 5, say the word if you
      want it sooner.
- [ ] 🟠 **Run `npx tsc --noEmit && npm run build`** and send me any errors. My
      sandbox can't complete a typecheck over the network mount.

---

### Added Day 3 — fonts + housekeeping

- [ ] 🟡 **Delete leftover font files from the project root**: the `nitro/`
      folder and `alfont_com_AA-MAJARA-Regular.ttf`. Everything in use is
      installed in `public/fonts/`.
- [ ] 🟠 **Check the Majara licence.** It came from alfont (see the
      `alfont_com_` filename prefix) and those listings rarely state terms.
      **Nitro is the only one of the four fonts with a confirmed commercial
      licence** — its readme says so explicitly and I saved it at
      `public/fonts/Nitro-LICENSE.txt`. Resolve before launch; if Majara doesn't
      clear, swapping back to Nitro is just deleting one file.
- [ ] 🟡 **Convert display fonts to WOFF2** (https://cloudconvert.com/ttf-to-woff2).
      The CSS already prefers woff2 with a ttf/otf fallback — no code change.
- [ ] 🟡 **Decide whether dark mode should be the default.** `enableSystem` is
      on, so anyone with a dark OS sees the dark theme first. That's what you
      were seeing when you said the design looked bad.

---

## 🟡 MARKETING — start now, pays off Day 6–7

These need lead time. Facebook group approval takes 1–3 days, so joining on
Day 6 is too late.

- [ ] 🟡 **Join 10 Arabic scholarship Facebook groups.** Search: `منح دراسية`,
      `المنح الدراسية`, `دراسة في الخارج`, `منح ممولة بالكامل`. Many have 100k+
      members.
- [ ] 🟡 **Do not promote yet.** For the next few days, just answer people's
      questions genuinely. You need credibility in the group before you post a
      link, or you'll be banned instantly.
- [ ] 🟡 **Write down the 10 most-asked questions** you see. That becomes your
      FAQ page and your content calendar — real questions beat invented ones.
- [ ] 🟡 **Register handles** matching your domain: Instagram, TikTok, X, Telegram.
- [ ] 🟡 **Set up a support inbox** you'll actually check.

---

## ❓ DECISIONS I NEED FROM YOU

- [ ] **Is $3 / $8 / $12 right?** ≈ 144 / 384 / 576 EGP. Real money for an
      Egyptian student. Keep it and target Gulf + diaspora students who can pay,
      or lower it and win on volume? *My take: keep it for launch. You can always
      discount; raising prices later is painful.*
- [ ] **Product name and domain.** Everything currently says "Scholarship Hub"
      / "ScholarshipAI" inconsistently. Pick one before Day 3's UI rebuild so I
      only do the renaming once.
- [ ] **How many scholarships do you want to launch with?** My recommendation:
      ~120 verified beats 234 where a third are wrong. for9a.com already wins on
      volume — you win on accuracy.

---

## ✅ COMPLETED

*(nothing yet — move items here as you finish them)*
