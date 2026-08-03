# SmartScholar Backend — Security

## 1. Trust model

Actors and what they may touch:

| Actor | Identity | Can |
|---|---|---|
| Anonymous | no JWT / `apikey` | SELECT on public dimensions + content + views, RPC search/similar |
| Student (authenticated) | Supabase JWT | own rows (profiles, docs, applications, saves, AI), public reads |
| Counselor | JWT + role `COUNSELOR` | `is_moderator()` on public content |
| Admin / Super admin | JWT + role, `ADMIN_EMAIL` | writes on content, imports, verification, ops tables |
| Server (Next.js / scripts) | service_role | bypasses RLS for trusted workflows (email queue, import, reminders) |
| Scraper / bot | anonymous | bounded by rate limits; output flows through the import pipeline |

**Trust boundaries**

```
Browser ──(anon/authenticated JWT)──▶ PostgREST ──▶ RLS-filtered rows
Browser ──(cookie)───────────────────▶ Next.js   ──▶ Prisma (service role, server-only)
Ops scripts (cron/admin) ────────────▶ Prisma/PostgREST (service role / admin)
```

A JWT from the Auth project does **not** grant DB privileges by itself — RLS and
`016_permissions.sql` (grants) decide what a role can see and write.

## 2. Row-Level Security (RLS)

RLS is enabled on **every** table (`009_rls.sql`). Policy matrix (write = INSERT/UPDATE/DELETE):

| Table group | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| dimensions (continents, countries, cities, currencies, languages, degree_levels, study_fields) | anon + auth | admin | admin | admin |
| content (universities, campuses, providers, departments, scholarships + `scholarship_*`, sources) | anon + auth | admin | admin | admin |
| blogs | anon (published), auth (all) | admin | admin | admin |
| events / event_attendees | anon + auth | admin | admin | admin |
| scholarship_reviews | anon + auth | owner | owner or admin | owner or admin |
| users | self or admin | self (`id = auth.uid()`) | self or admin | admin |
| user_* (profiles, education, documents, settings…) + saved_scholarships + favorites | owner or admin | owner | owner or admin | owner or admin |
| applications + application_stages/tasks/documents | owner or admin (counselor: SELECT) | owner | owner or admin | owner or admin |
| ai_* + acceptance_predictions + search_history | owner or admin | owner | owner or admin | owner or admin |
| notifications | owner (UPDATE: `read_at` only) | server | owner (`read_at`) | admin |
| emails | owner or admin | server | admin | admin |
| payments | owner (SELECT) or admin | server | admin | admin |
| import_*, scholarship_versions, change_logs, duplicates, verification_queue, audit/activity/analytics, daily_metrics, cron_runs, app_settings | admin | admin (authenticated may write analytics_events) | admin | admin |

Policies are powered by SECURITY DEFINER helpers `is_admin()`,
`is_moderator()`, `current_user_id()`, `user_owns(uuid)` (`006_functions.sql`).
`grant`/`revoke` in `016_permissions.sql` remove `PUBLIC` access entirely, so a
leaked key still hits RLS + grants.

## 3. Service-role policy

- `service_role` bypasses RLS and is used **only** by server code / ops scripts.
- Never ship the service-role key to the browser; `NEXT_PUBLIC_*` vars are the
  anon key at most.
- Server routes that touch user data still scope by `auth.uid()` themselves — the
  service role is not an excuse to drop ownership checks.
- Secrets live in `.env` (gitignored) and Vercel project settings; `.env.example`
  is the committed, value-free template.

## 4. Storage security (`011_storage.sql`)

| Bucket | Public | Policy |
|---|---|---|
| `student-documents` | **no** | owner upload/read/update/delete via `(storage.foldername(name))[1]::uuid = auth.uid()` OR admin |
| `scholarship-assets` | yes | anon read; writes restricted |
| `scholarship-pdfs` | yes | anon read |
| `logos` | yes | anon read |
| `avatars` | yes | anon read |

Private documents are only served via **signed URLs** (15-minute default
expiry) generated server-side; the DB never stores a public `file_url` for private
documents — `user_documents.file_url` is RLS-hidden beyond the owner.

## 5. Audit & activity logging

| Log | Writes | Contents |
|---|---|---|
| `audit_logs` | trigger `trg_audit` on users/universities/providers/applications | action, old/new jsonb, ip, user agent |
| `activity_logs` | `record_activity()` | user actions (SAVE, APPLY, REVIEW, MATCH…) |
| `scholarship_change_logs` | `trg_scholarship_version` + import/update scripts | per-field diffs |

**Never log document content or full AI response bodies.** `AI_DEBUG` gates
verbose AI logs and stays **off in production** (responses can contain fragments
of student documents). `audit_logs`/`activity_logs` keep ip/user-agent metadata
but no file payloads. Retention: activity/audit ≥ 180 days, change logs forever
(they are the scholarship history).

## 6. Soft deletes

Content and user tables carry `deleted_at`; views filter `deleted_at IS NULL`.
Deletes are recoverable and auditable (`SOFT_DELETE` action). Hard `DELETE` is
admin-only and reserved for GDPR erasure + duplicate cleanup. Partial unique
indexes (`users_email_unique_partial`) guarantee a re-register after soft-delete
is possible.

## 7. Input validation

- CHECK constraints (`005_constraints.sql`) enforce ranges in the DB (rating 1–5,
  difficulty 1–10, `scholarship_id <> similar_scholarship_id`, non-negative
  counters) — the app validates too, but the DB is the last line.
- Enums are real PG types; unknown values fail with `22P02`.
- API routes parse/coerce before writing; dates are `date`-typed, money is
  `numeric(12,2)` (no floats).
- PostgREST filters are typed — passing a bad UUID/enum returns a 400, not an
  injection.

## 8. SQL injection resistance

- All Prisma queries and all `$queryRaw`/`$executeRaw` calls in `scripts/` are
  parameterized. Function identifiers are static strings; only values are bound.
- PostgREST generates SQL server-side from typed operators — never concatenates
  user input.
- `search_vector` is a **generated** column (`simple` config) — there is no raw
  user text executed.

## 9. Rate limiting

Edge-enforced: anonymous 60/min, authenticated 300/min, service/admin 1200/min,
AI routes 20/min (see [API.md](./API.md#24-rate-limiting)). Import/reminder cron
routes require `CRON_SECRET`. Verification/admin actions require `ADMIN_EMAIL`.

## 10. AI data handling

- Provider chain Groq → Gemini → BazaarLink → AgentRouter; keys in env only.
- `AI_DEBUG` off in production (response bodies may include document fragments).
- Document content is sent to the AI provider for reviews only after explicit
  user action; the review request itself is stored (`ai_reviews.content`) owner-
  scoped, not in logs.
- Embeddings are stored per-entity with a `content_hash`; `ai_embeddings` rows are
  admin-only and never exposed via public queries.

## 11. GDPR & data residency

- DB (PostgreSQL) lives in **Tokyo** (Supabase `fpgn…`); Auth lives in the **US**
  (`kkqh…`). Reassess when adding EU-heavy user segments.
- Consent: `marketing_opt_in`, `sms_notifications`, `is_public` flags default
  off; emails are transactional by default.
- Erasure: admin hard-delete for GDPR (`DELETE` on `users` + cascades), soft
  `DELETE`/`DISABLED` for normal account closure.
- `emails`/`notifications` retain delivery metadata (needed for the "we email you
  before each step" promise) with a 180-day retention target.
- Export: `GET /api/user/profile` + owner-scoped PostgREST cover most of an
  Article-15 data-portability request.
