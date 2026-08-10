# Scholarship Database Cleanup Report

**Date:** 2026-08-09 · **Scope:** TASK 2H — DB-only cleanup for MVP tester launch
**Method:** Pre-change backup → dry-run (diff report) → transactional apply → verify (vitest 54/54, `tsc --noEmit` clean, `npm run build` passes)
**Changes applied:** 102 records updated in a single transaction. No schema changes, no seeding, no destructive deletes (records are deactivated, never removed).

---

## 1. Summary

| Metric | Before | After |
|---|---|---|
| Total records | 242 | 242 |
| Active | 242 | 234 |
| Inactive (reasoned) | 0 | 8 |
| Visible (isActive + deadline not expired) | 157 | **163** |
| Placeholder deadlines (`2030-02-19`) | 39 | 0 |
| Mojibake in nameEn/description/university | 33 | 0 |
| Multi-country `country` values (semicolon/`Multiple`) | 25 | 0 |
| Priority flagships with current 2026-27 data | 0 | 13 |

## 2. PHASE 1 — Flagship refresh (13 records)

**Critical correction to the plan's §2G status update:** the 13 matched flagships were imported **unchanged** — fill-empty preserved every old 2025-26 seed value. Their `requirements` contained no `deadline` key and described the wrong cycle (e.g. Rhodes "Under 28 years old", Chevening "£18,000 tuition cap", stale eligibleEducation/fieldOfStudy lists). "Fill-empty worked" was not true for these records.

Each of the 13 was overwritten with the researched 2026-27 values from `prisma/priority-scholarships-2026.ts` (22 fields: deadline, requirements, benefits, description, degree, eligibleEducation, fieldOfStudy, englishRequirement, requiredDocuments, sourceUrl, applicationOpenDate, etc.). Highlights:

- **Chevening** — deadline `2025-11-05` → **2026-10-06**, applicationOpenDate set, funding capped at £22,000 MBA contribution.
- **Gates Cambridge** — deadline `2025-10-15` → **2026-12-03**.
- **Rhodes / MEXT / Fulbright / CSC / Australia Awards / Erasmus Mundus / Stipendium Hungaricum / Swedish Institute / Swiss / Türkiye Bursları** — stale past deadlines nulled (KAUST-consistent policy: cycle deadlines removed, requirements JSON now carries the deadline facts).
- Structured age/GPA fields cleared where they were seed approximations (e.g. Chevening `minimumGPA 3.2 → null` — no such requirement); the accurate facts live in `requirements`.
- **Swiss** — `maximumAge 40 → 35`, `applicationOpenDate 2026-08-20`.

**Judgment call:** `eligibleCountries` on the 13 flagships was **kept as the existing MENA audience lists** (e.g. Chevening `["Egypt","Saudi Arabia","Jordan","Palestine","Lebanon"]`) instead of overwriting with the dataset's `["All"]`. These lists are accurate subsets that serve the matcher's MENA focus better; the researched `["All"]` is covered by "≥160 countries" in requirements. Note in `SCHOLARSHIP_ENRICHMENT_PRIORITIES.csv` if you later want them widened.

## 3. PHASE 2 — Non-scholarship records deactivated (4)

| Record | Reason |
|---|---|
| Online IELTS Scholarships from IELTSPodcast | `COMMERCIAL_AD` |
| A & J Duct Cleaning Scholarship 2026 | `IRRELEVANT_LOCAL_AWARD` |
| Full MBA Scholarship at Breyer State Theology University | `NON_ACCREDITED` |
| Top Five Fully Funded Scholarships This Week | `CONTENT_ROUNDUP` |

## 4. PHASE 3 — Duplicates deactivated (4, curated side kept)

| Kept (curated) | Deactivated (scraped) |
|---|---|
| DAAD EPOS (curated) | DAAD EPOS scraped — `DUPLICATE` |
| Erasmus Mundus Joint Master Degree | Erasmus Mundus scraped — `DUPLICATE` |
| Swiss Government Excellence Scholarship | Swiss scraped — `DUPLICATE` |
| Onsi Sawiris Graduate Scholarship | Onsi Sawiris Bachelor — `DUPLICATE` |

