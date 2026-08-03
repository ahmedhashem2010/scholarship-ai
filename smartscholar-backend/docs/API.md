# SmartScholar Backend — REST + PostgREST API

Two surfaces expose the same PostgreSQL schema:

1. **PostgREST** (`https://<db-project>.supabase.co/rest/v1`) — direct, RLS-filtered
   table/function access. Filtering, ordering, pagination and embedding are native
   (read "PostgREST" below before using).
2. **Application REST** (`https://smartscholar.org/api`) — Next.js route handlers on
   top of Prisma. Public routes are anonymous; protected routes require a Supabase
   JWT; `/admin/*` routes additionally require `ADMIN_EMAIL`.

> Auth identities come from Supabase Auth. The `users` table mirrors `auth.users`
> (`id = auth.uid()`) and is upserted by the profile API. Database and Auth live in
> **different** Supabase projects — a valid auth JWT works because RLS uses
> `auth.uid()` from the JWT.

## 1. Authentication

| Mode | Header | Use |
|---|---|---|
| Anonymous | `apikey: <anon_key>` | public reads, RPC search |
| Authenticated | `Authorization: Bearer <user_jwt>` + `apikey` | own rows, RPC |
| Service role | `Authorization: Bearer <service_role_key>` + `apikey` | **server-only** admin writes. Never ship to a browser |

The app layer adds cookie sessions via `@supabase/ssr` for its own routes; those
routes accept the cookie automatically. All responses are JSON.

## 2. Conventions

### 2.1 Response envelope (application REST)

```json
{
  "success": true,
  "data": { },
  "pagination": { "page": 1, "pageSize": 20, "total": 234 }
}
```

