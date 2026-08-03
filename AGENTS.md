# AGENTS.md — SmartScholar

AI-powered platform helping Arab/Middle Eastern students find and apply for international scholarships. Live at **smartscholar.org**. Built with Next.js 14 App Router, Supabase Auth + PostgreSQL, Prisma ORM, Stripe, Zoho SMTP (nodemailer).

> Renamed from "Scholarship Hub" on 27 July 2026. The product name, domain and
> email infra changed — **never hardcode the old name or Resend**. Brand
> constants live in `src/lib/brand.ts` (see Brand section).

## Quick Start

```bash
npm run dev          # localhost:3000
npm run build        # production build (must pass before deploy)
npm run typecheck    # npx tsc --noEmit
npm run db:generate  # after schema changes
npm run db:seed      # 234 scholarships (39 curated + 195 scraped from for9a.com)
npm run db:studio    # Prisma Studio
```

Build before committing — TypeScript strict mode catches real bugs.

## Two Supabase Projects

| Purpose | Project ID | Region |
|---------|-----------|--------|
| **Auth** (users, signup, login) | `kkqhvlizcbxikypsaxff` | US |
| **Database** (PostgreSQL via pooler) | `fpgnuksswpivdltcldbi` | Tokyo |

Database connects through Supavisor pooler (not direct):
```
aws-1-ap-northeast-1.pooler.supabase.com:6543?pgbouncer=true&sslmode=no-verify
```

`prisma db push` / `prisma migrate` need `DIRECT_URL` (session pooler, port 5432,
no `pgbouncer` flag) — the transaction pooler cannot run DDL and hangs silently.

Auth and Database are **different Supabase projects**. Auth users do NOT
auto-populate the Prisma `User` table — that's handled by the profile API route.

## Architecture

