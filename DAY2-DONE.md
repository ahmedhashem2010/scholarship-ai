# Day 2 — Completed Work

**Theme:** Make the product's core claim true, and make sure you can actually get paid.

Restructured from the original plan: since Stripe is uncertain, **manual payment
is now the primary revenue path**, built properly rather than as a fallback. You
can take money on launch day regardless of what Stripe decides.

---

## ⛔ DO THIS FIRST — before anything else compiles

I changed the Prisma schema. **TypeScript will show errors on the new fields
until you regenerate the client.**

```bash
npx prisma generate      # regenerate types — do this first
npx prisma db push       # apply schema to your database
npx tsc --noEmit         # should now be clean
```

If you skip step 1, you'll see errors like *"Object literal may only specify
known properties, and 'stripeEventId' does not exist"*. That's expected, not a
bug — the generated client is stale.

---

## 🔍 What the data audit found

I analysed all 234 seeded scholarships. It's worse than the deadline problem I
flagged on Day 1.

### The curated 39 are excellent
Full eligibility data, real Arabic names, real deadlines. Whoever wrote these
did it properly.

### The scraped 195 are structurally empty

| Field | Missing |
|-------|---------|
| `eligibleCountries` | **195 / 195 (100%)** |
| `eligibleEducation` | **195 / 195 (100%)** |
| `fieldOfStudy` | **195 / 195 (100%)** |
| `requiredDocuments` | **195 / 195 (100%)** |
| `benefits` | 195 / 195 (100%) |
| `requirements` | 195 / 195 (100%) |
| `minimumGPA` | 195 / 195 (100%) |
| `englishRequirement` | 195 / 195 (100%) |
| `deadline` | 80 / 195 (41%) |
| Arabic name is just `منحة ` + the English name | 194 / 195 (99%) |

### Why that mattered so much

The matcher treated an **empty** array as **"not eligible"**. So for 83% of your
catalogue, every student was shown:

> ✗ Egypt is not in the eligible countries list
> ✗ Degree level (Master) not listed in eligibility

Both statements were **fabricated**. The data was simply absent. Your headline
feature — the fit score — was confidently telling people they didn't qualify for
scholarships that may well have been open to them.

Two more things I found in the same pass:

- **39 scholarships have a 2030 deadline.** Almost certainly the scraper mapping
  "rolling" or "ongoing" to a far-future date. They'll sort to the bottom forever.
- **The match API was serving expired scholarships.** It ran
  `findMany({ take: 100, orderBy: { deadline: "asc" } })` with no filter.
  Postgres sorts NULLs last on ASC, so this took the 100 *earliest* deadlines —
  i.e. the most expired records in the table — and matched everyone against
  those.

---

## ✅ What I changed

### 1. Matcher now has three states, not two

`src/lib/scholarship-matcher.ts` distinguishes **eligible / not eligible /
unknown**. Empty data produces an honest note instead of a red cross:

> ⓘ Eligible nationalities aren't listed — check the official page

