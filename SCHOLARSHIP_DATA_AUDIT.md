# SCHOLARSHIP_DATA_AUDIT.md

Factual audit of the current scholarship data implementation in the main
SmartScholar app. Created 2026-08-09.

**Methodology note:** No database was queried. Statistics under "Data Quality"
were computed locally from the committed seed data files (`prisma/seed.ts` +
`prisma/scraped-scholarships.ts`) by parsing the record arrays at runtime. They
describe the data **as committed**, not the current live database state (live DB
is reachable only through the Supabase pooler, which was out of scope).

> **Update 2026-08-09 (same day):** the mojibake in `scraped-scholarships.ts`
> was subsequently **fixed deterministically** in the committed file (see
> "Mojibake fix" below). Rows under "Data Quality" that mention mojibake refer
> to the pre-fix state.

---

## # Current Database

### Active schema

- **Schema file:** `prisma/schema.prisma` — `provider = "postgresql"`,
  `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`. This is the
  schema Prisma generates the client from (`prisma generate`), and what
  `db:push` / `db:seed` operate on.
- **Client:** `@prisma/client` 5.22.0, singleton in `src/lib/prisma.ts`.
- **`prisma/schema.postgres.prisma`:** a deploy-time copy variant whose header
  says "copy to schema.prisma before deploying". Currently in sync with
  `schema.prisma` (both PostgreSQL; identical model set).
- **`prisma/dev.db`:** a stale SQLite file (384 KB, last modified 2026-05-21).
  No SQLite datasource exists in the schema anymore — a leftover from an
  earlier SQLite phase, not used.
- **Models (9):** `User`, `UserProfile`, `Scholarship`, `Application`,
  `Document`, `ApplicationDocument`, `Review`, `ReviewDailyUsage`,
  `RoadmapMilestone`.

### Record count (safely obtainable locally)

- **234 records** in the committed seed data: **39 curated**
  (inline in `prisma/seed.ts`) + **195 scraped** (in
  `prisma/scraped-scholarships.ts`). Matches the 234 figure in AGENTS.md.
- The live DB count was not queried (production pooler, out of scope).

### Scholarship model (`prisma/schema.prisma`, lines 56–96)

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(cuid()) | |
| `nameEn` | String @unique | English title; upsert key for seeding |
| `nameAr` | String | Arabic title |
| `country` | String | Host country (free text; 52 distinct values) |
| `university` | String? | |
| `degree` | String | Required free text, e.g. "Bachelor / Master / PhD" |
| `deadline` | DateTime? | |
| `flagUrl` | String? | |
| `description` | String? | Free text |
| `benefits` | String? | JSON string (funding/benefits info) |
| `requirements` | String? | JSON string (eligibility requirements) |
| `sourceUrl` | String? | Provenance URL (for9a listing or official page) |
| `source` | String? | "SCRAPED" / "MANUAL" (free string, no enum) |
| `eligibleCountries` | String[] | |
| `eligibleEducation` | String[] | e.g. "BACHELOR", "MASTER", "PHD" |
| `fieldOfStudy` | String[] | display labels, e.g. "Engineering" |
| `minimumAge` | Int? | |
| `maximumAge` | Int? | |
| `minimumGPA` | Float? | |
| `englishRequirement` | String? | |
| `requiresResearch` | Boolean @default(false) | |
| `requiresWorkExp` | Boolean @default(false) | |
| `applicationFee` | Float? | |
| `competitionLevel` | String @default("medium") | |
| `requiredDocuments` | String[] | |
| `applicationOpenDate` | DateTime? | unused in committed data |
| `deadlineType` | String? @default("UNKNOWN") | unused in committed data |
| `inactiveReason` | String? | set by audit `--fix` ("EXPIRED") |
| `isActive` | Boolean @default(true) | |
| `isVerified` | Boolean @default(false) | |
| `recurrenceNote` | String? | unused in committed data |
| `verifiedAt` | DateTime? | unused in committed data |
| `applications` / `roadmapMilestones` | relations | |

