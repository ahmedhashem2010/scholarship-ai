# Scholarship Enrichment Report — TASK 2F

**Date:** 2026-08-10 · **Scope:** TASK 2F — enrichment of the 17 top-ranked scraped (for9a) scholarships with verified official data
**Method:** dataset file (`prisma/scholarship-enrichment-2f.ts`) → vitest validation (17/17) → dry-run plan → apply without `--force` → apply with `--force` → post-apply verification by re-running the pipeline's own `planImport` → `tsc --noEmit` clean
**Changes applied:** 17 records updated in the DB (0 creates, 0 renames, 0 deactivations). No schema changes, no seeding.

---

## 1. Summary

| Metric | Value |
|---|---|
| Records enriched | 17 |
| Records created | 0 (every record matched an existing row by exact `nameEn`) |
| Records renamed | 0 |
| Records deactivated | 0 |
| Gap fields filled per record | ~11 (eligibleCountries, eligibleEducation, fieldOfStudy, minimumAge/maximumAge, minimumGPA, englishRequirement, requiresResearch, requiresWorkExp, applicationFee, requiredDocuments, benefits, requirements) |
| Deliberate corrections (overwrite existing DB value) | 10 (6× `degree`, 2× `nameAr`, 2× `university`) |
| SKIP+FLAG (unverified / poor fit — documented §5) | 9 |
| Total DB records after apply | 242 |

## 2. Records enriched (17)

Selected from `SCHOLARSHIP_ENRICHMENT_PRIORITIES.csv` ranks 1–27 minus the 9 SKIP+FLAG records and the Chevening curated overlap (rank 14). All carry real upcoming deadlines.

