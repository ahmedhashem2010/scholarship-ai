● I have both agent reports and my own analysis. Here's the complete architecture assessment.

  ---
  SmartScholar — Complete Architecture Analysis

  Architecture Overview

  Main Application (Live/Shipping)
  - Frontend: Next.js 14 App Router, React 18, TypeScript strict mode
  - Auth: Supabase Auth (US region, project kkqh...) with SSR cookie management via @supabase/ssr
  - Database: PostgreSQL via Supavisor pooler (Tokyo region, project fpgn...), accessed through Prisma ORM
  - Schema: Flat, denormalized 10-model design (prisma/schema.prisma) with cuid() IDs, String[] arrays for
  eligibility/documents, no embeddings, no RLS
  - AI Layer: Multi-provider fallback chain (Groq → Gemini → BazaarLink → AgentRouter) for document reviews and chat
  - Payments: Stripe Checkout + manual Egyptian methods (Vodafone Cash, InstaPay, bank transfer)
  - Matching: Deterministic weighted-score algorithm (scholarship-matcher.ts) — tri-state eligibility logic
  (eligible/ineligible/unknown)
  - Email: Zoho SMTP via nodemailer (replaced Resend completely)
  - Deploy Target: Vercel
  - Internationalization: Arabic-first with RTL, IBM Plex Sans + Arabic, localStorage language toggle

  Separate Backend Project (Unshipped/Parallel Effort)
  - Location: smartscholar-backend/ directory
  - Schema: Fully normalized 76-table PostgreSQL design with uuid PKs, 60+ enums, dimension tables for
  countries/cities/currencies/languages/degrees/fields, pgvector embeddings (1536-dim), tsvector full-text search,
  Row-Level Security on every table
  - Ingestion Pipeline: src/acquisition/** + src/providers/** — discovery → fetch → extract → normalize → import with
  versioning/deduplication/batching
  - Current Data Source: 7 curated provider adapters (DAAD, Erasmus, Chevening, Fulbright, MEXT, CSC, Stipendium
  Hungaricum) — all curated: true (hand-coded data, not real scraping despite HTML/PDF extractors existing)
  - Scripts: embeddings generation, duplicate detection, deadline sync, verification queue
  - Status: Prototype-to-early-beta plumbing, NOT connected to the main app

  Critical Finding: The two schemas are entirely disjoint and incompatible. Scholarship.id types alone (cuid string vs
  uuid) confirm they cannot share a database. The main app's src/** has zero references to the backend. Grep for
  vector_search|ai_embeddings|embedding across src/** returns nothing. The backend is standalone/parallel rebuild work
  that is currently dead weight.

  ---
  Current Project Maturity: 68%

  Justification:
  - ✅ Auth flow is production-ready (85%): Real email verification, proper JWT validation, middleware blocks unverified
  users, ownership checks on every data route
  - ✅ Payment integrity is strong (90%): Server-side price resolution, webhook signature verification, idempotent
  credit grants, atomic credit consumption
  - ✅ Core features work (70%): Onboarding → matching → roadmap generation → document upload → AI review → credits
  purchase
  - ⚠️ Data quality is weak (40%): 83% of scholarships lack structured eligibility (acknowledged in matcher comments);
  80 of 234 have no deadline
  - ⚠️ Backend is unused (0%): 76-table normalized schema + ingestion pipeline + embeddings built but not wired to app
  - ⚠️ No rate limiting (0%): Auth signup/AI review/chat all unprotected
  - ⚠️ Tests are thin (15%): 2 test files for 141 TS/TSX source files; highest-risk logic (payment idempotency, credit
  atomicity, matcher) untested
  - ⚠️ Admin authz has gaps (60%): /api/scholarships POST missing admin check; inline authorization not DRY
  - ✅ Build is green (100%): tsc --noEmit clean, npm run build passes, 39/39 pages compiled

  ---
  Biggest Strengths

  1. Auth security is done correctly
    - src/middleware.ts uses getUser() (revalidates JWT), not getSession()
    - Every data route re-authenticates server-side and checks document.userId !== user.id
    - Real email verification (not auto-confirm), unverified users blocked from /dashboard
  2. Payment handling is production-grade
    - Checkout validates package/price server-side via validatePackage (never trusts client amount)
    - Stripe webhook verifies signatures on raw body, checks payment_status === "paid", idempotent via unique
  stripeEventId
    - Credit consumption atomic: updateMany({ reviewCredits: { gte: 1 } }) inside transaction only charges after review
  saved
    - Manual payment validates method allow-list, receipt MIME + 5MB cap, blocks duplicate pending submissions
  3. Matcher tri-state logic is thoughtful
    - Empty eligibility arrays treated as "unknown" not "excluded" (empty never disqualifies)
    - Surfaces unknowns[] separately from disqualifiers[] so UI can say "not listed" vs "you don't qualify"
    - Comments document the reasoning: "195 of 234 seeded scholarships were scraped without structured eligibility data"
    - dataCompleteness score (0-100) surfaces per-scholarship to distinguish verified from thin scraped records
  4. Roadmap generator is deterministic and well-architected
    - Pure function, no AI, no network, fully testable
    - Backwards-plans 15 dated steps from deadline with lead times (IELTS prep 12 weeks, referee requests 6 weeks)
    - Adapts to profile: if user holds IELTS, English track disappears; if hasEnglishTest === "PREFER_WITHOUT", no-test
  scholarships rank 16 points higher
  5. Code comments are unusually strong
    - Document the why and past bugs (race conditions, NULL-sorting deadline bug, fragment redirect)
    - scholarship-matcher.ts:123–134 explains the empty-eligibility decision with data source context
    - Real asset for maintainability

  ---
  Biggest Weaknesses

  1. Dual-schema architecture risk ⚠️⚠️⚠️
    - Two completely separate, incompatible database schemas (main app cuid flat vs backend uuid normalized)
    - Two Prisma clients, two script suites, no migration path between them
    - Whichever ships, the other is dead weight and a source of confusion
    - Backend's 76-table design + ingestion pipeline + embeddings system (months of work) currently unused
  2. Data quality damages core value prop
    - 83% of scholarships lack structured eligibility (per matcher comments)
    - 80 of 234 have no deadline (per MANUAL-TODO.md Day 2 audit)
    - 195 of 234 are scraped from for9a.com without verification
    - Matcher handles this gracefully (tri-state logic), but "find scholarships you can trust" is undermined when most
  data is thin
  3. Zero rate limiting
    - POST /api/auth/signup can trigger outbound email at volume (cost + reputation risk)
    - POST /api/chat and POST /api/documents/[id]/review proxy to paid/free-tier AI providers with only auth gating —
  authenticated user can drain quota
    - No IP-based, user-based, or endpoint-based throttling anywhere
  4. Admin authorization gaps
    - POST /api/scholarships (scholarships/route.ts:73) authenticates but does NOT check admin — any logged-in user can
  create catalogue scholarships
    - Admin checks duplicated inline across routes with inconsistency: some compare dbUser.email !== adminEmail
  case-sensitively without trim, admin/payments/[id]/route.ts uses requireAdmin helper with .toLowerCase().trim()
    - Admin identity is single env-var email, not a role model — no second admin, no audit of who granted credits
  5. AI review prompt is misaligned
    - src/lib/ai-review.ts:48 hardcoded: "You are rating a high school student's CV (grades 9-12) for a scholarship"
    - Product targets Masters/PhD international scholarships (Chevening, Fulbright, DAAD, Erasmus Mundus)
    - Scoring rubric (9-10: "Built project OR research OR international fellowship") makes sense for undergrad/Masters,
  conflicts with stated audience

  ---
  Technical Debt

  1. Embeddings are dead code
    - Backend vector_search_scholarships/similar_scholarships views + generateEmbeddings.ts exist but nothing in app
  calls them
    - Matcher uses deterministic weighted scoring, not semantic search
    - Dangerous fallback: when EMBEDDING_API_URL/KEY unset, generateEmbeddings.ts writes SHA256-hash pseudo-vectors into
  ai_embeddings and flips needs_embedding=false — these aren't semantically meaningful, so cosine search returns noise
  while looking populated
  2. Matcher scoring is hand-tuned magic constants
    - maxScore = 130 computed once, weights scattered as literals (score += 25, score += 16, score += 13)
    - Hard to test, tune, or explain — no parameterization
    - calcSuccessProbability adds/subtracts fixed amounts (+10, -10) on top of fitScore with no clear model
  3. Review route is heavy
    - review/route.ts ~300 lines with 12 numbered debug steps inline
    - "Existing review" caching returns first review ever, so re-upload on same document ID can't be re-reviewed (by
  design, but couples caching to charging logic)
  4. Admin credit-grant logic duplicated
    - Manual payment approval (admin/payments/[id]/route.ts) and direct credit-grant (admin/credits/route.ts) both
  update reviewCredits and create Payment rows with subtly different fields (method, packageId, receiptUrl)
  5. Dual script suites targeting different schemas
    - Backend scripts/ (embeddings, importScholarships, syncDeadlines) target uuid schema
    - Root scripts/*.mjs (enrich, audit, rescrape, translate-names) target cuid schema
    - Both exist, both maintained, neither can work with the other's DB
  6. AI provider config mismatch
    - AGENTS.md:46 documents "Groq (primary) → Gemini → BazaarLink → AgentRouter"
    - ai-review.ts:16 has REVIEW_MODELS = ['claude-sonnet-4-20250514'] — Claude, not Groq
    - Chat widget footer says "Powered by Gemini" but callAI tries Groq first
  7. Stray files
    - martscholar-backend (typo, missing "s") is a git-log dump committed by accident
    - mtest.ts at project root (scratch file neutralized to empty module but not deleted)
    - nitro/ fonts in root + alfont_com_AA-MAJARA-Regular.ttf when everything in use is in public/fonts/

  ---
  UX Issues

  1. Chat widget affordances misleading
    - Uses single-line <input> but handleKeyDown checks !e.shiftKey — shift+enter does nothing (dead affordance for
  multiline)
    - Footer says "Powered by Gemini" when Groq is tried first
    - No role/aria-live on message list, so screen readers won't announce streamed replies
    - Error states collapse all failures to generic strings; no retry affordance
  2. i18n deliberately incomplete
    - src/lib/i18n.ts header states dashboard internals stay English
    - Arabic coverage limited to landing + onboarding (per LAUNCH-PLAN.md scope cut)
    - Mix of Arabic and English within single flows may confuse non-bilingual users
  3. Empty states could be stronger
    - Dashboard has real empty states with CTAs (good), but compare page, roadmap page, documents page don't all follow
  same pattern
    - No skeleton loaders on some high-latency routes (scholarships index, match results when uncached)
  4. Mobile-first claimed but not consistently verified
    - LAUNCH-PLAN.md Day 3 tasks: "Test every screen at 375px width. Your audience is overwhelmingly on phones."
    - No responsive design tests in codebase; manual verification only
  5. Match result "unknowns" UI unclear
    - Matcher returns unknowns[] separately from disqualifiers[] (great design), but UI treatment inconsistent across
  scholarship card vs detail page
    - Some unknowns shown inline, others buried in expandable sections

  ---
  Missing Features

  1. Rate limiting (security + cost control)
    - No throttling on signup, AI review, chat, or any endpoint
    - High-cost endpoints (review, chat) are credit-gated but not rate-limited
  2. Admin role model
    - Single env-var email; no second admin, no role-based access, no audit log of who granted credits or approved
  payments
  3. Scholarship verification workflow
    - Backend has verification_queue table + UNVERIFIED → VERIFIED flow in schema
    - Main app marks everything isActive: true at import time with no review step
    - "Report an error" button mentioned in DATA-STRATEGY.md but not implemented
  4. Deadline monitoring/staleness detection
    - DATA-STRATEGY.md recommends: "Re-check every active scholarship's source URL on a schedule (weekly Tier 1, monthly
  Tier 2), detect 404s/deadline changes/'applications closed', flag into admin review queue"
    - verifiedAt/isVerified fields exist but no automated refresh
  5. Notification preferences
    - Reminder cron sends email to everyone with saved roadmaps; no opt-out, no frequency choice
    - No in-app notification system (all email)
  6. Document version comparison
    - Document model has parentDocumentId for version chains, improvementScore field
    - No UI to compare versions side-by-side or show improvement over time
  7. Scholarship "submit a listing" form
    - Recommended in DATA-STRATEGY.md Tier 3 for inbound supply
    - Would start flywheel on launch day, not built

  ---
  AI Opportunities

  1. Semantic scholarship search (embeddings pipeline exists but unused)
    - Backend has pgvector + HNSW index + vector_search_scholarships(embedding, limit) view
    - Could enable "scholarships for biomedical engineering PhD with industry experience" natural-language search
    - Current matcher is keyword-free; field matching does substring inclusion but no fuzzy/semantic
  2. Automated data enrichment at scale
    - scripts/enrich-scholarships.mjs uses AI to infer missing fields from existing text
    - Currently manual one-shot; could run on every import or nightly on incomplete records
    - Backend deep-extract (untracked recent addition) attempts this but report shows 6 failures / 10 attempts
  3. Personalized application guidance
    - Roadmap is deterministic steps; could use AI to generate scholarship-specific essay prompts, research-fit
  analysis, or "why you" bullets
    - Document review gives generic feedback; could be conditioned on scholarship requirements
  4. Duplicate detection
    - Backend has scripts/detectDuplicates.ts + scholarship_similarities table
    - Main app has no deduplication; same scholarship from multiple sources may appear twice
    - Could use embeddings for fuzzy matching across slightly different names/descriptions
  5. Automated deadline extraction
    - 80 of 234 scholarships missing deadline (per audit)
    - Could scrape source URLs + LLM extract "Application deadline: [date]" → queue for human approval
    - Backend deep-extract attempts this; quality TBD
  6. Chat widget context expansion
    - Currently uses AI for Q&A but doesn't pass user profile or saved scholarships as context
    - Could make recommendations ("Based on your profile, Chevening is a strong fit — deadline in 83 days")

  ---
  Security Concerns

  1. No rate limiting (highest priority)
    - Signup can drain email quota, AI endpoints can drain provider free tiers
    - No IP-based, user-based, or endpoint-based throttling
  2. Admin authz missing on POST /api/scholarships
    - Any authenticated user can create catalogue scholarships
    - Should require ADMIN_EMAIL check like other admin routes
  3. Storage bucket was public
    - MANUAL-TODO.md flagged: "Your students' CVs and personal statements are currently readable by anyone with the
  link. The documents storage bucket was created with public: true"
    - Fixed in code (bucket created private, /api/documents/[id]/file now auth-gates), but needs manual Supabase
  dashboard flip for existing bucket
  4. Document upload trusts client-supplied MIME
    - documents/route.ts trusts file.type for allow-list; no magic-byte sniffing
    - Combined with service-role storage writes, mislabeled file passes
  5. Secrets rotation pending
    - MANUAL-TODO.md lists 4 keys committed to git (Supabase service-role, Resend, AgentRouter, BazaarLink)
    - Code no longer reads them from source, but keys remain valid until rotated
  6. SMTP failure detail leaks outside production
    - auth/signup/route.ts returns raw SMTP error in 502 response when NODE_ENV !== "production"
    - Debug field is acceptable, but worth confirming NODE_ENV is reliably "production" in Vercel
  7. No RLS in main app
    - Backend has comprehensive RLS matrix + SECURITY DEFINER helpers
    - Main app has no RLS, relies entirely on app-layer checks (acceptable for current architecture, but worth noting)

  ---
  Performance Concerns

  1. In-memory match cache won't survive serverless
    - scholarships/match/route.ts uses Map cache — won't survive across Vercel instances
    - Low hit rate in multi-instance deploys (each instance has own cache)
    - Bounded at 500 entries, so acceptable for now
  2. Chat route runs 3 queries per message
    - chat/route.ts:109 runs scholarship.findMany({ take: 20 }) on every turn, only uses 5
    - Plus profile fetch + user fetch
  3. Matcher runs over up to 200 scholarships in JS
    - Per-request when uncached; 200 × scoring function with string operations
    - Could push scoring to SQL or pre-compute for active users
  4. No CDN for static assets
    - Fonts/images served from Vercel origin; Next.js image optimization helps but no explicit CDN config
  5. Document upload size unlimited beyond Supabase tier
    - Manual payment receipt capped at 5MB; main document upload has no app-layer size check (relies on Supabase limits)

  ---
  Database Observations

  Main App Schema (prisma/schema.prisma)
  - Flat, denormalized, pragmatic for MVP
  - Two indexes total (Scholarship on [isActive, deadline] and [country]) — light but adequate given query patterns
  - String[] arrays for eligibleCountries/fieldOfStudy/requiredDocuments — Postgres native, queryable with && operator,
  no join tables needed
  - No cycles, no soft deletes, no versioning (except Document.parentDocumentId for version chains)
  - Payment.status is free-text String not enum — typo becomes orphan row
  - RoadmapMilestone has good composite unique constraint [userId, scholarshipId, key] + indexes for reminder cron
  - No createdAt/updatedAt on Scholarship — sitemap has to fall back to verifiedAt (null for 195 scraped records)

  Backend Schema (smartscholar-backend/prisma/schema.prisma + database/*.sql)
  - Fully normalized 3NF design, 76 tables, dimension tables for everything
  - Proper use of numeric for money + currency_id FK (no float precision loss)
  - date vs timestamptz discipline
  - Soft deletes with partial unique indexes WHERE deleted_at IS NULL
  - Bilingual _ar columns with simple FTS config for Arabic
  - Trigger-maintained denormalized counters to avoid COUNT(*)
  - Scholarship versioning + per-field change logs
  - Comprehensive RLS: REVOKE ALL FROM PUBLIC, explicit grants, SECURITY DEFINER helpers for is_admin() / user_owns()
  - Indexing: GIN (tsvector), pg_trgm, HNSW cosine (m=16, ef_construction=64)
  - pgvector vector(1536) on ai_embeddings, but Prisma mirrors as Unsupported("vector(1536)")

  Dual-Schema Risk
  - Two schemas cannot coexist in production
  - Migrating from flat to normalized would require rewriting every query + migrating 234 scholarships + all user data
  - Migrating from normalized to flat would throw away months of backend work
  - Decision needed before launch

  ---
  Code Quality Observations

  Strengths
  - TypeScript strict mode enabled, builds pass
  - Consistent { success, error } envelope (though two conventions coexist)
  - Comments document why and past bugs — real asset
  - Zod used for API validation in some routes (scholarships/route.ts via api-utils.ts)
  - memo() on scholarship cards prevents unnecessary re-renders
  - Context pattern (ProfileProvider, CreditsProvider) eliminated 11→4 requests per dashboard load

  Weaknesses
  - Tests are thin: 2 test files (analytics.test.ts, chat-widget.test.tsx) for 141 source files
  - Highest-risk logic untested: payment webhook idempotency, credit-charge atomicity, matcher scoring
  - 43 console.log in review route (now gated behind AI_DEBUG, but previously logging user IDs + document URLs to
  production)
  - react-hooks/exhaustive-deps warnings on dashboard/compare, dashboard/profile, user-nav — can serve stale data
  - API validation inconsistent: api-utils.ts helpers used only by scholarships/route.ts, most routes hand-roll
  validation
  - Admin checks duplicated inline with inconsistent casing/trim

  ---
  Prioritized Roadmap (Highest → Lowest ROI)

  🔴 Critical Path to Launch (Do First — Launch Blockers)

  1. Resolve dual-schema decision (2h decision + 4–8h execution)
    - Decision: Ship main app flat schema; shelve backend normalized schema for post-launch
    - Why: Backend is unused, incompatible, and blocks nothing; shipping matters more than perfect architecture
    - Action: Document backend as "future data layer rewrite," remove from deploy, focus all energy on main app
    - ROI: Unblocks team focus; eliminates confusion; defers months of migration work
  2. Rotate exposed secrets (30 min)
    - Supabase service-role key (highest priority), AgentRouter, BazaarLink, Groq
    - Already removed from code; rotation closes the exposure window
    - ROI: Eliminates security liability before launch
  3. Fix storage bucket privacy (2 min)
    - Supabase dashboard → documents bucket → Settings → Public bucket OFF
    - ROI: Prevents student CV/personal statement leak; zero-downtime fix
  4. Add rate limiting to high-cost endpoints (3–4h)
    - Signup (email quota), AI review (provider quota), chat (provider quota)
    - Use upstash/ratelimit or simple in-memory sliding window (acceptable for Vercel single-region)
    - ROI: Prevents abuse, protects costs, required for production
  5. Add admin check to POST /api/scholarships (15 min)
    - Copy requireAdmin pattern from admin/payments/[id]/route.ts
    - ROI: Closes authz gap; prevents catalogue pollution
  6. Deploy + smoke test (1–2h)
    - Domain + DNS, Zoho SMTP verification, env vars in Vercel, manual payment details, confirm CRON_SECRET set
    - Real signup → onboarding → match → roadmap → upload → review → payment end-to-end test
    - ROI: Validates launch readiness; uncovers integration issues before real users
  7. Start user acquisition same day (ongoing)
    - Facebook groups, Telegram channels, university networks (per MANUAL-TODO.md, LAUNCH-KIT.md)
    - Why launch ROI is highest: Competition criterion "Results" needs calendar days, not code
    - Target: 20–50 signups, 5+ completed profiles, 3+ saved roadmaps, 1–2 testimonials before 23 August
    - ROI: Only way to score on "Results"; every day delayed loses a data point

  ---
  🟠 High-Value Post-Launch (Week 2–3)

  8. Fix AI review prompt alignment (30 min)
    - Rewrite ai-review.ts:48 for Masters/PhD audience ("graduate student applying to international scholarships")
    - Adjust scoring rubric (research/publications weighted higher, high school achievements removed)
    - ROI: Reviews become trustworthy for target audience; easy fix with high perception impact
  9. Improve data quality — 40 high-value scholarships (6–8h manual work)
    - Chevening, Fulbright, DAAD, Erasmus Mundus, Türkiye Bursları, MEXT, Chinese Govt, KAUST
    - Verify deadline, eligibleCountries, minimumGPA, requiredDocuments from official pages
    - Mark isVerified: true, set verifiedAt: now()
    - ROI: "40 scholarships you can trust" is stronger positioning than "234 scholarships (83% missing data)"
  10. Add "Report an error" button (2–3h)
    - One-click report per scholarship → creates ErrorReport row or emails admin
    - Shows "verified X days ago" badge when verifiedAt is recent
    - ROI: Crowdsources QA; trust signal; moat per DATA-STRATEGY.md
  11. Add "Submit a scholarship" form (3–4h)
    - Public form → creates PendingScholarship row → admin approval queue
    - ROI: Starts inbound supply flywheel; universities/NGOs will submit once traffic exists
  12. Unify admin helpers + add audit log (2–3h)
    - Extract requireAdmin(email) to src/lib/admin.ts, use everywhere
    - Create AdminAction model (userId, action, targetId, timestamp)
    - Log credit grants, payment approvals, scholarship creates
    - ROI: DRY; accountability; debugging

  ---
  🟡 Medium-Value Enhancements (Week 4–6)

  13. Add tests for highest-risk logic (6–8h)
    - Stripe webhook idempotency (duplicate stripeEventId returns success not error)
    - Credit consumption atomicity (reviewCredits >= 1 check inside transaction)
    - Matcher scoring (known profiles → expected fitScore ranges)
    - ROI: Prevents regressions in payment/credit logic (costly bugs); documents behavior
  14. Implement semantic scholarship search (8–12h)
    - Generate embeddings for main app's 234 scholarships (OpenAI/Voyage batch API)
    - Add embedding vector(1536) column to Scholarship, create HNSW index
    - Build /api/scholarships/semantic-search?q=... endpoint
    - ROI: "Find scholarships for biomedical engineering with industry experience" natural language — differentiator
  15. Refactor matcher scoring to be parameterized (4–6h)
    - Extract weights to config object, document scoring model
    - Write tests with known profiles
    - ROI: Tunable without code changes; testable; explainable to users
  16. Build automated deadline monitoring (6–8h)
    - Cron job: fetch sourceUrl for scholarships with verifiedAt < 7 days ago
    - Detect 404, "applications closed", deadline text change
    - Flag into admin review queue or auto-deactivate + email notice
    - ROI: Keeps data fresh; "verified 3 days ago" badge becomes real moat
  17. Add scholarship version comparison UI (4–6h)
    - Side-by-side diff viewer for document versions
    - Show improvementScore trend over uploads
    - ROI: Gamification; retention; proves value of AI review
  18. Mobile responsiveness audit (3–4h)
    - Test all flows at 375px, fix layout breaks
    - LAUNCH-PLAN.md states "your audience is overwhelmingly on phones"
    - Test all flows at 375px, fix layout breaks
    - LAUNCH-PLAN.md states "your audience is overwhelmingly on phones"
    - ROI: Prevents drop-off; accessibility

  ---
  🟢 Lower Priority / Future (Post-Launch, Data-Driven)

  19. Chat widget context expansion (3–4h)
    - Pass userProfile + savedScholarships to chat context
    - Enable "Based on your profile, Chevening is strong — deadline in 83 days"
    - ROI: Personalization; retention; only valuable once chat usage is validated
  20. Notification preferences (3–4h)
    - In-app toggle for reminder frequency (daily/weekly/off)
    - Email vs in-app notification choice
    - ROI: Reduces unsubscribes; only matters after reminder volume is non-zero
  21. Admin dashboard beyond payments (8–12h)
    - User analytics, scholarship performance, conversion funnels
    - ROI: Operational visibility; only valuable after launch when data exists
  22. Resurrect backend normalized schema as v2 data layer (4