Errors use HTTP status +:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "closing_date must be after opening_date" }
}
```

### 2.2 Error format (PostgREST)

PostgREST errors follow the pgrst standard:

```json
{ "code": "42501", "message": "new row violates row-level security policy", "details": "…", "hint": null }
```

| HTTP | code | Meaning |
|---|---|---|
| 400 | `22P02` | invalid UUID / enum value in a filter |
| 401 | `PGRST301` | missing or invalid JWT |
| 403 | `42501` | RLS blocked the row |
| 404 | `PGRST116` | row not found (single-row request) |
| 429 | `PGRST104` | rate limited |
| 500 | `PGRST` | server / SQL error |

### 2.3 Query params (PostgREST)

| Param | Example | Notes |
|---|---|---|
| `select` | `select=id,title,provider:providers(name)` | embedding of related tables |
| `order` | `order=next_deadline.asc.nullslast` | |
| `limit` / `offset` | `limit=25&offset=0` | cap 1000 |
| `Range` header | `Range: 0-24` | alternative pagination; response carries `Content-Range` |
| `count` | `count=exact` | total for pagination |

Filters use `column=eq.value` or bare `column=value`; operators: `eq, neq, gt,
gte, lt, lte, like, ilike, in, is, fts, wfts, cs, cd, ov`.

### 2.4 Rate limiting

| Tier | Limit | Burst |
|---|---|---|
| Anonymous | 60 req/min | 100 |
| Authenticated | 300 req/min | 500 |
| Service-role / admin | 1200 req/min | 2000 |
| AI routes (`/api/ai/*`) | 20 req/min | 40 |

Enforced per IP (anonymous) or per user id (authenticated) at the edge; violations
return `429` with a `Retry-After` header. Import/verification admin endpoints are
additionally gated on `CRON_SECRET`/`ADMIN_EMAIL` where applicable.

## 3. Scholarships

### 3.1 List

`GET /rest/v1/scholarships` — PostgREST (any auth tier; RLS = anon+auth read)

Filters: `country_id`, `provider_id`, `university_id`, `degree_level_id`,
`study_field_id`, `funding_type`, `is_fully_funded`, `is_featured`, `status`,
`verification_status`, `closing_date`, `minimum_age`, `maximum_age`.

```http
GET /rest/v1/scholarships?select=id,slug,title,closing_date&order=closing_date.asc&limit=20
```

App equivalent:

`GET /api/scholarships` — public
Query: `country, provider, university, degree, field, funding, is_fully_funded,
is_featured, q, page, pageSize, sort`.
Response: `{ success, data: [{ id, slug, title, titleAr, country, provider, university,
closingDate, fundingType, isFullyFunded, competitionLevel }], pagination }`.

### 3.2 Detail

- `GET /rest/v1/scholarships?id=eq.<uuid>` or by slug `?slug=eq.<slug>` (PostgREST)
- `GET /api/scholarships/:id` and `GET /api/scholarships/by-slug/:slug` (public)

App detail response includes the full `v_scholarships` read model: benefits,
required documents, test requirements, current cycle dates, eligible countries,
languages, `similarScholarships` (top 6).

### 3.3 Search

`POST /rest/v1/rpc/search_scholarships` — public (RPC)

```json
{ "query": "software engineering germany", "p_limit": 25, "p_offset": 0 }
```

```json
{
  "id": "…", "slug": "…", "title": "…", "rank": 0.478,
  "next_deadline": "2027-01-15T00:00:00Z"
}
```

Ranked full-text (`search_vector`, weight A on title) with trigram fallback
(`%query%`). App equivalent: `GET /api/scholarships/search?q=…`.

### 3.4 Vector (semantic) search

`POST /rest/v1/rpc/vector_search_scholarships` — public (RPC)

```json
{ "embedding": [0.0012, …1536 floats…], "p_limit": 10 }
```

Top-k by cosine over the `ai_embeddings` HNSW index. Returns scholarship rows.
Client code should call `generateEmbeddings`-style embedding of the query first.

### 3.5 Similar scholarships

`POST /rest/v1/rpc/similar_scholarships` — public (RPC)

```json
{ "p_scholarship_id": "<uuid>", "p_limit": 6 }
```

Blends embedding cosine with shared field/country/degree overlap.

### 3.6 Curated views (PostgREST `select=*` on views)

| View | Meaning |
|---|---|
| `v_scholarships` | full read model (use for detail pages) |
| `v_scholarship_search` | flattened, filter-ready rows |
| `v_scholarships_open` | `closing_date >= CURRENT_DATE` or open deadline, `status = ACTIVE` |
| `v_scholarships_featured` | featured + active + verified |
| `v_scholarships_fully_funded` | `is_fully_funded` |
| `v_scholarships_no_ielts` | no mandatory IELTS |

App equivalents: `GET /api/scholarships/featured`, `/open`, `/fully-funded`, `/no-ielts`.

### 3.7 Write (admin / service role)

- `POST /rest/v1/scholarships` (RLS: admin only; anon/student get `42501`)
- `PATCH /rest/v1/scholarships?id=eq.<uuid>`
- `DELETE /rest/v1/scholarships?id=eq.<uuid>` — hard delete; soft deletes via
  `PATCH {"deleted_at": now()}`

Writes trigger `scholarship_versions` + `scholarship_change_logs` snapshots and,
for UNVERIFIED rows, enqueue into `verification_queue`.

## 4. Universities & Providers

| Route | Auth | Notes |
|---|---|---|
| `GET /rest/v1/universities` | anon | filter `country_id`, `is_featured`, `status` |
| `GET /rest/v1/rpc/…` | — | no RPCs defined yet |
| `GET /api/universities` | public | paginated, `country` filter |
| `GET /api/universities/:id` | public | includes campuses + featured scholarships |
| `GET /rest/v1/providers` | anon | filter `provider_type`, `country_id` |
| `GET /api/providers` | public | paginated |
| `GET /api/providers/:id` | public | includes `scholarships` |

Admin writes (`POST`/`PATCH`/`DELETE`) are admin-only under RLS.

## 5. Applications

All `/applications/*` routes require a signed-in user and are owner-scoped by RLS.

- `GET /rest/v1/applications?user_id=eq.<uid>` — own applications (or admin)
- `GET /api/applications` — current user's applications, `status` filter
- `POST /api/applications` — `{ scholarship_id, cycle_id?, status? }`
- `PATCH /api/applications/:id` — `{ status, progress, application_url, notes }`
- `DELETE /api/applications/:id` — soft delete
- `GET /api/applications/:id/stages` / `POST /api/applications/:id/stages`
- `GET|POST|PATCH /api/applications/:id/tasks`
- `GET|POST|PATCH /api/applications/:id/documents`

`progress` is recomputed by `update_application_progress()` whenever stages change
(`trg_application_progress`). `v_applications` gives the read model with
stage/task counts and next due date.

## 6. Saved & Favorites

| Route | Auth | Notes |
|---|---|---|
| `GET /rest/v1/saved_scholarships?user_id=eq.<uid>` | owner/admin | `notes` column |
| `POST /rest/v1/saved_scholarships` | owner | body `{ user_id, scholarship_id, notes }` |
| `DELETE /rest/v1/saved_scholarships?id=eq.<uuid>` | owner/admin | |
| `GET /rest/v1/favorites?user_id=eq.<uid>` | owner/admin | |
| `POST /rest/v1/favorites` | owner | body `{ user_id, scholarship_id }` |
| `DELETE /rest/v1/favorites?id=eq.<uuid>` | owner/admin | |

App equivalents: `GET/POST/DELETE /api/saved-scholarships`, `/api/favorites`.
Saving/favoriting bumps the trigger-maintained `save_count`/`favorite_count`
counters.

## 7. Profiles

- `GET /api/user/profile` — current user (cached 24h) — always `success: true`,
  empty strings when no profile exists
- `POST /api/user/profile` — onboarding upsert (creates `users` row first, then
  `user_profiles`)
- `PUT /api/user/profile` — edit page update
- `GET /rest/v1/user_profiles?user_id=eq.<uid>` — PostgREST owner view
- `v_user_profiles` view exposes education/languages/test scores/finance as jsonb

Profile-linked collections (`user_education`, `user_test_scores`, `user_languages`,
`user_preferences`, `user_settings`, `user_documents`, …) are all owner-or-admin
under RLS and reached via `GET /api/user/<collection>` or direct PostgREST.

## 8. AI

All `/api/ai/*` require auth and are owner-scoped.

| Route | Method | Purpose |
|---|---|---|
| `/api/ai/chats` | POST | create chat `{ title?, context? }` → chat id |
| `/api/ai/chats` | GET | list own chats |
| `/api/ai/chats/:id/messages` | GET | message history |
| `/api/ai/chats/:id/messages` | POST | send message; streams reply; writes `ai_chat_messages` (tokens, provider, latency) |
| `/api/ai/reviews` | POST | `{ user_document_id?, review_type }` → queues CV/essay review |
| `/api/ai/reviews` | GET | own reviews (incl. `score`, `strengths`, `weaknesses`, `suggestions`) |
| `/api/ai/reports` | POST/GET | acceptance prediction / analysis reports (`ai_reports`) |
| `/api/ai/predictions` | GET | `acceptance_predictions` for a scholarship |
| `/api/ai/match` | POST | run matching job → `ai_matching_jobs` |
| `/api/scholarships/match` | GET | cached (24h) matched scholarships for current profile |

PostgREST equivalents: rows in `ai_chats`, `ai_chat_messages`, `ai_reviews`,
`ai_reports`, `acceptance_predictions`, `ai_matching_jobs` (owner-or-admin RLS);
`vector_search_scholarships` RPC for embedding search.

## 9. Notifications & Email

- `GET /rest/v1/notifications?user_id=eq.<uid>` — owner; `status`, `type` filters
- `PATCH /rest/v1/notifications?id=eq.<uuid>` — owner may only set `read_at`
- `GET /api/notifications` — current user, unread first
- `POST /api/notifications/:id/read` — mark read
- `emails` table is **server-only** (RLS: owner read, admin write). No public
  endpoint exposes outbound email bodies.

## 10. Imports (admin)

Every route below is admin-only (middleware + RLS + `ADMIN_EMAIL`).

| Route | Purpose |
|---|---|
| `GET /rest/v1/import_batches` | list batches, `status` filter |
| `GET /rest/v1/import_queue_items?batch_id=eq.<uuid>` | items in a batch |
| `GET /rest/v1/rpc/import_dedupe` → `POST` | body `{ p_queue_item_id }` — title-similarity dedupe, returns existing id |
| `POST /rest/v1/rpc/process_import_item` | body `{ p_queue_item_id }` — hash → dedupe → upsert → version → enqueue verification |
| `POST /rest/v1/rpc/merge_scholarships` | body `{ p_keep_id, p_remove_id }` — repoint FKs, archive, resolve duplicates |
| `GET /rest/v1/v_import_queue` | queue + batch + status counts |

Prefer running the pipeline via `scripts/importScholarships.ts` (see
[IMPORT_GUIDE.md](./IMPORT_GUIDE.md)); the RPCs are for incremental/re-crawl
processing of already-enqueued items.

## 11. Verification (admin)

| Route | Purpose |
|---|---|
| `GET /rest/v1/verification_queue?status=eq.PENDING` | queue (admin) |
| `GET /rest/v1/v_verification_queue` | queue + scholarship title/status |
| `POST /rest/v1/rpc/…` | none — use the app routes below |
| `GET /api/admin/verification` | pending queue, summary |
| `POST /api/admin/verification/:id/approve` | `verification_status=VERIFIED`, resolves queue |
| `POST /api/admin/verification/:id/reject` | body `{ reason }` → `REJECTED` |
| `GET /rest/v1/duplicates?status=eq.OPEN` | open duplicate pairs |
| `GET /rest/v1/v_duplicates_pending` | open pairs view |

Scripted workflow: `scripts/verifyScholarships.ts` (`--approve` / `--reject`).

## 12. Admin

All under `/api/admin/*` (e.g. `/api/admin/payments`, `/api/admin/users`,
`/api/admin/scholarships`). Gated on `ADMIN_EMAIL` in middleware **and** in each
handler. Service-role key only ever used server-side.

## 13. DB function endpoints (RPC summary)

| Function | Method | Public? | Request body |
|---|---|---|---|
| `search_scholarships` | POST `/rest/v1/rpc/search_scholarships` | yes | `{ query, p_limit?, p_offset? }` |
| `vector_search_scholarships` | POST `/rest/v1/rpc/vector_search_scholarships` | yes | `{ embedding: float[1536], p_limit? }` |
| `similar_scholarships` | POST `/rest/v1/rpc/similar_scholarships` | yes | `{ p_scholarship_id, p_limit? }` |
| `sync_scholarship_dates` | POST `/rest/v1/rpc/sync_scholarship_dates` | admin | `{ p_scholarship_id }` |
| `upsert_embedding` | POST `/rest/v1/rpc/upsert_embedding` | admin | `{ p_entity_type, p_entity_id, p_content, p_embedding, p_provider?, p_model? }` |
| `import_dedupe` | POST `/rest/v1/rpc/import_dedupe` | admin | `{ p_queue_item_id }` |
| `process_import_item` | POST `/rest/v1/rpc/process_import_item` | admin | `{ p_queue_item_id }` |
| `merge_scholarships` | POST `/rest/v1/rpc/merge_scholarships` | admin | `{ p_keep_id, p_remove_id }` |

Only public functions are granted to `anon`/`authenticated` (see
`016_permissions.sql`); the rest are service-role/admin.
