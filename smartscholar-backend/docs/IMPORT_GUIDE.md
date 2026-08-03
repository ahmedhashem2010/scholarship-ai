# SmartScholar — Import Guide

How to run the scraper/import pipeline end-to-end, from a raw source to a
verified, embedded scholarship.

```
source (crawl) → import_batches → import_queue_items
   → [script] extract (HTML/PDF/AI) → extracted jsonb
   → import_dedupe(): pg_trgm title similarity → duplicates table
   → upsert scholarships (new row or update) → scholarship_versions
   → trigger: verification_queue (UNVERIFIED) + sync_scholarship_dates()
   → [script] generateEmbeddings → ai_embeddings + needs_embedding=false
   → [admin] verify → verification_status=VERIFIED → published views pick it up
```

## 1. Prerequisites

```bash
cd smartscholar-backend
npm install
cp .env.example .env          # set DATABASE_URL (pooler / local)
npx prisma generate           # build the Prisma client from prisma/schema.prisma
```

## 2. Steps

### 2.1 Create a source

A `sources` row records where data comes from. Insert one (or use an existing
`source_id`):

```sql
INSERT INTO sources (name, base_url, source_type, crawler_frequency)
VALUES ('for9a.com', 'https://www.for9a.com', 'SCRAPER', 'daily')
ON CONFLICT DO NOTHING;
```

### 2.2 Create a batch → queue items

`scripts/importScholarships.ts` does the whole job: it upserts the source,
creates the `import_batches` row (`status=PROCESSING`), and creates one
`import_queue_items` row per record. You do **not** need to pre-create batches.

### 2.3 Extract

Extraction happens inside the pipeline — JSON/CSV rows already carry
`extracted` jsonb (the script stores the record there). For HTML/PDF crawls,
extract before calling the script so each record is a flat object:

```json
{
  "title": "KAUST Visiting Student Research Program",
  "provider": "KAUST",
  "country": "SA",
  "degree_level": "master",
  "funding_type": "FULLY_FUNDED",
  "opening_date": "2026-09-01",
  "closing_date": "2027-01-15",
  "application_url": "https://vsrp.kaust.edu.sa",
  "official_website": "https://www.kaust.edu.sa"
}
```

### 2.4 Dedupe

Per record the script computes `content_hash = sha256(canonical_json(record))`
and checks for a duplicate before writing:

- If the DB function **`import_find_duplicate(text)`** exists (015_imports.sql),
  it is called first via `$executeRaw`; any returned id marks the item
  `DUPLICATE`.
- Otherwise a **local title-similarity** fallback runs: normalized token Jaccard
  against existing scholarship titles, threshold ≥ 0.85.
- The SQL function **`import_dedupe(uuid)`** (used by `process_import_item`)
  does the pg_trgm version: `similarity(title, existing.title) > 0.85` → inserts
  a `duplicates` row → returns the existing scholarship id.

```sql
-- manual equivalent for one already-enqueued item:
SELECT import_dedupe('<queue_item_id>');
```

### 2.5 Upsert + version + enqueue verification

The script upserts the scholarship **by slug** (idempotent across re-crawls),
creates a `scholarship_versions` snapshot (`CREATE`/`UPDATE`), upserts a
`verification_queue` row (unless the row is already `VERIFIED`/`REJECTED`), and
creates a `scholarship_cycles` row so `sync_scholarship_dates()` has data.

The SQL pipeline function does the same in one call:

```sql
SELECT process_import_item('<queue_item_id>');
```

### 2.6 Sync dates

After an import, recompute `scholarships.next_deadline` and the display dates:

```bash
npx tsx scripts/syncDeadlines.ts
```

(`sync_scholarship_dates(uuid)` is also called by the cycle triggers on every
cycle change.)

### 2.7 Generate embeddings

```bash
npx tsx scripts/generateEmbeddings.ts --entity scholarship --limit 500
```

Falls back to deterministic hashing vectors when no embedding API is configured,
so the pipeline is testable offline (clearly logged per row as FALLBACK).

### 2.8 Verify (admin)

```bash
npx tsx scripts/verifyScholarships.ts                 # list pending
npx tsx scripts/verifyScholarships.ts --approve <id>
npx tsx scripts/verifyScholarships.ts --reject <id> --reason "Broken link"
```

## 3. `scripts/importScholarships.ts`

```
npx tsx scripts/importScholarships.ts <file.json|file.csv> [--source-name NAME] [--source-type TYPE] [--source-url URL]
```

- **JSON**: array of records, or `{ "source_name": …, "items": […] }`.
- **CSV**: first row is the header; column names are the snake_case field names
  below.