Also:
- `MatchResult` gained `unknowns: string[]` and `dataCompleteness: number` (0–100)
- Unknown never blocks eligibility — only an explicit mismatch does
- Ties break on data completeness, so verified scholarships outrank thin ones
- A null deadline no longer claims "✓ No strict deadline" (it said that on 41%
  of records — the deadline exists, we just didn't capture it)
- Fixed a broken string that rendered "⚠ Your field differs from listed: " with
  nothing after the colon

### 2. Schema: data quality + lifecycle

Added to `Scholarship` (both schema files):

| Field | Purpose |
|-------|---------|
| `isActive` | Soft-delete. Hide expired/dead records without losing the SEO page |
| `isVerified` | True once a human has checked the source URL |
| `verifiedAt` | When that happened |
| `inactiveReason` | `EXPIRED` / `DEAD_LINK` / `DUPLICATE` / `UNVERIFIABLE` |
| `applicationOpenDate` | Needed by the Day 4 roadmap generator |

Plus indexes on `[isActive, deadline]` and `[country]`.

### 3. Nothing dead can reach a student

`src/lib/scholarship-filters.ts` (new) is the single place visibility rules
live. Applied to the list API and the match API.

- Active only, deadline not passed (2-day grace — deadlines are often stated
  without a timezone)
- Null deadlines are *kept*, since hiding them would drop a third of the
  catalogue; the matcher flags them instead
- Search is now case-insensitive and covers university names
- `withVisibility()` merges rules in so a future query can't accidentally
  overwrite them by assigning `where.OR`

### 4. Match API fixed

- Filters to visible scholarships, orders verified first, raised cap to 200
- **Cache bug fixed:** results were cached against user ID for 24h, so editing
  your profile didn't change your matches for a full day. Now keyed on the
  profile's `updatedAt`
- Added cache eviction — it was an unbounded `Map` that would grow forever

### 5. Stripe webhook is now idempotent

Stripe re-delivers any event that doesn't get a prompt 2xx. The old code would
**grant credits twice** on a retry.

- `Payment.stripeEventId` is `@unique` — a duplicate fails at the database
- Credit grant + payment record in one transaction
- Only credits when `payment_status === "paid"`
- Verifies the signature properly and rejects a missing one
- Returns 200 for bad metadata (retrying won't help) but 500 for transient
  failures (retry is safe now)
- Sends a confirmation email

### 6. Manual payment — built as a real flow

**`/dashboard/credits/manual`** — three steps: pick a package → see exactly where
to send the money (with a copy button) → upload a receipt screenshot and/or enter
a transaction reference.

- `POST /api/payments/manual` creates a `pending` payment. **Credits are not
  granted** until you approve
- Receipts go to a **private** `receipts` bucket, viewed via 5-minute signed URLs
- Blocks duplicate submissions (one pending payment per user)
- Validates file type and 5MB size
- If receipt upload fails, the payment is still recorded — losing a real payment
  is far worse than losing an image

**`/admin/payments`** — rebuilt. Pending first, receipt link, one-click
approve/reject, rejection reason required. Approve grants credits and emails the
user; reject emails them the reason.

- Approval runs in a transaction that re-checks status, so a double-click can't
  double-credit

### 7. Credits can no longer be lost

`src/app/api/documents/[id]/review/route.ts`:

- Credit charge and review save are now **one transaction**. Previously the
  credit was decremented first — if the save failed, the user paid for nothing
- Uses a conditional `updateMany({ where: { reviewCredits: { gte: 1 } } })`, so
  two concurrent requests can't both spend the same last credit
- AI failures now say *"you haven't been charged"* — which is true, the charge
  happens after
- Stopped leaking raw error messages and stack details to the browser

### 8. ⭐ The re-scraper — this is the real fix

**Correction to something I said earlier.** I claimed the 80 null deadlines meant
the scraper "failed to capture" them. I checked two live for9a pages and that's
only half true — some are genuinely **rolling**:

> Deadline: Ongoing — *"There is no deadline as no application is required."*

So `deadline: null` was conflating "applications are always open" with "we don't
know". Those need completely different messages to a student. Added
`deadlineType` (`FIXED` / `ONGOING` / `ANNUAL` / `UNKNOWN`) and `recurrenceNote`.

**More importantly: the missing data is still on for9a's pages.** Your original
scraper took the title, description and sometimes a deadline, then skipped every
structured block. A single page carries:

```
## Applicant criteria
Nationality   No specific nationality required   → eligibleCountries
Age           18 - 60                            → minimumAge / maximumAge
## Opportunity criteria
Degree        Master                             → eligibleEducation
Deadline      2027-05-01 | Ongoing               → deadline + deadlineType
Opens: Oct 1, 2026   Closes: May 2, 2027         → applicationOpenDate
## Eligibility Countries
- Egypt, Arab Republic … (55 of them)            → eligibleCountries
## Benefits / ## Eligibility criteria            → benefits / requirements
     "Minimum 3.00 GPA"                          → minimumGPA
```

`scripts/rescrape-for9a.mjs` recovers all of it.

```bash
# 1. test on 5 records first
node scripts/rescrape-for9a.mjs --fetch --limit 5
node scripts/rescrape-for9a.mjs --parse --limit 5

# 2. if the preview looks right, do the lot (~5 min at 1.5s/page)
node scripts/rescrape-for9a.mjs --fetch
node scripts/rescrape-for9a.mjs --parse          # preview
node scripts/rescrape-for9a.mjs --parse --apply  # write
```

- Caches pages in `.scrape-cache/`, so `--fetch` runs once and re-parsing is free
- 1.5s delay between requests by default — **don't lower it**
- Only fills **empty** fields unless you pass `--overwrite`; curated data is safe
- Normalises country names (`"Egypt, Arab Republic"` → `"Egypt"`), which matters
  because the matcher string-compares against the user's profile country
- Leaves `isVerified` false — scraped is not verified

**I tested the parser against two real pages before shipping it**, and it caught
three of my own bugs. The worst: `section()` built a regex with an ungrouped
alternation, so `"Eligibility Countries|Countries"` bound across the whole
pattern and the country-list block silently never matched — the single most
valuable field on the page. Also fixed a timezone bug that stored "Oct 1" as
"Sep 30 21:00" on any UTC+ machine.

Verified output:

| | Page 1 (KCC) | Page 2 (Aberdeen) |
|---|---|---|
| countries | `["ALL"]` | `[Algeria, Egypt, Libya, Morocco, Sudan, Tunisia, Nigeria, Kenya]` |
| age | none required | 18–60 |
| education | `["BACHELOR"]` | `["MASTER"]` |
| fields | `["ANY"]` | — (page doesn't say) |
| GPA | 3.0 | — |
| deadline | 2027-05-01 `FIXED` | null `ONGOING` |
| opens | 2026-10-01 | — |

**Run order matters:** re-scrape first (real data), *then* the enrich script
(inference) to fill whatever's left. Enrich only touches empty fields, so it
won't overwrite anything the scraper recovered.

### 9. Two more scripts

```bash
node scripts/audit-scholarships.mjs          # report
node scripts/audit-scholarships.mjs --fix    # + deactivate expired

node scripts/enrich-scholarships.mjs         # dry run (default)
node scripts/enrich-scholarships.mjs --apply # write inferred fields
```

**audit** prints a full data-quality breakdown and writes
`scholarship-verification-worklist.csv` — sorted worst-first, with the source URL
and exactly which fields are missing. Open it in Excel and work down.

**enrich** fills what can be derived deterministically. Every scraped record has
a populated `degree` string and `description`, so it infers `eligibleEducation`
("Bachelor / Master / PhD" → `["BACHELOR","MASTER","PHD"]`), plus fields of
study, required documents and IELTS/TOEFL requirements from the description text.
Deliberately conservative — a wrong field is worse than an absent one. Only
touches empty fields, never overwrites curated data, and leaves `isVerified`
false because inference is not verification.

---

## 🔴 YOUR MANUAL TASKS

**Full standing list is in `MANUAL-TODO.md`** — I keep it updated every day.
New items added today:

### Do right now
- [ ] `npx prisma generate && npx prisma db push` — nothing typechecks until this
- [ ] `node scripts/audit-scholarships.mjs` — see the real state of your data
- [ ] `node scripts/enrich-scholarships.mjs` then `--apply` if the preview looks sane
- [ ] `node scripts/audit-scholarships.mjs --fix` to hide expired records

### The big one
- [ ] **Verify scholarship data.** Open `scholarship-verification-worklist.csv`,
      work top-down. Target ~40 records — the ones people actually search for
      (Chevening, Fulbright, DAAD, Erasmus Mundus, Türkiye Bursları, MEXT,
      Chinese Government, KAUST). Cap this at 3 hours; 40 verified beats 195
      unverified.
- [ ] **Check the 39 records with 2030 deadlines** — likely scraper artifacts.

### Decision needed
- [ ] **Your referral code `scholarships` grants 15 credits × 32 uses.** At $3
      a credit that's **$1,440 of free reviews**, behind a guessable word. Anyone
      who types "scholarships" gets $45 of product. Change the code, cut it to
      2–3 credits, or disable it before launch.

### Security note for Day 5
- [ ] The `documents` bucket is created with `public: true` — anyone with a URL
      can read a student's CV or personal statement. Receipts already use a
      private bucket. Switching documents to private needs signed URLs
      throughout; I've scheduled it for Day 5, but tell me if you want it sooner.

---

## Files changed today

```
NEW    src/lib/scholarship-filters.ts             shared visibility rules
NEW    src/app/api/payments/manual/route.ts       manual payment submit + status
NEW    src/app/api/admin/payments/[id]/route.ts   approve / reject
NEW    src/app/dashboard/credits/manual/page.tsx  student payment flow
NEW    scripts/audit-scholarships.mjs             data quality report + CSV
NEW    scripts/enrich-scholarships.mjs            deterministic field inference

EDIT   prisma/schema.prisma                       Scholarship + Payment fields
EDIT   prisma/schema.postgres.prisma              kept in sync
EDIT   src/lib/scholarship-matcher.ts             three-state eligibility
EDIT   src/lib/supabase/storage.ts                private receipts bucket
EDIT   src/lib/email-templates.ts                 creditsAdded + paymentRejected
EDIT   src/app/api/stripe/webhook/route.ts        idempotent
EDIT   src/app/api/scholarships/route.ts          visibility + better search
EDIT   src/app/api/scholarships/match/route.ts    visibility + cache fix
EDIT   src/app/api/admin/payments/route.ts        user details + signed receipts
EDIT   src/app/api/documents/[id]/review/route.ts atomic credit charge
EDIT   src/app/admin/payments/page.tsx            rebuilt approval queue
EDIT   src/app/dashboard/credits/page.tsx         routes to manual flow
```

---

## Where Day 3 picks up

UI rebuild — landing, dashboard, onboarding, scholarship detail, review results.
The matcher now returns `unknowns` and `dataCompleteness`, so the detail page can
show an honest "verified vs unverified" signal. That's a trust marker for9a.com
doesn't have, and it turns your data problem into a visible differentiator.