Indexes: `@@index([isActive, deadline])`, `@@index([country])`.

**Notable absences:** there is **no `applicationUrl` field** — the only
external link per record is `sourceUrl`. There is no `verifiedBy` field, no
`lastCheckedAt`/`nextCheckAt`, no scrape-date, no provider entity (the only
provider marker is the `source` string), and no recurrence/season metadata
beyond the unused `recurrenceNote`.

---

## # Current Sources

| Source | Records | Type of data | URL stored |
|---|---|---|---|
| **for9a.com** | 195 | **Scraped** — an earlier scraper captured title, description (truncated to ~1000 chars) and sometimes a deadline, then **dropped every structured block**. Every one of the 195 has empty `eligibleCountries` / `eligibleEducation` / `fieldOfStudy` / `requiredDocuments` and `null` `benefits` / `requirements` in the committed file. | `https://www.for9a.com/en/opportunity/<slug>` (each record has one) |
| **Official/government portals** (curated in `seed.ts`) | 39 | 22 tagged `MANUAL`, 17 tagged `SCRAPED`. Hand-entered full records (benefits, requirements, eligibility, required documents, min GPA/age) sourced from each program's official site. | official domain per record, e.g. mext.go.jp, chevening.org, daad.de, turkiyeburslari.gov.tr, campusfrance.org |

Overall `source` distribution: **SCRAPED = 212, MANUAL = 22** (all 195 for9a
records + 17 of the 39 curated carry `source: "SCRAPED"`).

---

## # Data Quality

Computed from the committed data files at 2026-08-09 (no DB access). All
counts are out of **234 total** unless stated.

| Check | Count | Share | Notes |
|---|---|---|---|
| Missing deadline | **81** | 34.6% | 80 of 195 scraped + 1 curated (KAUST) |
| Deadline already passed | **85** | 36.3% | `deadline < now - 2 days` at analysis time |
| Missing application URL | **234** | 100% | field does not exist in the model at all |
| Missing source URL | **0** | 0% | every record has one |
| Missing eligible countries | **195** | 83.3% | all 195 scraped; 39 curated complete |
| Missing degree level | **0** | 0% | `degree` is required — but **62** (26.5%) carry the generic value `"Bachelor / Master / PhD"` |
| Missing field of study | **195** | 83.3% | all scraped |
| Missing eligibility (requirements text) | **195** | 83.3% | all scraped (`requirements` is `null`) |
| Missing funding info (benefits) | **195** | 83.3% | all scraped (`benefits` is `null`) |
| Missing required documents | **195** | 83.3% | all scraped |
| Missing description | **2** | 0.9% | both scraped; 90 scraped descriptions are truncated at exactly 1000 chars |
| Unverified (`isVerified = false`) | **234** | 100% | none human-verified |
| `verifiedAt` set | **0** | 0% | |
| Inactive (`isActive = false`) | **0** | 0% | all active in committed data |
| Placeholder Arabic title (`"منحة " + English`) | **202** | 86.3% | 194 scraped + 8 curated (incl. MEXT, Stipendium Hungaricum, Chevening, DAAD) |
| Mojibake (UTF-8-read-as-CP1252) | ~~3 desc / 2 nameEn~~ **0** | ~~~1–2%~~ 0% | **Fixed in the committed file 2026-08-09** (see "Mojibake fix" below) |
| Exact name duplicates | **0** | 0% | `nameEn` unique; 0 duplicate `sourceUrl`; 0 near-duplicates after normalization |

**Shape of the two sets:**
- **Curated (39):** structurally complete — all have eligibility arrays,
  benefits/requirements, documents, GPA/age. 8 have placeholder Arabic titles.
- **Scraped (195):** the pattern is 100% consistent — title, truncated
  description, country, generic degree, sometimes a deadline, for9a URL; every
  structured field empty. Only 1 of 195 has a real Arabic title (the record
  whose `nameEn` itself was mojibake'd: "Ãsküdar University Scholarship" — now
  fixed to "Üsküdar University Scholarship").