- Supported columns (all optional except `title`): `slug, title, title_ar,
  description, description_ar, seo_description, provider, provider_id, country,
  country_id, university, university_id, degree_level, degree_level_id,
  funding_type, application_fee, application_url, official_website,
  official_pdf_url, opening_date, closing_date, interview_date, results_date,
  enrollment_date, minimum_age, maximum_age, minimum_gpa, gpa_scale,
  minimum_percentage, maximum_gap_years, is_fully_funded, is_featured,
  is_active, status, verification_status, difficulty_score, competition_level,
  acceptance_rate, ai_summary, ai_tips, application_process, selection_process,
  source_url, needs_embedding, cycle_label`.
- `provider`/`country`/`university`/`degree_level` given as names/slugs are
  resolved (providers/universities are created on demand; universities need a
  resolvable country). Explicit `*_id` values win.
- Exit code: `0` all succeeded, `1` if any row failed (batch still finalizes to
  `PARTIAL`/`COMPLETED`).

## 4. Worked example

Input `data/daad.json`:

```json
{
  "source_name": "for9a.com",
  "source_url": "https://www.for9a.com",
  "items": [
    {
      "slug": "daad-helmholtz-scholarships",
      "title": "DAAD Helmholtz-Humboldt Research Awards",
      "provider": "DAAD",
      "country": "DE",
      "degree_level": "doctorate",
      "funding_type": "FULLY_FUNDED",
      "opening_date": "2026-08-01",
      "closing_date": "2026-11-30",
      "application_url": "https://www.daad.de/helmholtz",
      "official_website": "https://www.daad.de",
      "is_fully_funded": true
    },
    {
      "title": "DAAD Helmholtz-Humboldt Research Awards",
      "provider": "DAAD",
      "country": "DE"
    }
  ]
}
```

> Row 2 is a deliberate near-duplicate of row 1 (same title) — run the import
> twice to see dedupe in action.

```bash
npx tsx scripts/importScholarships.ts data/daad.json
```

Run 1:

```
[import] file=data/daad.json records=2 source=for9a.com
[import] per-row results
  CREATED     daad-helmholtz-scholarships                            <scholarship_id>
  CREATED     daad-helmholtz-humboldt-research-awards-2              <scholarship_id>
[import] summary
  batch id        <uuid>
  batch status    COMPLETED
  total           2
  succeeded       2
  failed          0
  duplicates      0
```

Run 2 (same file) — content hashes match, titles are similar:

```
  CREATED     daad-helmholtz-scholarships                     (same, updated)
  DUPLICATE   daad-helmholtz-humboldt-research-awards-2       duplicate of <id>
```

Then:

```bash
npx tsx scripts/syncDeadlines.ts
npx tsx scripts/generateEmbeddings.ts --entity scholarship
npx tsx scripts/verifyScholarships.ts --approve <queue_id>
```

Inspect the result:

```sql
SELECT s.slug, s.verification_status, s.next_deadline,
       (SELECT count(*) FROM scholarship_versions v WHERE v.scholarship_id = s.id) AS versions
FROM scholarships s WHERE s.slug LIKE 'daad-%';

SELECT i.status, i.content_hash, i.scholarship_id
FROM import_queue_items i ORDER BY i.created_at DESC LIMIT 2;
```

## 5. Same pipeline via PostgREST / curl

Enqueue + process + dedupe without the script:

```bash
# 1. batch
curl -sS "$REST/import_batches" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -d '{"source_type":"SCRAPER","source_name":"for9a.com","status":"PENDING","total_items":1}'

# 2. queue item
curl -sS "$REST/import_queue_items" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -d '{"batch_id":"<batch_id>","raw_payload":{...},"extracted":{...},"status":"PENDING"}'

# 3. process (hash → dedupe → upsert → version → enqueue verification)
curl -sS -X POST "$REST/rpc/process_import_item" -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" -H "Content-Type: application/json" \
  -d '{"p_queue_item_id":"<queue_item_id>"}'

# 4. manual dedupe re-check
curl -sS -X POST "$REST/rpc/import_dedupe" -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" -d '{"p_queue_item_id":"<queue_item_id>"}'
```

## 6. Reset & re-run

Drop the operations tables to start clean (see `017_cleanup.sql`):

```sql
TRUNCATE verification_queue, duplicates, scholarship_change_logs,
         scholarship_versions, import_queue_items, import_batches CASCADE;
```

Re-run the import. To wipe scholarships too: `TRUNCATE scholarships CASCADE;`
then re-seed (`npm run db:seed`).
