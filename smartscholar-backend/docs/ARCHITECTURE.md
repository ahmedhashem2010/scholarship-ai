# SmartScholar Backend — Architecture

## 1. Repository layout

```
smartscholar-backend/
├── database/
│   ├── 001_extensions.sql       # extensions only
│   ├── 002_enums.sql            # all enum types
│   ├── 003_tables.sql           # all 76 tables (3NF)
│   ├── 004_indexes.sql          # PK/unique/FK-backed + GIN + trigram + HNSW
│   ├── 005_constraints.sql      # CHECK constraints & invariants
│   ├── 006_functions.sql        # helper + admin + scoring functions
│   ├── 007_triggers.sql         # counter, slug, audit, sync triggers
│   ├── 008_views.sql            # read-model views
│   ├── 009_rls.sql              # row-level security policies
│   ├── 010_seed.sql             # reference data seed
│   ├── 011_storage.sql          # Supabase storage buckets + policies
│   ├── 012_search.sql           # full-text + trigram search
│   ├── 013_embeddings.sql       # pgvector search
│   ├── 014_analytics.sql        # analytics events + daily rollups
│   ├── 015_imports.sql          # scraper/import/verification pipeline
│   ├── 016_permissions.sql      # grants
│   └── 017_cleanup.sql          # teardown (reverse order)
├── prisma/
│   └── schema.prisma            # app-layer mirror of the SQL schema
├── docs/                        # this documentation set
├── scripts/                     # Node/TS operational scripts
└── tools/
    └── validate.mjs             # SQL ↔ Prisma ↔ doc consistency checker
```

## 2. Layering

```
Browser / Mobile
   │  (Supabase Auth cookies / JWTs)
   ▼
Next.js app (Vercel)            ────  Prisma Client  ───┐
   │                                                    │
   │  service_role (server-only ops)                    │
   ▼                                                    ▼
Supabase Auth  ◀──users.id = auth.uid()──▶  PostgreSQL  (via Supavisor pooler)
   │                                                ▲
   │   anon/authenticated (RLS-filtered)             │
   └──PostgREST (when calling DB directly)───────────┘
   │
   ▼
Supabase Storage   ──  private `student-documents` bucket, owner-scoped
   │
   ▼
Zoho SMTP / Stripe / AI providers (Groq→Gemini→BazaarLink→AgentRouter)
```

- **Auth** is Supabase Auth. The `users` table is a profile extension
  (`id = auth.uid()`) upserted by the profile API — auth and DB stay two
  Supabase projects, as in the app.
- **Server code** uses the service role and bypasses RLS for trusted
  workflows (email queue, import pipeline, reminder cron).
- **Any direct DB access** (PostgREST, edge functions) is filtered by RLS.

## 3. Data flow — scholarship ingest (scraper pipeline)

```
source (crawl) → import_batches → import_queue_items
   → [script] extract (HTML/PDF/AI) → extracted jsonb
   → import_dedupe(): pg_trgm title similarity → duplicates table
   → upsert scholarships (new row or update) → scholarship_versions
   → trigger: verification_queue (UNVERIFIED) + sync_scholarship_dates()
   → [script] generateEmbeddings → ai_embeddings + needs_embedding=false
   → [admin] verify → verification_status=VERIFIED → published views pick it up
```

## 4. Data flow — student

```
signup (auth) → users row + defaults (trigger) → profile (user_profiles + history)
  → match (app scoring + vector_search_scholarships) → save/favorite/apply
  → application → stages → tasks (progress trigger) → documents
  → reminders cron: v_upcoming_deadlines → notifications + emails
```

## 5. AI provider chain

`scripts` and app both call providers in order: **Groq → Gemini → BazaarLink →
AgentRouter**, falling through on missing key / HTTP error. Every call logs to
`ai_chat_messages` / `ai_reviews` / `ai_reports` with provider + model + latency.
`AI_DEBUG` gates verbose logs (response bodies may contain student documents).

## 6. Concurrency & idempotency

- `gen_random_uuid()` PKs make inserts collision-free; import upserts key on
  `slug` or `source_url` hash to stay idempotent across re-crawls.
- Counters are updated by triggers in the same transaction as the write —
  no read-modify-write races.
- Email reminders dedupe on `(user_id, scholarship_id, task_id, due_date)` in
  `v_upcoming_deadlines` + a unique guard in `notifications` insert logic.

## 7. Backup, migration, deployment

| Concern | Approach |
|---|---|
| Schema migration | Apply SQL files 001→016 in order on a branch DB, then `prisma db pull` |
| Data migration | `scripts/importScholarships.ts`, `scripts/updateScholarships.ts` |
| Backup | Supabase daily backups + nightly `pg_dump` of critical tables |
| Deploy | `tools/validate.mjs` gate → apply SQL → `prisma generate` → Vercel |
| Rollback | `017_cleanup.sql` tears down to a bare schema |

## 8. Security posture

See [SECURITY.md](./SECURITY.md). TL;DR: RLS on all tables, service-role only on
server, private storage bucket for documents, audit + activity logs, soft
deletes, secrets in `.env` only, AI logging off in production.
