# AGENTS.md — Scholarship Hub

AI-powered platform helping Arab/Middle Eastern students find and apply for international scholarships. Built with Next.js 14 App Router, Supabase Auth + PostgreSQL, Prisma ORM, Stripe, Resend.

## Quick Start

```bash
npm run dev          # localhost:3000
npm run build        # production build (must pass before deploy)
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

Auth and Database are **different Supabase projects**. Auth users do NOT auto-populate the Prisma `User` table — that's handled by the profile API route.

## Architecture

- **Auth:** Supabase Auth (project kkqh...) — cookies managed by `@supabase/ssr`
- **Database:** PostgreSQL via pooler + Prisma ORM (`prisma/schema.prisma`)
- **Emails:** Resend (sandbox: only sends to `ahmedprogrammer2010@gmail.com` until domain verified)
- **Payments:** Stripe Checkout (cards) + manual Egyptian methods (Vodafone Cash, InstaPay, Bank Transfer)
- **Matching:** Custom algorithm in `src/lib/scholarship-matcher.ts` (fit score 0-100)
- **AI Chat:** AgentRouter (`claude-haiku`) for scholarship coaching
- **RTL:** Arabic support via Tajawal font + nav toggle
- **Deploy target:** Vercel

## Environment (.env)

> **Never paste real secret values into this file.** It is committed to git.
> See `.env.example` for the full list; values live only in `.env` (gitignored)
> and in the Vercel project settings.

Key vars (all in `.env` at project root):
- `DATABASE_URL` — Supabase pooler connection string
- `NEXT_PUBLIC_SUPABASE_URL` — Auth project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Auth project anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Auth project service role (admin operations)
- `RESEND_API_KEY` — transactional email
- `RESEND_FROM_EMAIL` — verified sender, e.g. `Scholarship Hub <noreply@yourdomain.com>`
- `AGENTROUTER_API_KEY` — chat + document review AI
- `BAZAARLINK_API_KEY` — optional primary AI gateway; skipped if unset
- `ADMIN_EMAIL` — the only account allowed to reach `/admin/*`
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — manual-payment contact, digits only, country code first
- Stripe keys — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Signup Flow (current)

1. User submits `/api/auth/signup` with email, password, name
2. API creates user in Supabase Auth with `email_confirm: true` (auto-confirmed)
3. API sends branded welcome email via Resend (`welcomeHtml` template) with login link
4. User logs in → login page calls `router.push("/onboarding")`
5. Middleware also redirects authenticated users on `/auth/*` to `/onboarding`
6. Onboarding page checks for existing profile → if none, shows form → if exists, redirects to `/dashboard`
7. Onboarding submits `POST /api/user/profile` which first upserts a `User` record, then upserts `UserProfile`
8. After profile saved → redirects to `/dashboard`

### Why no email confirmation?

The original `generateLink` + `exchangeCodeForSession` PKCE flow was unreliable — Supabase's hosted redirect depends on dashboard config (SITE_URL, allowed redirect URLs). Auto-confirm + direct login is simpler and works offline. The `welcomeHtml` template replaces the confirmation email.

## Auth & Middleware

`src/middleware.ts`:
- Blocks unauthenticated access to `/dashboard/*` and `/onboarding` → redirects to `/auth/login`
- Redirects authenticated users on `/auth/*` → redirects to `/onboarding`
- Uses `@supabase/ssr` `createServerClient` with cookie management

Callback route at `src/app/auth/callback/route.ts` — handles PKCE code exchange (kept for OAuth flows, not used by signup).

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
| `prisma/schema.prisma` | Active PostgreSQL schema (9 models) |
| `prisma/seed.ts` | Seeds 234 scholarships |
| `src/middleware.ts` | Auth guard + login redirect |
| `src/app/api/auth/signup/route.ts` | Custom signup (auto-confirm + welcome email) |
| `src/app/api/user/profile/route.ts` | Profile CRUD (creates User + UserProfile) |
| `src/app/auth/callback/route.ts` | OAuth callback (kept for future) |
| `src/app/auth/verify/page.tsx` | Post-signup "check your email" page |
| `src/app/onboarding/page.tsx` | 5-step onboarding wizard |
| `src/app/dashboard/page.tsx` | Dashboard (redirects to onboarding if no profile) |
| `src/lib/scholarship-matcher.ts` | Matching algorithm |
| `src/lib/email.ts` | Resend email client |
| `src/lib/email-templates.ts` | HTML templates (welcome, confirm, reset password) |

## User Email for Testing

`ahmedprogrammer2010@gmail.com` — the only address the Resend sandbox can deliver to. Delete from Supabase Auth between test runs via:
```
node -e "... fetch(url + '/auth/v1/admin/users', { headers }) ..."
```
(script uses service role key to list users and delete by email)

## Performance Optimizations (applied May 2026)

| Optimization | File | Impact |
|-------------|------|--------|
| Image formats + compression | `next.config.mjs` | AVIF/WebP image output, gzip compression, SWC minifier |
| Reduced Poppins font weights | `src/app/layout.tsx` | Dropped 400 weight, only loads 500/600/700 |
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

Expected warnings: `Dynamic server usage` errors for `/api/users`, `/api/admin/payments`, `/api/scholarships/match` — these use `request.cookies` and are expected. Prerender errors for pages using auth/cookies are also normal. **Zero TypeScript errors** is the pass/fail criterion.

## Code Quality

- Run `npx tsc --noEmit` before any commit
- Keep unused imports at zero (TS error 6133)
- Shared data goes in React Context, not duplicated `useEffect` fetches
- Card/list components should use `memo()` to prevent unnecessary re-renders
- Heavy component imports (PDF viewer, review display) use `next/dynamic` with SSR disabled

## Admin

Admin access is gated on `ADMIN_EMAIL` — enforced in both `src/middleware.ts`
(page routes under `/admin/*`) and each `/api/admin/*` route handler.

Delete a user from Supabase Auth (does NOT delete from Prisma DB — separate projects).
Reads credentials from `.env`, never hardcode them:

```bash
node -r dotenv/config -e "
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
};
// list -> find by email -> DELETE /auth/v1/admin/users/:id
"
```