**Country/degree distribution (top):** Australia 64, United Kingdom 29, United
States 20, Canada 11, Germany 10, "Multiple" 9, UAE 8, Spain 6…; degree values:
"Master" 95, "Bachelor / Master / PhD" 62, "Bachelor" 29, "Master / PhD" 26,
"PhD" 16. **1 record references Russia** (a scraped for9a listing).

---

## # Mojibake fix (2026-08-09)

Repairs UTF-8-read-as-CP1252 corruption in the committed scraped data,
deterministically. Three layers:

1. **Shared repair helper** — `repairMojibake()` in
   `scripts/lib/scholarship-data.mjs` reverses the UTF-8-read-as-Windows-1252
   round trip by taking each character as a CP1252 byte (with the 0x80–0x9F
   printable glyph map) and decoding the byte stream as UTF-8. It bails on any
   real multi-byte char (e.g. Arabic), so it never corrupts legitimate Arabic;
   and it only accepts the decoded result when it no longer looks corrupted.
   `looksCorrupted()` is a cheap regex detector.
2. **Committed file** — `prisma/scraped-scholarships.ts` was repaired in place
   by running the byte-reverse over every maximal run of Latin-1-high
   characters (0x80–0xFF). Result: **0** repairable fields across the 195
   scraped records, 195 unique `nameEn`, no duplicates, no leftover C1 control
   chars. Fixed sequences included `â€™`→`'`, `â€“`→`–`, `Â£`→`£`,
   `BÃ¶ll`→`Böll`, `KoÃ§`→`Koç`, `AltÄ±nbaÅ`→`Altınbaş`, `ÃskÃ¼dar`→`Üsküdar`.
   Because the import renames matched-by-`sourceUrl` records safely, repairing
   `nameEn` in the file is idempotent against an already-seeded DB.
3. **Ingest-time repair** — `normalizeRecord()` (used by the import CLI and the
   seed) applies `repairMojibake()` to free-text fields on every ingest, so a
   fresh scrape is cleaned automatically even if it regresses.