- **Brand:** SmartScholar · smartscholar.org · navy (#162C4C) + gold palette, full CSS-variable ramps in `tailwind.config.ts` / `globals.css` that invert in dark mode
- **Auth:** Supabase Auth (project kkqh...) — cookies managed by `@supabase/ssr`
- **Database:** PostgreSQL via pooler + Prisma ORM (`prisma/schema.prisma`)
- **Emails:** Zoho Mail over SMTP via nodemailer (`src/lib/email.ts`) — mailbox `care@smartscholar.org`. Resend is gone.
- **AI:** Multi-provider fallback chain — **Groq (primary) → Gemini → BazaarLink → AgentRouter** — in `src/lib/ai-review.ts` (see AI Providers)
- **Payments:** Stripe Checkout (cards) + manual Egyptian methods (Vodafone Cash, InstaPay, Bank Transfer)
- **Matching:** Custom algorithm in `src/lib/scholarship-matcher.ts` (fit score 0-100)
- **AI Chat:** Same provider chain as above, in a client-side chat widget
- **RTL:** Arabic-first (default `lang="ar" dir="rtl"`), IBM Plex Sans + IBM Plex Sans Arabic, language toggle persisted as `smartscholar.lang` in localStorage
- **Deploy target:** Vercel

## Brand

`src/lib/brand.ts` is the single source of truth for the product name, Arabic
wordmark, taglines, descriptions and domain. **Never hardcode the product name
in a component or template — import it.** A rename should be one edit there.
`src/lib/email-templates.ts` cannot import TS constants into its HTML strings
(they're server-side, so it reads `process.env` / literal strings instead).

Support mail: `support@smartscholar.org`. Brand spec lives in `BRAND-IDENTITY.md`.

## Environment (.env)

> **Never paste real secret values into this file.** It is committed to git.
> See `.env.example` for the full list; values live only in `.env` (gitignored)
> and in the Vercel project settings.

Key vars (all in `.env` at project root):
- `DATABASE_URL` — Supabase pooler connection string (transaction, 6543)
- `DIRECT_URL` — Supabase session pooler (5432, no pgbouncer) for migrations
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Auth project
- `SUPABASE_SERVICE_ROLE_KEY` — Auth project service role (admin operations)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` — Zoho SMTP (`smtp.zoho.com:465`, app password, not login password)
- `EMAIL_FROM` / `EMAIL_REPLY_TO` — must be the authenticated Zoho mailbox
- `GROQ_API_KEY` — primary AI provider (free tier, no credit card)
- `GEMINI_API_KEY` / `BAZAARLINK_API_KEY` / `AGENTROUTER_API_KEY` — optional AI fallbacks
- `ADMIN_EMAIL` — the only account allowed to reach `/admin/*`
- `NEXT_PUBLIC_SITE_URL` — canonical public URL, used for email links/OG/Stripe redirects
- `NEXT_PUBLIC_WHATSAPP_NUMBER` / `NEXT_PUBLIC_VODAFONE_CASH_NUMBER` / `NEXT_PUBLIC_INSTAPAY_HANDLE` — manual-payment contacts
- Stripe keys — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `CRON_SECRET` — shared secret guarding `/api/cron/reminders`
- `NEXT_PUBLIC_GA_ID` — optional GA4

## Signup Flow (current — real email verification)

1. User submits `POST /api/auth/signup` with email, password, name (optionally referralCode)
2. Route calls `supabase.auth.admin.generateLink({ type: "signup" })` — creates the user **unconfirmed** and returns a `hashed_token`
3. The `action_link` Supabase returns is **not used**: it hands the session back in the URL *fragment*, which never reaches the server. Instead the route builds its own link: `{NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=…&type=email&next=/onboarding`
4. The confirmation email is sent via Zoho SMTP (`confirmSignupHtml` — Arabic-first). If SMTP fails, the account exists but the request returns 502 `email_failed` (with the raw reason exposed outside production)
5. Student clicks the link → `src/app/auth/confirm/route.ts` exchanges `token_hash` server-side via `verifyOtp` → they land signed in at `/onboarding`
6. Expired/used links redirect to `/auth/login?error=link_expired|link_invalid`; the login page and `/auth/verify` offer a resend via `POST /api/auth/resend-verification`
7. Middleware blocks unverified users from `/dashboard`, `/onboarding`, `/admin` → redirects to `/auth/verify` (belt-and-braces; doesn't depend on the Supabase "Confirm email" dashboard toggle)
8. Onboarding checks for an existing profile → if none, shows the form → if one exists, redirects to `/dashboard`
9. Onboarding submits `POST /api/user/profile`, which upserts a `User` record then upserts `UserProfile`, then redirects to `/dashboard`

### Why real verification instead of auto-confirm?

Auto-confirm (`createUser({ email_confirm: true })`) let anyone register any
address and the reminder cron emailed addresses never proven to exist. On a
product whose core promise is "we email you before each step", that is a
silently broken account. Verification also survives a missing SITE_URL config,
which the old PKCE `generateLink` + `exchangeCodeForSession` flow did not.

## Auth & Middleware

`src/middleware.ts` (matcher: `/`, `/dashboard/:path*`, `/auth/:path*`, `/onboarding`, `/admin/:path*`):
- `alwaysPublic` (no auth check): `/auth/callback`, `/auth/confirm`, `/auth/verify`
- Signed-in users on `/` → redirect to `/dashboard` (escape hatch: `?home=1`)
- Blocks unauthenticated access to `/dashboard/*`, `/onboarding`, `/admin/*` → redirects to `/auth/login` with `redirectTo` preserving intent
- Blocks **unverified** users from the same routes → `/auth/verify`
- `/admin/*` gated on `ADMIN_EMAIL` (middleware + every `/api/admin/*` handler)
- Signed-in users on `/auth/*` → `/dashboard`
- Uses `supabase.auth.getUser()` (server-revalidated JWT) — never `getSession()` for authorization decisions

Callback route at `src/app/auth/callback/route.ts` — PKCE code exchange (OAuth flows; signup does not use it).

## AI Providers

`src/lib/ai-review.ts` tries providers in order: **Groq → Gemini → BazaarLink →
AgentRouter**, falling through on key-missing or HTTP errors; `scripts/test-ai.mjs`
verifies the chain. The chat widget uses the same stack. Logging is gated behind
`AI_DEBUG` — response bodies can contain fragments of student documents, so it
stays **off in production**.

## Prisma Schema (9 models)

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User` | id, email, name | FK for all other models; upserted by profile API |
| `UserProfile` | userId, displayName, dateOfBirth, country, educationLevel, major, targetDegree, englishLevel, gpa, budget | `userId` references `User.id` — **User must exist first** |
| `Scholarship` | nameEn, nameAr, country, degree, deadline, eligibleCountries[], eligibleEducation[], fieldOfStudy[], minimumAge, maximumAge, minimumGPA, requiredDocuments[] | 234 seeded records |
| `Application` | userId, scholarshipId, status, progress | |
| `Document` | userId, fileName, fileUrl, documentType, version | Version chain via parentDocumentId |
| `ApplicationDocument` | applicationId, documentType, status | |
| `Review` | documentId, userId, score, strengths, weaknesses, suggestions | |
| `Payment` | userId, amount, credits, status | |

## Profile API (`/api/user/profile`)

- **GET** — Returns profile data (or empty strings if none exists); always `success: true` with fallbacks
- **POST** — Creates/upserts profile (used by onboarding)
- **PUT** — Updates profile (used by profile edit page)

Critical: `upsertProfile()` first calls `prisma.user.upsert` to ensure the `User` record exists before creating `UserProfile` (FK constraint). Both Auth and DB are separate Supabase projects, so there's no auto-sync.

## Scholarship Matching

`src/lib/scholarship-matcher.ts`:
- `MatchParams` interface uses `dateOfBirth: string` (not age)
- `calcAge()` helper computes age from dateOfBirth at match time
- Country and education level are hard disqualifiers (0 score)
- Age, field of study, GPA, English level contribute to fit score
- Competition label based on `competitionLevel` field

## Matching API

`/api/scholarships/match` — cached 24h per user, requires auth + profile. Returns sorted array of `{ scholarship, fitScore, successProbability, reasons, disqualifiers }`.

## Age → dateOfBirth Migration

All `age` fields were renamed to `dateOfBirth` (stored as `DateTime` in DB, `string` in forms). Age is computed at runtime:
- `src/lib/scholarship-matcher.ts` — `calcAge()` helper
- Dashboard profile, edit page, onboarding all use `dateOfBirth` with `<input type="date">`
- Match API and chat API pass `dateOfBirth` not `age`

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/brand.ts` | Brand constants (name, Arabic wordmark, domain, taglines) — import, don't hardcode |
| `prisma/schema.prisma` | Active PostgreSQL schema (9 models) |
| `prisma/seed.ts` | Seeds 234 scholarships |
| `src/middleware.ts` | Auth guard + unverified-user redirect + admin gating |
| `src/app/api/auth/signup/route.ts` | Signup — `generateLink` + custom confirm URL (real verification) |
| `src/app/api/auth/resend-verification/route.ts` | Re-emails a fresh confirmation link |
| `src/app/auth/confirm/route.ts` | Server-side token exchange via `verifyOtp` → session |
| `src/app/auth/verify/page.tsx` | "Check your email" page with resend button |
| `src/lib/email.ts` | Zoho SMTP client (nodemailer, pooled) |
| `src/lib/email-templates.ts` | HTML templates (confirm, reset password, credits, reminders) |
| `src/lib/ai-review.ts` | AI provider chain (Groq → Gemini → BazaarLink → AgentRouter) |
| `src/app/onboarding/page.tsx` | 5-step onboarding wizard |
| `src/app/dashboard/page.tsx` | Dashboard (redirects to onboarding if no profile) |
| `src/lib/scholarship-matcher.ts` | Matching algorithm |

## Email — Testing & Gotchas

- Verify the whole chain with: `node scripts/test-email.mjs you@gmail.com`
- Zoho: host is region-specific (`smtp.zoho.com` / `.eu` / `.in`); with 2FA on you must use an **app password**; the From address must be the authenticated mailbox; some free tiers have SMTP disabled in the admin console
- There is **no Resend sandbox** anymore — no single test-only inbox. Send to any address you control
- `scripts/test-ai.mjs` verifies the AI chain; `scripts/delete-user.mjs` deletes a user from Supabase Auth (reads `.env`, never hardcode keys)

## Performance Optimizations (applied May 2026)

| Optimization | File | Impact |
|-------------|------|--------|
| Image formats + compression | `next.config.mjs` | AVIF/WebP image output, gzip compression, SWC minifier |
| IBM Plex Sans + Arabic weights | `src/app/layout.tsx` | Paired Latin/Arabic face, only 400-700 weights loaded |
| `memo()` on cards | `src/app/dashboard/page.tsx` | `ScholarshipCard` won't re-render on unrelated state changes |
| `dynamic()` imports | `src/app/dashboard/reviews/[id]/page.tsx` | `PDFViewer` + `ReviewDisplay` lazy-loaded with skeleton fallbacks |
| Pagination on documents API | `src/app/api/documents/route.ts` | `page`/`pageSize` query params with `skip`/`take` |
| Match results limited to 100 | `src/app/api/scholarships/match/route.ts` | `take: 100` on scholarship query |
| Bundle analyzer | `package.json` | `npm run analyze` via `@next/bundle-analyzer` |

## Data Fetching (Context Pattern — avoid duplicate API calls)

All data that's shared across multiple components uses React Context to fetch once:

| Context | File | Fetches | Used By |
|---------|------|---------|---------|
| `ProfileProvider` | `src/lib/profile-context.tsx` | `GET /api/user/profile` (once) | `nav.tsx`, `user-nav.tsx`, `dashboard/page.tsx`, `scholarship-card-list.tsx` |
| `CreditsProvider` | `src/lib/credits-context.tsx` | `GET /api/user/credits` (once) | `nav.tsx`, `scholarship/header.tsx` |

Both are wrapped in `app/layout.tsx` inside `<ToastProvider>`. The hooks use a `useRef` guard to prevent double-fetch in React StrictMode.

### Before context pattern (11 requests per dashboard load):
```
profile(×4) → credits(×2) → documents + match
```

### After (4-5 requests):
```
profile(×1) → documents + match (parallel)
credits(×1)
```

## Document Progress & Review Scores

| File | Purpose |
|------|---------|
| `src/components/DocumentProgress.tsx` | Sidebar component showing documents with colored score badges (green ≥8, amber ≥6, red <6), loading state, empty state with upload link |
| `src/app/api/documents/[id]/latest-review/route.ts` | Returns the most recent review for a single document (score, feedback, strengths, suggestions) |
| `src/app/api/documents/route.ts` | Updated to `include` the latest review + child version count in the Prisma query |

## Dashboard (`/dashboard`)

- Fetches real matches from `/api/scholarships/match` (uses `matchScholarshipsToUser` algorithm)
- Fetches real documents with review scores (via the documents API with `include: { reviews }`)
- Stats row uses real data (active scholarships count, docs ready, avg score, deadlines)
- Sidebar uses `<DocumentProgress />` component
- Empty states for no-matches and no-documents (both show CTA to complete profile / upload)

## Build

```bash
npm run build
```

Expected warnings: `Dynamic server usage` errors for `/api/users`, `/api/admin/payments`, `/api/scholarships/match` — these use `request.cookies` and are expected (several routes carry `export const dynamic = "force-dynamic"` to keep the output clean). Prerender errors for pages using auth/cookies are also normal. **Zero TypeScript errors** is the pass/fail criterion.

## Code Quality

- Run `npx tsc --noEmit` before any commit
- Keep unused imports at zero (TS error 6133)
- Shared data goes in React Context, not duplicated `useEffect` fetches
- Card/list components should use `memo()` to prevent unnecessary re-renders
- Heavy component imports (PDF viewer, review display) use `next/dynamic` with SSR disabled
- `console.warn/error/info` are allowed (ESLint config); server logging is deliberate

## Admin

Admin access is gated on `ADMIN_EMAIL` — enforced in both `src/middleware.ts`
(page routes under `/admin/*`) and each `/api/admin/*` route handler.

Delete a user from Supabase Auth (does NOT delete from Prisma DB — separate projects):
```
node scripts/delete-user.mjs <email>
```
The script reads credentials from `.env`, never hardcode them.
