# PROJECT_MAP — SmartScholar

Repository inventory. Facts only.

## Folder Tree (2 levels)

```
scholarship-project/
├── .agents/                  # skills (ui-ux-pro-max)
├── agent-skills/
├── marketingskills/
├── nitro/                    # display font files
├── prisma/                   # main-app Prisma schema + seed + scraped data
│   ├── schema.prisma
│   ├── schema.postgres.prisma
│   ├── seed.ts
│   ├── dev.db
│   └── scraped-scholarships.ts
├── public/                   # brand assets, fonts, og.png
│   ├── brand/
│   └── fonts/
├── scripts/                  # operational .mjs scripts (main-app schema)
├── smartscholar-backend/     # SEPARATE normalized backend project
│   ├── database/             # 001–017 SQL DDL (source of truth)
│   ├── docs/                 # ARCHITECTURE, DATABASE, SECURITY, ERD, API...
│   ├── prisma/               # schema.prisma (uuid mirror)
│   ├── scripts/              # import, embeddings, syncDeadlines, verify...
│   ├── src/                  # acquisition/, providers/, shared/, deep-extract/
│   └── tools/                # generate-prisma.mjs, validate.mjs
├── src/                      # main Next.js app
│   ├── app/                  # App Router pages + api routes
│   ├── components/           # UI + feature components
│   ├── contexts/             # LanguageContext
│   ├── hooks/                # use-toast
│   ├── lib/                  # utilities, AI, matcher, supabase, email...
│   ├── test/                 # test setup
│   ├── types/                # index.ts, pdf-parse.d.ts
│   ├── ui-ux-pro-max/        # design data csv
│   └── middleware.ts
└── video-assets/
```

## Main Pages (`src/app/**/page.tsx`)

- `/` — landing (`page.tsx`)
- `/glossary`
- `/help`
- `/privacy`
- `/terms`
- `/success-stories`
- `/onboarding`
- `/auth/login`
- `/auth/signup`
- `/auth/verify`
- `/profile/edit`
- `/dashboard`
- `/dashboard/profile`
- `/dashboard/documents`
- `/dashboard/roadmap`
- `/dashboard/compare`
- `/dashboard/reviews/[id]`
- `/dashboard/applications`
- `/dashboard/applications/[scholarshipId]`
- `/scholarships`
- `/scholarships/[id]`

## API Routes (`src/app/api/**/route.ts` + auth routes)

Auth / user:
- `POST /api/auth/signup`
- `POST /api/auth/resend-verification`
- `GET/PUT/POST /api/user/profile`
- `GET /api/users`
- `/auth/callback` (PKCE)
- `/auth/confirm` (token exchange)

Scholarships / matching / roadmap:
- `GET/POST /api/scholarships`
- `GET /api/scholarships/[id]`
- `POST /api/scholarships/match`
- `GET/POST /api/roadmap`
- `/api/roadmap/[id]`

Applications:
- `GET/POST /api/applications`
- `/api/applications/[id]`
- `/api/applications/[id]/progress`
- `/api/applications/[id]/documents/[docId]`

Documents / reviews:
- `GET/POST /api/documents`
- `/api/documents/[id]`
- `/api/documents/[id]/file`
- `/api/documents/[id]/review`
- `/api/documents/[id]/latest-review`

Payments / credits / admin: *(none — billing, credits, and the admin panel were removed; the product is fully free, AI reviews capped by a daily quota)*

Cron:
- `GET /api/cron/reminders`

## Database Models

Main app (`prisma/schema.prisma`, cuid IDs):
- `User`
- `UserProfile`
- `Scholarship`
- `Application`
- `Document`
- `ApplicationDocument`
- `Review`
- `ReviewDailyUsage`
- `RoadmapMilestone`

Backend (`smartscholar-backend/`, uuid IDs, normalized): separate 76-table SQL-owned schema (dimension tables, scholarship + child tables, users/applications/AI/analytics, pgvector embeddings, tsvector search, RLS). Not connected to the main app.

## Components (`src/components/`)

Feature:
- `DocumentProgress.tsx`, `ImprovementChecklist.tsx`, `ReviewDisplay.tsx`
- `analytics.tsx`, `compare-selector.tsx`
- `help-tooltip.tsx`, `hero-ui-provider.tsx`, `nav.tsx`, `sidebar.tsx`
- `pdf-viewer.tsx`, `scholarship-card-list.tsx`, `theme-provider.tsx`, `user-nav.tsx`
- `documents/upload-dropzone.tsx`
- `onboarding/english-step.tsx`
- `scholarship/` — `confetti-trigger.tsx`, `empty-states.tsx`, `feedback-section.tsx`, `header.tsx`, `pdf-viewer.tsx`, `score-ring.tsx`, `theme-toggle.tsx`, `version-timeline.tsx`

UI primitives (`ui/`):
- accordion, avatar, badge, button, card, checkbox, collapsible, deadline-indicator, dropdown-menu, empty, fit-score, input, label, progress-bar, progress, scholarship-card, scroll-area, select, separator, skeleton, status-badge, tabs, toast

## Utilities (`src/lib/`)

- `analytics.ts`, `api-utils.ts`, `application-progress.ts`
- `brand.ts`, `colors.ts`, `constants.ts`
- `document-versions.ts`
- `email.ts`, `email-templates.ts`
- `i18n.ts`, `prisma.ts`, `profile-context.tsx`
- `review-quota.ts`, `scholarship-filters.ts`, `text-extract.ts`, `utils.ts`
- `supabase/` — `api-auth.ts`, `client.ts`, `server.ts`, `storage.ts`
- `validations/scholarship.ts`
- Contexts/hooks: `src/contexts/LanguageContext.tsx`, `src/hooks/use-toast.ts`

## AI Modules

Main app:
- `src/lib/ai-review.ts` — document review + provider fallback chain (Groq → Gemini → BazaarLink → AgentRouter)
- `src/lib/review-quota.ts` — free daily AI review limit
- `src/lib/scholarship-matcher.ts` — deterministic fit-score matching
- `src/lib/roadmap-generator.ts` — deterministic milestone generation

Backend (`smartscholar-backend/src/`):
- `acquisition/` — pipeline, discover, extractors (html/pdf), normalizers, validators, importers
- `providers/` — chevening, csc, daad, erasmus, fulbright, mext, stipendium-hungaricum
- `deep-extract/` — ai.ts, crawl.ts, extract.ts, merge.ts, quality.ts, update.ts (untracked)
- `scripts/generateEmbeddings.ts`, `detectDuplicates.ts`