**One non-deterministic case:** the Skoltech Russia record's `description` was
partially double-encoded Arabic mixed with clean Arabic and stray C1 control
chars, with missing bytes in the stream — impossible to recover byte-for-byte.
Its description was replaced with the reconstructed clean Arabic text (terms
match the scholarship's published details), keeping the English eligibility
tail.

---

## # Existing Import/Seed Pipeline

| File | Role |
|---|---|
| `prisma/seed.ts` | `npm run db:seed` → `tsx prisma/seed.ts`. Holds the **39 curated** records inline, then upserts the **195 scraped**. Curated: explicit `update`/`create` per field on `nameEn`. Scraped: `upsert({ where: { nameEn }, update: s, create: s })` (whole object). Prints `Total scholarships` count. |
| `prisma/scraped-scholarships.ts` | The 195 for9a records as `Prisma.ScholarshipCreateInput[]`. **This is the original, pre-enrichment scrape.** |
| `prisma/scraped_entries.txt` | Raw source text (5070 lines) the .ts was generated from. |
| `prisma/generate_scraped_ts.js` | One-off generator that produced `scraped-scholarships.ts` from the txt (script is a stub/notes, not a maintained pipeline). |

There is **no scheduler, importer service, or external-feed job** — seeding is a
manual, local `db:seed` operation.

---

## # Existing Verification Infrastructure

**Model fields:** `isVerified` (default false), `verifiedAt`, `isActive`
(default true), `inactiveReason` ("EXPIRED"), `deadlineType` (default
"UNKNOWN"), `applicationOpenDate`, `recurrenceNote`. All but `isActive`/
`isVerified` are unused in the committed data.

**Scripts (all write to the DB; none are committed back into the data files):**

| Script | Purpose |
|---|---|
| `scripts/audit-scholarships.mjs` | DB data-quality audit: counts missing/empty fields, completeness buckets, per-source averages; writes `scholarship-verification-worklist.csv` (worst-data-first worklist with `VERIFIED_YN` column for manual checking). `--fix` deactivates records past `deadline - 2 days` (`isActive=false`, `inactiveReason="EXPIRED"`). |
| `scripts/rescrape-for9a.mjs` | Re-fetches the 195 for9a pages (cached in `.scrape-cache/`, 1.5s delay) and parses Applicant/Opportunity criteria → fills `eligibleCountries`, age, `eligibleEducation`, deadline/`deadlineType`, `applicationOpenDate`, `benefits`, `requirements`. Fills empty fields only unless `--overwrite`. |
| `scripts/enrich-scholarships.mjs` | Deterministic derivation of `eligibleEducation` and `fieldOfStudy` from `degree` + `description` keywords. Fills empty fields only; `--apply` writes. |
| `scripts/translate-names.mjs` | AI batch translation of the placeholder Arabic titles (AgentRouter endpoint), with validation, `--apply` writes. |
| `scripts/fix-encoding.mjs` | Repairs UTF-8 mojibake in scraped text (`--apply` writes). |
| `scripts/metrics.mjs` | Launch KPIs incl. scholarship count and verified count. |

**Verification model:** manual. A human works the audit worklist CSV and marks
`VERIFIED_YN`; there is no automated verification, no deadline-sync job, and no
record of who/when beyond `verifiedAt`. The rescrape/enrich/translate/fix
scripts were built after the original seed and **write only to the live DB** —
their outputs are not present in the committed seed files.

---

## # Important Constraints

1. **Re-seeding overwrites enriched data.** `db:seed` upserts on `nameEn` with
   `update: s`, and the committed `scraped-scholarships.ts` is the
   pre-enrichment original (empty structured fields). Running `db:seed` again
   on a DB that has rescrape/enrich/translate results **will clobber those
   fields back to empty/null** — unless the enrichment pipeline is re-run
   after seeding, or the seed is changed to fill-only / import the enriched
   state.
2. **`nameEn` is the identity key.** Adding scholarships requires unique
   `nameEn` values; the seed upsert key cannot change without a migration.
3. **No `applicationUrl`.** The only per-record link is `sourceUrl` (for9a
   listing or official page). Any "Apply now" experience must derive the
   target from `sourceUrl` or a new field must be added.
4. **`degree` is required free text**, not an enum — matching and enrichment
   parse it textually; 62 records use the generic "Bachelor / Master / PhD".
   `eligibleEducation` / `fieldOfStudy` are also free-string arrays (no
   canonical taxonomy).
5. **Placeholder Arabic titles (202/234)** — Arabic-first UI renders
   `"منحة <English>"`; fixing requires the translate pipeline (DB writes).
6. **Mojibake ~~still present~~ (fixed 2026-08-09).** A handful of scraped
   `nameEn`/`description`/`university` values carried UTF-8-read-as-CP1252
   corruption (e.g. `ÃskÃ¼dar`, `Masterâ€™s`, `Â£`). All of it is now repaired
   **deterministically in the committed file** via `repairMojibake()`, and the
   import/seed pipeline applies the same repair on ingest (see "Mojibake fix"
   below), so future scrapes are cleaned automatically. One non-repairable
   record (Skoltech Russia) had a partially double-encoded Arabic description
   with missing bytes; it was replaced with the recovered clean text.
7. **Deadlines are hardcoded and aging.** 85/234 were already past by
   ‍2026-08-09 (with a 2-day grace) and the audit `--fix` deactivates them in
   the DB; 81 have no deadline. No automation keeps deadlines current.
8. **Descriptions truncated at ~1000 chars** (90 records exactly 1000) during
   the original scrape; 2 records have no description.
9. **Verification is fully manual** via the audit worklist CSV; nothing
   automates it, and `isVerified` starts false for everything.
10. **Enrichment is DB-only, not in version control.** Fresh environments
    running just `db:seed` get the un-enriched catalogue unless the scripts are
    run manually afterward.
11. **PostgreSQL is the live provider**; `prisma/dev.db` is a stale SQLite
    artifact. Schema changes must go through `schema.prisma` +
    `schema.postgres.prisma` (kept in sync) and use `DIRECT_URL` for DDL.