## 5. PHASE 4 — Placeholder deadlines nulled (39)

All `2030-02-19` deadline records set to `null`. These are scraped for9a records whose deadlines were a seed-time placeholder; `null` keeps them visible (evergreen) per the KAUST policy.

## 6. PHASE 5 — Encoding & Arabic fixes

**Audit reconciliation — mojibake.** The audit's "20 mojibake nameEn" was nearly right. The earlier "console-renders-clean-U+2019-as-â€™" theory was **wrong**: char-code inspection proves the stored text is genuinely double-encoded UTF-8 (bytes `E2 80 99` stored as separate chars U+00E2/U+0080/U+0099). `repairMojibake` fixes these deterministically and leaves clean U+2019 untouched.

| Field | Actual mojibake | Fixed |
|---|---|---|
| nameEn | 19 (Üsküdar, Koç, Altınbaş + 16 "Masterâ€™s"-type) | 19 |
| description | 10 | 10 |
| university | 4 (Heinrich Böll, Koç, Üsküdar, Altınbaş) | 4 |
| benefits | 0 | — |

Also collapsed leading/trailing/double whitespace in **9** `nameEn` values (e.g. `" Online IELTS…"`, `"…at  ANU…"`, `"…$27,596 at QUT… "`). No nameEn collisions after changes (identity is preserved; verified).

**Arabic name (nameAr).** Audit's "13 placeholder Arabic names" was an overcount — 23 of the flagged values are fine brand-name-in-Arabic copy (DAAD/Chevening/MEXT/GKS). The **one** real leftover-English value was fixed: CQUniversity Research `منحة Research Scholarships at CQUniversity Australia` → `منحة أبحاث ممولة بالكامل في جامعة CQUniversity أستراليا`.

## 7. PHASE 6 — Multi-country normalization (19 records)

Records whose `country` held an eligible-nationality list (semicolon-joined or `Multiple`) now carry a single destination. Genuinely multi-destination programs use an explicit `Multiple (…)` value that can never break the matcher's filter:

- Single destination assigned (13): Waikato→NZ (+`["Jordan"]`), EMU→Cyprus, ADB→Japan, KAS→Germany, JJ/WBGSP→Japan, NTU→Singapore (+`["All"]`), Maine all-disciplines→US (+`["All"]`), Maine partial→US, Onsi Graduate→US (+`["Egypt"]`), Cambridge Schlumberger→UK, Maharishi→US, Ahdaf→Palestine (+`["Palestine"]`), CQUniversity→Australia.
- `Multiple (…)` where genuinely multi (6): AWS Udacity (`Global`), ACU (`Commonwealth`), TESIECS (`Africa`), Univ of London CS→UK (single target, UK-based).
- 5 already-multi-country records were among the PHASE 2/3 deactivations — left untouched (moot). Erasmus Mundus curated keeps `Multiple (Europe)` (its researched value).

## 8. Verification

- `npx vitest run --pool=threads` — **54/54 passed**.
- `npx tsc --noEmit` — **clean**.
- `npm run build` — **passes** (zero TS errors).

## 9. Artifacts

- `SCHOLARSHIP_ENRICHMENT_PRIORITIES.csv` — 153 visible scraped records ranked for enrichment: **27 with real deadlines** (soonest first — time-critical) then 126 null-deadline, each with a `gapCount` and `gapFields` column (14 enrichment fields audited).
- Pre-change backup: `C:\Users\ahmed\AppData\Local\Temp\opencode\scholarship-backup-2026-08-09.json` (all 242 records).
- Dry-run/apply diff report: `C:\Users\ahmed\AppData\Local\Temp\opencode\cleanup-report.json`.

## 10. Left for a follow-up (intentionally NOT done)

- `isVerified`/`verifiedAt` left `false` on all records — verification flags stay process-gated (plan §8 step 9). The 21 researched records could be flipped after an approved review.
- Enrichment of the 153 scraped records per the CSV.
- `source` tags for the 13 refreshed flagships still say `SCRAPED` (provenance hint only; could be re-tagged `MANUAL`).