| Rank | nameEn | Country | Deadline |
|---|---|---|---|
| 2 | Master's in Renewable and Sustainable Energy in the United Kingdom 2026 (Bradford) | UK | 2026-08-20 |
| 3 | Partially Funded Master's Scholarship in UK From York University 2026 | UK | 2026-08-28 |
| 5 | Fully Funded Scholarships for Bachelor's, Master's, and PhD in Germany 2026 (BMBF / Heinrich Böll) | Germany | 2026-09-01 |
| 7 | McCall MacBain Scholarship — Full Master's at McGill University | Canada | 2026-09-23 |
| 8 | Fully Funded Undergraduate, Master's & PhD Scholarship in China 2026 (USTC) | China | 2026-09-30 |
| 9 | Study Opportunity in Europe at EMUNI University (Master's & PhD, partial) | Slovenia | 2026-09-30 |
| 10 | Fully Funded Scholarships in Iraq 2026 for International Students | Iraq | 2026-09-30 |
| 11 | Gilman International Scholarship 2026 (US undergrads abroad) | US | 2026-10-01 |
| 12 | University of Winnipeg Scholarship 2026 (up to CAD 5,000) | Canada | 2026-10-01 |
| 13 | Partially Funded Bachelor's Scholarship in USA 2026 (NSHSS 18 Under 18) | US | 2026-10-04 |
| 17 | National Scholarship Program Slovakia 2026 | Slovakia | 2026-10-31 |
| 19 | Human Rights Scholarship at the University of Melbourne (full, MRes/PhD) | Australia | 2026-10-31 |
| 21 | Fully Funded Research Scholarships at CQUniversity Australia (RTP) | Australia | 2026-12-30 |
| 22 | Fully Funded ADB Master's Scholarship in Asia and Pacific 2026 | Japan | 2026-12-30 |
| 24 | Fully Funded Shanghai Government Scholarship 2026 | China | 2027-04-30 |
| 26 | Fully Funded Scholarships at the University of Siena, Italy (2026/27) | Italy | 2027-05-06 |
| 27 | Partially Funded Harvard MBA Scholarship 2026 (Boustany Foundation) | US | 2027-05-31 |

## 3. Deliberate corrections (10)

These are the only fields where the dataset differs from the existing DB values. Everything else was equal (skipped) or an empty gap (filled):

| Field | Record | Was → Now |
|---|---|---|
| `degree` | Gilman (rank 11) | `Master` → `Bachelor` (programme is undergraduate) |
| `degree` | CQUniversity (21) | `Bachelor / Master / PhD` → `Master / PhD` (higher-degree-by-research only) |
| `degree` | Siena (26) | `Master` → `Bachelor / Master` (also undergraduate) |
| `degree` | Harvard MBA (27) | `Bachelor` → `Master` |
| `degree` | Slovakia NSP (17) | `Bachelor / Master / PhD` → `Master / PhD` (no bachelor's stays) |
| `degree` | USTC China (8) | `Master / PhD` → `Bachelor / Master / PhD` (also undergraduate) |
| `nameAr` | NSHSS (13) + Harvard MBA (27) | embedded `部分` mojibake → `جزئية` |
| `university` | Bradford (2) | `"Bradford University "` (trailing space) → `"University of Bradford"` |
| `university` | Shanghai (24) | `"Shanghai Government "` (trailing space) → `"Shanghai Government Scholarship"` |

Notes:
- Only 2 records carry `university` in the dataset (Bradford, Shanghai). The other 15 keep their existing DB values, which were verified correct against the official sources.
- `deadline` values were copied verbatim (including the `23:59:00Z` time component) so the merge treats them as equal and never rewrites them.
- `source` stays `SCRAPED` (provenance preserved).
- `description` / `flagUrl` intentionally omitted → untouched by the merge; verified facts live in `benefits` / `requirements` (JSON-serialized per the seed convention).

## 4. Apply process

1. **Dry-run** — plan generated against the live DB: 17 records to update, 0 creates.
2. **Apply without `--force`** — gap fields were filled (fill-empty semantics); the 10 corrections were reported as conflicts and the existing values were kept.
3. **Apply with `--force`** — the 10 corrections were forced through: **17 updates applied, 0 creates**; DB now 242 scholarships.
4. **Post-apply verification** — re-ran the pipeline's `planImport` (with `force: true`) against all 242 live DB rows: **17 unchanged, 0 new / 0 update / 0 skipped / 0 rename** → the DB exactly matches the dataset for every mergeable field.

## 5. SKIP+FLAG — 9 records intentionally NOT enriched

| Rank | Record | Reason |
|---|---|---|
| 1 | Partial Funded Master's in Artificial Intelligence UK 2026 | no matching official scholarship found |
| 4 | Üsküdar University Scholarship 2026 | mojibake name + for9a URL |
| 6 | Fully Funded Master's in Computer Science, University of London | "fully funded" claim unverified |
| 15 | Florida Nursing Scholarship 2026 (Eastern Florida State College) | US community-college, US-centric |
| 16 | Altınbaş University Scholarship 2026 | mojibake + generic claim |
| 18 | Funded Scholarship for Pre-medical/Medical Students from BeMo | commercial (paid prep service) |
| 20 | DAAD Funded Scholarships for International Students | mismatched description; duplicates curated DAAD record |
| 23 | Catholic Foresters Undergraduate Scholarship | US members-only |
| 25 | Opportunity to study a diploma in the US at KCC 2026 | US community college, US residents |

## 6. Verification

- `npx vitest run --pool=threads` — **17/17 passed** (dataset validation: identity, structure, allowed enums, JSON-serialized benefits/requirements, unique names).
- `npx tsc --noEmit` — **clean** (exit 0).
- Live DB re-check via pipeline `planImport` — **clean** (§4 step 4).
- `isVerified` / `verifiedAt` / `isActive` / `applicationOpenDate` are **not in FIELD_DEFS**, so the import pipeline drops them (they only survive a direct Prisma upsert). They are set in the dataset so the tests can assert them. Post-apply, **0 of 242 records** have `isVerified=true` — including the 2E flagships and these 2F records — which is consistent with the 2H decision (verification flags stay process-gated, §10 of `SCHOLARSHIP_CLEANUP_REPORT.md`). Records remain visible regardless: the site's queries use `visibleScholarshipWhere()` (no `isVerified` requirement).

## 7. Artifacts

- `prisma/scholarship-enrichment-2f.ts` — the 17-record dataset (import-ready, `--force` intended).
- `src/lib/__tests__/scholarship-enrichment-2f.test.ts` — 17 validation tests.
- Verification artifacts: `%TEMP%\opencode\verify2f-plan.json` (planImport re-run: 17 unchanged), `%TEMP%\opencode\probe-verified.json` (0/242 verified).

## 8. Left for a follow-up (intentionally NOT done)

- The 9 SKIP+FLAG records above, plus the remaining scraped records ranked 28+ per the CSV (126 null-deadline records, plus those with later real deadlines).
- `isVerified` / `verifiedAt` remain `false`/`null` — could be flipped for the 2E + 2F researched records after an approved review.
- The 2F records are still tagged `source: SCRAPED` (provenance hint only).
