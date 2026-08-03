# SmartScholar — Seed Guide

Populate the backend DB with dimensions, providers, universities and a starter
set of scholarships — either from the SQL seed or from `scripts/seed.ts`.

## 1. SQL seed (`database/010_seed.sql`)

The canonical reference seed shipped with the schema:

- **Dimensions**: continents, countries, cities, currencies, languages,
  degree_levels, study_fields.
- **Providers**: DAAD, KAUST, University of Tokyo, Orange Corners, Mastercard
  Foundation, Erasmus Mundus (6).
- **Universities** (a handful per provider country).
- **Scholarships** with `scholarship_cycles`, `scholarship_requirements`,
  `scholarship_benefits`, `scholarship_fields_of_study`, and `verification_queue`
  rows (so the verification flow has sample data).

```bash
# apply extensions → enums → tables → constraints → indexes → functions → rls
# → permissions → storage → seed → analytics → cleanup (see the doc header)
psql "$DIRECT_URL" -f database/010_seed.sql
```

Every seed row is inserted with `ON CONFLICT ... DO UPDATE`, so re-running the
seed is idempotent.

## 2. Script seed (`scripts/seed.ts`)

Programmatic equivalent, useful for CI/local Postgres and for generating a
custom set of universities:

```bash
npm run db:seed
```

Flags:

| Flag | Meaning |
|---|---|
| `--no-scholarships` | seed dimensions + providers only (skip scholarships) |
| `--universities N` | create N synthetic universities (default: 0 — none unless requested) |
| `--provider NAME` | restrict provider seeding to the named provider slug |
| `--seed-id ID` | mark the run with an explicit `import_batches.seed_id` (default: run timestamp) |

What it seeds:

- **30 languages**, **44 currencies**, **168 countries** (code/code3/name/
  name_ar/phone/continent/currency).
- **14 degree levels** and **33 study fields** with Arabic labels.
- **6 providers** (DAAD, KAUST, University of Tokyo, Orange Corners, Mastercard
  Foundation, Erasmus Mundus).
- **Universities** — none by default; create synthetic ones with `--universities N`
  (one per country code, slug-suffixed to stay unique).
- **6 scholarships** (one per provider) with cycles, requirements, benefits and
  fields-of-study; each enqueued in the verification queue (UNVERIFIED).

The script creates one `import_batches` row with `seed_id` so a seeded run is
traceable and re-seeding updates rather than duplicates (upserts by slug).

## 3. After seeding

```bash
# make deadlines reflect today's date
npx tsx scripts/syncDeadlines.ts

# optional: vectorize the seeded scholarships for semantic search
npx tsx scripts/generateEmbeddings.ts --entity scholarship
# (deterministic-hash FALLBACK vectors when no embedding API key is configured)

# verify the queue + data volumes
npx tsx scripts/verifyScholarships.ts
SELECT (SELECT count(*) FROM scholarships)            AS scholarships,
       (SELECT count(*) FROM universities)            AS universities,
       (SELECT count(*) FROM providers)               AS providers,
       (SELECT count(*) FROM verification_queue
         WHERE verification_status = 'UNVERIFIED')    AS pending;
```

## 4. Reset to a clean state

`database/017_cleanup.sql` drops the seed rows (and can be extended to drop all
data):

```bash
psql "$DIRECT_URL" -f database/017_cleanup.sql
npx tsx scripts/syncDeadlines.ts --dry-run   # confirm empty/consistent state
```

## 5. Verification checklist after a full seed

- [ ] `countries = 168`, `languages = 30`, `currencies = 44`, `degree_levels = 14`, `study_fields = 33`
- [ ] `providers = 6`, each with at least one scholarship
- [ ] `scholarships` count matches expectations (SQL seed: as authored; script: 6 unless `--no-scholarships`)
- [ ] every scholarship has ≥1 `scholarship_cycles` row and a non-null `next_deadline`
- [ ] `verification_queue` contains the seeded scholarships as `UNVERIFIED`
- [ ] `import_batches` has one row per seed run (identifiable by `seed_id`)
