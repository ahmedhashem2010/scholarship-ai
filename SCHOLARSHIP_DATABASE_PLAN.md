# SCHOLARSHIP_DATABASE_PLAN.md

Database expansion plan for the 2026–2027 scholarship season.
Created 2026-08-09. **Discovery phase — no schema, code, or data changes.**

Everything in this document is derived from the committed repository (schema,
seed data, scripts, docs). **No database was queried.** All numbers below are
computed from the committed data files on 2026-08-09 (analysis "now" =
2026-08-09, expired = `deadline < 2026-08-07`, matching the audit's 2-day grace).
The live database (Supabase pooler) may differ from the committed files and was
not inspected.

---

## # 1. Current Dataset

Committed seed data: **234 records total** — **39 curated** (inline in
`prisma/seed.ts`) + **195 scraped** (in `prisma/scraped-scholarships.ts`).
Both files were committed in `0b06af8` (2026-08-09) with the mojibake fix and
the safe fill-empty seed.

| Metric | Count | Notes |
|---|---|---|
| Total records | **234** | 39 curated + 195 scraped |
| Curated records | **39** | 22 `MANUAL` + 17 tagged `SCRAPED`; all structurally complete |
| Scraped records | **195** | all from for9a.com; structured fields 100% empty |
| Active records (`isActive` default) | **234** | field absent from committed files → default `true` |
| Expired records (deadline < 2026-08-07) | **85** | 47 scraped + 38 curated (most curated carry their 2025–26 cycle deadline) |
| Missing deadlines | **81** | 80 scraped + 1 curated (KAUST Fellowship) |
| Missing eligibility countries | **195** | every scraped record (`eligibleCountries = []`) |
| Missing eligibility education | **195** | every scraped record |
| Missing funding/benefits | **195** | every scraped record (`benefits = null`) |
| Missing fields of study | **195** | every scraped record |
| Missing required documents | **195** | every scraped record |
| Missing Arabic names (placeholder) | **195** | 194 scraped + 1 curated (Stipendium Hungaricum) carry `"منحة " + English` placeholders; 82 of the scraped placeholders are truncated to ~45 chars |
| Missing/weak descriptions | **197** | 2 scraped have no description; 82 scraped descriptions are cut at exactly 1000 chars; all 195 scraped descriptions are for9a's aggregator prose (median length 958 chars) |
| Unverified records (`isVerified`) | **234** | field absent from committed files → default `false`; `verifiedAt` set on 0 |
| Duplicate records | **0** | 234 unique `nameEn` |
| Duplicate source URLs | **0** | 234 unique `sourceUrl` |

Season relevance: only **68** of 234 records have a deadline still in the future
(> 2026-08-09), all of them scraped for9a listings. The 39 curated flagships
carry 2025–26 cycle deadlines that have now passed — they are still the right
programmes, they just need their 2026–27 cycle refreshed.

---

## # 2. Current Sources

| Source | Records | Official / Third-party | Data quality | Keep? |
|---|---|---|---|---|
| **for9a.com** (scraped) | 195 | **Third-party aggregator** | Weak. Title + truncated description (82 cut at exactly 1000 chars) + country + generic `degree` + sometimes a deadline. **All** structured fields empty. Deadlines are as-scraped and already aging (47/195 past by 2026-08-07). Descriptions are for9a's prose — a legal exposure and a duplicate-content SEO risk per `DATA-STRATEGY.md`. | **Conditionally.** Keep as Tier-3 backlog only; each record must be individually re-verified against the official provider, and for9a prose must be rewritten before public reliance. Do not treat as trustworthy. |
| **Official/government portals** (curated) | 39 | **Official** | Strong. Full structured data: benefits, requirements, eligibility arrays, required documents, GPA/age. Deadlines reflect the 2025–26 cycle (mostly passed). | **Yes.** These are the flagship Tier-1 core. Refresh deadlines for 2026–27 and re-verify. |
| `source` tag values | — | — | `SCRAPED` = 212 (195 for9a + 17 curated), `MANUAL` = 22. | The tag is free-text, not an enum; treat as provenance hint only. |

No other sources are present in the repository. `DATA-STRATEGY.md` defines the
target sourcing model: **ingest from providers (official sites), not
aggregators.**

---

## # 3. Data Model

Every field on `Scholarship` (`prisma/schema.prisma:56–96`), classified:

### REQUIRED (must be present & accurate for the catalogue to be useful)
| Field | Type | Status in data |
|---|---|---|
| `nameEn` | String @unique | 234/234 present |
| `nameAr` | String | 195/234 are placeholders |
| `country` | String (free text) | present, but free text (52 values, no taxonomy) |
| `degree` | String (free text) | present; 62 use the generic `"Bachelor / Master / PhD"` |
| `deadline` | DateTime? | 81 missing; 85 already past |

### USEFUL (the fields that make a listing trustworthy / matchable)
| Field | Type | Status in data |
|---|---|---|
| `eligibleCountries` | String[] | empty on 195 scraped |
| `eligibleEducation` | String[] | empty on 195 scraped |
| `fieldOfStudy` | String[] | empty on 195 scraped |
| `requiredDocuments` | String[] | empty on 195 scraped |
| `benefits` | String? | null on 195 scraped |
| `requirements` | String? | null on 195 scraped |
| `minimumAge` / `maximumAge` | Int? | null on 195 scraped |
| `minimumGPA` | Float? | null on 195 scraped |
| `englishRequirement` | String? | null on 195 scraped |
| `sourceUrl` | String? | 234/234 present — **the only external link per record** |
| `isActive` | Boolean @default(true) | all default true |
| `isVerified` | Boolean @default(false) | 0 verified |
| `verifiedAt` | DateTime? | 0 set |
| `competitionLevel` | String @default("medium") | derived-ish; default "medium" everywhere |

### OPTIONAL
| Field | Notes |
|---|---|
| `university` | present on most |
| `flagUrl` | present on curated |
| `requiresResearch` / `requiresWorkExp` | default false |
| `applicationFee` | null on scraped |
| `applicationOpenDate` | unused in committed data |
| `deadlineType` | default "UNKNOWN"; used by rescrape pipeline (FIXED/ONGOING/ANNUAL/UNKNOWN) |
| `inactiveReason` | "EXPIRED" set by audit `--fix` (DB only) |
| `recurrenceNote` | unused in committed data |

### DERIVED
| Field | Notes |
|---|---|
| `competitionLevel` | effectively derived from fit/competition heuristics today |
| `eligibleEducation` / `fieldOfStudy` | derivable from `degree` + description keywords (`enrich-scholarships.mjs`) — **never claim as verified** |

### Gaps — fields a modern catalogue needs that the model lacks
| Missing field | Why it matters |
|---|---|
| **`applicationUrl`** | The single biggest gap. `sourceUrl` often points at an aggregator or an info page; students have no direct "apply" link. 234/234 records have no application URL. |
| `verifiedBy` | No record of who verified (audit is manual via CSV). |
| `lastCheckedAt` / `nextCheckAt` | Freshness monitoring (the `DATA-STRATEGY` "Verified 3 days ago" promise) is impossible today. |
| `seasonYear` / `cycleYear` | 2026–27 vs 2025–26 is not modeled; deadlines are just timestamps. |
| `firstSeenAt` (scrape date) | No provenance of when the record was captured. |
| `amountValue` / `amountCurrency` / `coverageType` | Funding is free text; cannot sort/compare by value (full/partial/waiver). |
| `eligibleNationalities` vs residency | `eligibleCountries` conflates nationality rules and residency (rescrape script already works around this contradiction). |
| `languageOfInstruction` | Frequently the deciding eligibility factor for students. |
| `provider` entity | Only the free-text `source` string. |

**Decision rule for the next phase:** keep the schema stable for now; every gap
can be satisfied without schema changes (e.g. store `applicationUrl` semantics
in `sourceUrl`/`requirements`, derive `seasonYear` from deadline). Schema
changes come later, only after the dataset proves itself.

---

## # 4. Data Quality Problems

Ranked by impact on "find real scholarships you can actually apply for":

### CRITICAL
1. **195 scraped records have zero structured eligibility data** (countries,
   education, fields, documents, benefits, requirements). The matcher cannot
   reason about 83% of the catalogue — this directly breaks the product promise.
2. **Descriptions are third-party (for9a) prose** — legal exposure and
   duplicate-content SEO penalty (`DATA-STRATEGY.md` §Legal footing). Copying an
   aggregator's written descriptions is not the same as compiling facts.
3. **Freshness is dead on arrival** — 85/234 deadlines already past, 81 missing,
   no automation, `verifiedAt` never set. Stale listings destroy trust faster
   than missing listings.

### HIGH
4. **195 placeholder Arabic titles** on an Arabic-first product; 82 of them are
   truncated mid-word (e.g. `"منحة Opportunity to study a diploma in the United States with par"`).
5. **Deadlines are hardcoded and single-cycle** — the 39 curated flagships need
   their 2026–27 refresh; nothing models cycle/season.
6. **No `applicationUrl`** — students cannot apply from a listing.
7. **`degree` is generic free text** (62× `"Bachelor / Master / PhD"`), and
   `country`/`eligibleEducation`/`fieldOfStudy` are free-string arrays with no
   canonical taxonomy — matching and enrichment are regex-based and fragile.

### MEDIUM
8. **Enrichment is DB-only, not in version control** — `enrich-scholarships.mjs`,
   `rescrape-for9a.mjs`, `translate-names.mjs`, `fix-encoding.mjs` all write to
   the live DB; a fresh environment running only `db:seed` gets the un-enriched
   catalogue. (The new fill-empty seed at least can no longer *destroy* enriched
   data on re-seed.)
9. **Enrichment can be wrong** — regex-derived `eligibleEducation`/`fieldOfStudy`/
   countries are never verified; a wrong field produces a confident-but-false match.
10. **`isVerified` is always false**; verification is a manual CSV worklist with
    no deadline or owner.

### LOW
11. 2 scraped records with no description; 1 curated (KAUST) with no deadline
    (Fellowship — genuinely rolling, so acceptable).
12. `flagUrl`/`competitionLevel` unmaintained.

---

## # 5. Upcoming Scholarship Season — 2026–27 Priority List

Priorities: programmes with upcoming/open deadlines, major fully-funded
programmes, and relevance to SmartScholar's Arab/MENA users.

**Deadline rule:** nothing below is invented. Where the repository holds a
deadline it is the **2025–26 cycle** value (from `prisma/seed.ts`) and is marked
as such. 2026–27 cycle dates are marked **UNKNOWN** until researched.

### Tier A — flagship governments/foundations (from curated 39 + DATA-STRATEGY)
| Programme | Country | 2025–26 deadline (repo) | 2026–27 status |
|---|---|---|---|
| **Russian Government Quota** | Russia | none in repo | **2027/28 cycle researched (2026-08-09)** — applications open **Sept 2026**; deadlines **Dec 15, 2026** (CIS) / **Jan 15, 2027** (other); results ~Apr–May 2027 |
| Türkiye Bursları | Turkey | 2026-02-20 | UNKNOWN (annual window) |
| DAAD (Master/PhD + EPOS) | Germany | 2026-08-01 / EPOS 2026–27 | UNKNOWN |
| Chevening | UK | 2025-11-05 | UNKNOWN (fixed annual cycle) |
| Stipendium Hungaricum | Hungary | 2026-01-15 | UNKNOWN |
| MEXT | Japan | 2026-05-30 | UNKNOWN (per-embassy) |
| Chinese Government Scholarship (CSC) | China | 2026-03-01 | UNKNOWN |
| GKS (KGSP) | South Korea | 2026-03-15 | UNKNOWN |
| Fulbright (per-country) | USA | 2026-04-15 | UNKNOWN |
| Erasmus Mundus Joint Masters | EU | 2026-01-10 | UNKNOWN |
| Australia Awards | Australia | 2026-04-30 | UNKNOWN |
| Italian Government (MAECI) | Italy | 2026-06-14 | UNKNOWN |
| Eiffel | France | 2025-12-10 | UNKNOWN |
| Swedish Institute SISGP | Sweden | 2026-02-12 | UNKNOWN |
| Swiss Government Excellence | Switzerland | 2025-12-10 | UNKNOWN |
| KAUST Fellowship | Saudi Arabia | none (rolling) | OPEN / rolling — verify |
| Hungary Stipendium (already above) | — | — | — |
| Gates Cambridge / Rhodes / Clarendon | UK | 2025-10-15 / 2025-09-15 / 2026-01-10 | UNKNOWN |

### Tier B — MENA-differentiating foundations (from DATA-STRATEGY; none in repo yet)
Abdullah Al Ghurair Foundation (UAE), Mastercard Foundation Scholars, Aga Khan
Foundation ISP, Said Foundation (SY/JO/LB/PS), IsDB Scholarship (member states),
Alwaleed Philanthropies, Qatar Foundation/HBKU, MBZUAI (UAE, AI, fully funded).
Deadlines: **UNKNOWN** (not present in repo).

### Tier C — currently-future records already in the scraped set
68 scraped records have deadlines after 2026-08-09 (e.g. DAAD EPOS 2026–27,
Shanghai Government Scholarship, ADB Master's in Asia-Pacific, DAAD-funded
international programmes). These are the *only* records that are currently
applyable — shortlist them for verification first. (Full list is derivable from
`prisma/scraped-scholarships.ts`; not all are trustworthy — for9a data.)

**Russia priority note (researched 2026-08-09):** the repo contains exactly one
Russia record (Skolkovo Institute of Science and Technology, deadline
2026-06-17 — now past, description recovered from mojibake). The Russian
Government Quota programme itself is not in the repo. **Research is complete
for the 2027/28 cycle** (see §5a). The "~Aug 20" start figure in earlier notes
was the expected campaign announcement; official sources put the application
window opening in **September 2026**, giving more runway than feared.

### §5a. Russian Government Quota — researched facts (2026-08-09)

**Programme:** "Quota of the Government of the Russian Federation" (квота
Правительства РФ), administered by **Rossotrudnichestvo** via the state
information system "Education in Russia" (**education-in-russia.com** — the
only official application channel, free). Selection legal basis: Minobrnauki
Order No. 1378 of 3 Nov 2020. **Next intake = 2027/2028 academic year.**

| Item | Detail |
|---|---|
| Application window | Opens **September 2026**; **CIS countries by Dec 15, 2026**; **all other countries by Jan 15, 2027** (varies by country — confirm with local Russian House/embassy) |
| Results | ~April–May 2027 |
| Levels | Bachelor / Specialist / Master / PhD, + 1-year free Russian preparatory course |
| Coverage | Full tuition, monthly stipend (maintenance allowance), subsidised dorm (2,500–3,769 RUB/mo), prep-year tuition |
| NOT covered | Travel to/from Russia, health insurance, living costs |
| Quota size | ~30,000 places/year (Minobrnauki; older sources cite 15,000 — verify per-country allocation with local Rossotrudnichestvo office) |
| Eligibility | Foreign citizens; dual citizens (incl. Russian) only if permanently residing abroad and holding **no Russian-issued diploma**; not already enrolled in a Russian university |
| University choice | Up to **6** universities in priority order; **max 2 in Moscow** and **max 2 in St. Petersburg** |
| Selection | 2 stages: (1) home-country selection by Rossotrudnichestvo/embassy (may include interview or test); (2) Russian universities + Minobrnauki finalise |
| Documents | Passport, prior-education diploma + transcripts (translated, notarised/apostilled), medical certificate, HIV test, motivation letter, achievements/awards, recommendation letters, portfolio (arts); certified Russian translations |
| Language | Russian-taught programmes get the covered prep year; English proficiency assessed via interview (official test scores optional); some English-taught programmes exist |
| Scam note | Application is **free** via the official portal only — never pay an agent for a "guaranteed" quota place |
| Official sources | education-in-russia.com; en.misis.ru/applicants/scholarships/quota/; utmn.ru/en/study-with-us/admission/scholarships-and-grants/russian-government-scholarship/; international.rudn.ru (Order 1378); spbguptd news (Sept 2025 campaign pattern); rs.gov.ru (Rossotrudnichestvo offices) |

**Next action for Russia:** build the Tier-1 record with the fields above, keep
`deadline = 2027-01-15` provisional (verify the per-country deadline via the
local Rossotrudnichestvo office before setting `isVerified`), and set
`sourceUrl = https://education-in-russia.com/`.

---

## # 6. Recommended Dataset Structure

Calibrated to what the current infrastructure realistically supports:

| Tier | Size | Definition | Source | Feasibility |
|---|---|---|---|---|
| **Tier 1 — Flagship** | **50** | Human-verified official government/foundation programmes, full structured fields, current deadlines | The 39 curated + ~11 more from DATA-STRATEGY's Tier-1 table (Russia Quota, IsDB, Ghurair, MBZUAI, KAUST, Aga Khan, etc.) | Realistic; the 39 already have complete structure and only need 2026–27 refresh + verification |
| **Tier 2 — Strong** | **150** | Verified/strong records with deadlines + eligibility + official sourceUrl | Re-verified for9a survivors (future-deadline records first) + university scholarships from official pages | Realistic via the semi-automated rescrape→enrich→verify pipeline; do not force — quality gate first |
| **Tier 3 — Backlog** | remaining | Lower-priority / unknown-deadline listings | Rest of the 195 for9a set; aggregator prose rewritten or descriptions replaced | Keep out of the default catalogue until verified; do not let them pollute the UI |

Principles (from `DATA-STRATEGY.md`): accurate first → relevant second → big
third. A database of 5,000 where 40% are wrong is worth less than 150 that are
right. Target for launch-quality: **~150 trustworthy records**, growing to 200+.

---

## # 7. Existing Automation

All scholarship-related scripts. "Modifies DB" = writes to the live Supabase
database. None of them write back into the committed data files.

| Script | Purpose | Input | Output | Safe? | Modifies DB? | Can overwrite good data? |
|---|---|---|---|---|---|---|
| `prisma/seed.ts` | Seed the catalogue (curated + scraped) | committed data files | DB | **Yes (since `0b06af8`)** | Yes | **No** — fill-empty merge; never erases a populated field; only a safe single-match `sourceUrl` rename; conflicts keep the existing value (stats report them) |
| `scripts/lib/scholarship-data.mjs` | Shared pure helpers: normalize, mojibake-repair, validate, findMatch, mergeScholarship, planImport | record objects | plan / patch objects | Yes | No | No — pure; merge is fill-empty unless `force` |
| `scripts/import-scholarships.mjs` | CLI import of a data file (`--apply` commits; default dry-run) | `.json`/`.cjs`/`.js`/`.mjs`/`.ts` array | dry-run plan or DB writes | **Yes** — same safe merge as seed; `--force` available but explicit | Only with `--apply` | No by default; **yes if `--force`** — never run force blindly |
| `scripts/audit-scholarships.mjs` | Data-quality audit + verification worklist CSV | DB | console report + `scholarship-verification-worklist.csv` | Yes (report); **`--fix` writes** | Only with `--fix` | `--fix` sets `isActive=false` on expired — safe (deactivates, never deletes) |
| `scripts/rescrape-for9a.mjs` | Re-fetch for9a pages (cache) + parse structured blocks | for9a URLs → `.scrape-cache/` | parsed patch (preview) or DB write | Yes; polite delay; **is scraping** — external network calls, do not run during this phase | Only with `--apply` | Fill-empty by default; **`--overwrite` replaces** existing values |
| `scripts/enrich-scholarships.mjs` | Derive `eligibleEducation`/`fieldOfStudy`/countries/documents/IELTS from text | DB | preview or DB write | Yes (deterministic, conservative) | Only with `--apply` | Fill-empty only — never overwrites; but derived values are **unverified** |
| `scripts/fix-encoding.mjs` | Repair UTF-8 mojibake on DB records | DB | preview or DB write | Yes (superseded by the committed-file fix + `repairMojibake` in lib) | Only with `--apply` | Only repairs corrupted text |
| `scripts/translate-names.mjs` | AI-batch Arabic translation of placeholder titles (AgentRouter) | DB | preview or DB write | Yes with validation + `--limit` | Only with `--apply` | Overwrites `nameAr` only; validated per result |
| `scripts/metrics.mjs` | Launch KPIs incl. catalogue counts | DB | console/JSON | Yes | No | No |
| `prisma/generate_scraped_ts.js` | One-off generator of the scraped .ts from `scraped_entries.txt` | `scraped_entries.txt` | code | **No — stub/notes, not maintained** | No | n/a |
| `prisma/scraped_entries.txt` | Raw scrape source text | — | — | — | — | — |

**New safe system (`0b06af8`) — how it protects data:**
- `normalizeRecord()` trims, repairs mojibake, and **drops empty values** before they can touch the DB.
- `mergeScholarship()` fills empty existing fields, keeps populated values on
  conflict (reported in `kept`), and only overwrites with an explicit `force`.
- Identity is `nameEn` (`@unique`); `sourceUrl` fallback only matches when it
  finds **exactly one** existing record (a safe rename).
- `planImport()` is deterministic: a dry run exactly matches what `--apply`
  writes — use dry runs as the standard workflow.
- The seed now uses the same merge, so **re-seeding can no longer clobber
  enrichment** (the old seed's biggest data hazard, per the pre-fix audit).

---

## # 8. Proposed Execution Order

Ordered to protect data first, then improve it, then grow it. Each step is a
separate task with its own verification gate; **no step below has been started.**

1. **Protect existing good data** — confirm the fill-empty seed/import behavior
   (done in 0b06af8); add a guard test that a re-seed never erases a populated
   field. No schema change.
2. **Clean obviously bad/expired records** — identify the 85 expired + 81
   no-deadline records; decide deactivate vs refresh per record (not bulk);
   surface the 82 truncated descriptions and 2 missing ones.
3. **Research priority scholarships** — work Tier A (Russia Quota first, given
   the ~Aug 20 season; then the Tier-A governments). Record official source URLs.
   **No deadlines invented — mark UNKNOWN until confirmed from the provider.**
4. **Verify official sources** — for each candidate, fetch the official page,
   confirm the programme exists and the URL is canonical; store as `sourceUrl`.
5. **Extract structured fields** — country, degree, eligibility, benefits,
   required documents, GPA/age, English, funding type — from the **official**
   page (extend the rescrape extraction logic to arbitrary official pages; do
   not depend on for9a HTML).
6. **Enrich incomplete records** — run `enrich-scholarships.mjs`-style
   derivation only to fill gaps, never to override; keep derived values clearly
   unverified.
7. **Detect duplicates** — normalize nameEn/sourceUrl, flag near-duplicates
   across curated+scraped before merging; rely on the single-match `sourceUrl`
   guard to prevent wrong merges.
8. **Verify deadlines** — set only from official sources; classify
   FIXED/ONGOING/ANNUAL via `deadlineType`; record 2026–27 cycle values.
9. **Mark verified records** — set `isVerified=true`/`verifiedAt` only after a
   human/approved review against the official page.
10. **Import safely** — add new records through `scripts/import-scholarships.mjs`
    (dry run first, then `--apply`); add verified/enriched state into the
    **committed data files** so fresh environments are not degraded.
11. **Run final audit** — `scripts/audit-scholarships.mjs` to confirm:
    verified>0, deadline coverage, eligibility coverage, 0 duplicate URLs,
    and re-run `npx tsc --noEmit`, `npm test`, `npm run build`.

**Out of scope until a later phase:** schema changes (applicationUrl, season
taxonomy), scheduled freshness monitoring, `isVerified` UI, the "submit a
scholarship" form, and any production database writes.

---

## Status update — 2026–2027 priority import applied (2026-08-09)

The analysis above is frozen as the pre-import baseline. Steps 3 and 10 of §8
have since been executed:

- **Researched:** 21 programmes (Russia + 20 priority flagships) from official
  sources only — full evidence in `PRIORITY_SCHOLARSHIPS_2026.md`.
- **Imported:** the 21-record dataset (`prisma/priority-scholarships-2026.ts`)
  was applied through the safe fill-empty pipeline
  (`scripts/import-scholarships.mjs --apply`): **8 new** scholarships created,
  **13 existing flagships matched unchanged** (120 populated-field conflicts
  preserved — existing values never overwritten), **0 updated**, **0 skipped**.
- **Catalogue size:** 234 → **242** scholarships. No existing record was
  modified; no duplicate `nameEn` was introduced.

### Verification flags (`isVerified` / `verifiedAt`)

- The 8 newly imported records are `isVerified = false`, `verifiedAt = null`,
  `isActive = true` — **consistent with the existing catalogue** (all 242
  records share this state).
- This is intentional: the ingestion `FIELD_DEFS`
  (`scripts/lib/scholarship-data.mjs`) deliberately does **not** import
  `isVerified` / `verifiedAt` (nor `isActive` / `applicationOpenDate`), so the
  pipeline drops them. Per §8 step 9, these flags are only set after an
  approved human/automated verification review.
- The research/verification **evidence** for the 8 new records lives in
  `PRIORITY_SCHOLARSHIPS_2026.md` and the source dataset
  `prisma/priority-scholarships-2026.ts` (both carry `isVerified: true` and a
  `verifiedAt` timestamp on every record).

---

### Appendix — data provenance & known caveats
- All stats computed from `prisma/seed.ts` + `prisma/scraped-scholarships.ts`
  as committed at `0b06af8`, 2026-08-09. The live DB was **not** queried and may
  carry audit `--fix` deactivations or enrichment that is not in version control.
- `SCHOLARSHIP_DATA_AUDIT.md` (also 2026-08-09) contains the pre-`0b06af8`
  picture; its constraint #1 ("re-seeding overwrites enriched data") is
  **obsolete** after the fill-empty seed.
- 195 scraped descriptions are third-party prose — legal/SEO action required
  before scaling marketing.
