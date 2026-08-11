# Matching Algorithm Audit — SmartScholar (Task 3B)

**Date:** 2026-08-10 · **Scope:** frozen MVP database (50 scholarships) · **Read-only audit — no matcher/UI/schema/DB changes made.**

## 1. Scope & Method

Audited the scholarship matching pipeline end-to-end against the **frozen 50-scholarship database**. The audit is read-only: no matcher code, UI, Prisma schema, or database was modified. Verification was done two ways:

1. **Safety tests** — targeted cases (nationality, degree, age, GPA, deadline exclusions) run against the live matcher (`scripts/matching-audit/safety-tests.mts`).
2. **Persona sweep** — 17 synthetic personas run through the production matcher function directly (`scripts/matching-audit/run-audit.mts`, output `matching-audit-results.json`).

All scholarships come from the frozen 50 (`visibleScholarshipWhere()`, take 200).

## 2. Pipeline Trace

```
ProfileProvider (context, 1 fetch)
   → GET /api/user/profile            (src/app/api/user/profile/route.ts)
   → /api/scholarships/match          (src/app/api/scholarships/match/route.ts)
        visibleScholarshipWhere()     (src/lib/scholarship-filters.ts)
          isActive = true AND (deadline = null OR deadline >= now - 2d grace)
        orderBy: isVerified desc, deadline asc;  take: 200
        cache: 24h TTL, 500-entry cap
   → matchScholarshipsToUser(profile, scholarships)   (src/lib/scholarship-matcher.ts)
   → dashboard slice(0,6) + sort by fitScore   (src/app/dashboard/page.tsx:579-601)
   → ScholarshipCard  (src/components/ui/scholarship-card.tsx)
```

## 3. Data Contract

### MatchParams (user side)
| Field | Type | Notes |
|---|---|---|
| `dateOfBirth` | string (ISO) | age computed at runtime via `calcAge()` |
| `country` | string | empty string = unset |
| `educationLevel` | `high-school\|bachelor\|master\|phd` | |
| `major` | string | lowercased for matching |
| `targetDegree` | `bachelor\|master\|phd\|exchange\|summer-school` | |
| `englishLevel` | string | legacy path only when `hasEnglishTest` absent |
| `hasEnglishTest` | `YES\|WILLING\|PREFER_WITHOUT` | |
| `budget` | `NONE\|LIMITED\|MODERATE\|FULL` | only used for `applicationFee` penalty |
| `gpa` | number \| null | |
| `hasResearch` / `hasWorkExperience` | boolean | |

### ScholarshipData (scholarship side)
Mirrors the Prisma `Scholarship` model: `eligibleCountries`, `eligibleEducation`, `fieldOfStudy` (string arrays), `minimumAge`, `maximumAge`, `minimumGPA`, `deadline`, `benefits` (JSON string), `englishRequirement`, `competitionLevel`, `requiresResearch`, `requiresWorkExp`, `applicationFee`, `requiredDocuments`.

### MatchResult
`fitScore` (0-100), `rank`, `successProbability`, `competitionLabel`, `isEligible`, `reasons[]`, `disqualifiers[]`, `unknowns[]`, `dataCompleteness`.

## 4. Scoring Formula (`matchScholarshipsToUser`, matcher lines 106-420; maxScore = 130)

| Component | Weight | Rule |
|---|---|---|
| Country | +25 | confirmed eligible (incl. "All"/"Any"/"all middle east") |
| | +16 | `eligibleCountries` empty (unknown — neutral) |
| | +8 | excluded (disqualifier pushed) |
| Education | +20 | target degree in `eligibleEducation` |
| | +13 | `eligibleEducation` empty (unknown) |
| | +12 | partial (similar level) |
| | +5 | mismatch (disqualifier pushed) |
| Field | +20 | field match (exact, substring, or loose word-includes) |
| | +16 | field list contains "Any" |
| | +13 | `fieldOfStudy` empty (unknown) |
| | +7 | mismatch (⚠ only, never blocks) |
| Age | +15 | within bounds |
| | +10 | gap ≤ 2 to min/max (⚠ reason, **no** disqualifier) |
| | +4 / +3 | gap > 2 (disqualifier pushed) |
| GPA | +12 | meets `minimumGPA` |
| | +7 / +3 | below minimum (⚠ reason, **no** disqualifier) |
| | +4 | GPA not provided, minimum exists |
| | +8 | no minimum |
| English | +18 / +2 | `PREFER_WITHOUT` vs test-required / not |
| | +12 | `YES` (holds score) |
| | +6 / +10 | `WILLING` |
| | +10/5/3 | legacy `englishLevel` path |
| Deadline | +12 / +9 / +6 / +4 | ≤30 / ≤60 / ≤180 / >180 days |
| | −15 | passed (disqualifier) |
| | +3 | null deadline (unknown) |
| Research / WorkExp | +5 / −3 | required & has / required & doesn't |
| | +3 | not required |
| Application fee | −3 | fee exists & budget `NONE` |

**Eligibility gate (lines 350-357):**
```
score >= 30 AND countryEligible !== false AND eduMatch !== false
  AND (minimumAge null OR age >= minimumAge)
  AND (maximumAge null OR age <= maximumAge)
  AND (daysLeft null OR daysLeft > 0)
```
GPA is **not** in the gate.

**Sorting:** eligible first, then fitScore desc, tie-break dataCompleteness desc. **MIN_RESULTS = 5**: if fewer than 5 eligible, the first 5 results are returned **regardless of eligibility** (lines 396-414).

**successProbability** (lines 93-104): `fit*0.5 + gpa≥3.5 +10 + research +5 + work +5 + advanced +5 + low comp +10 / high −10`, clamped 5-95.

## 5. Frozen-50 Compatibility Stats

| Field | Coverage |
|---|---|
| Country | 25 distinct; 32/50 (64%) `eligibleCountries=["All"]`; 18 country-list records; 0 empty; only **2 exclude Egypt** (Manaaki NZ, Banach NAWA); 16 exclude India |
| Education | BACHELOR,MASTER,PHD ×21; MASTER ×10; MASTER,PHD ×9; BACHELOR ×5; PHD ×3; BACHELOR,MASTER ×2; 0 empty |
| Field | 34/50 (68%) `["Any"]`; 13 multi-field; 0 empty; top tokens: Any(34), Engineering(9), Business Administration(5), CS(4), Law(4), Physics(3) |
| Age | min set on 4 (KAUST 18, Schwarzman 18, Manaaki 18, Saudi Gov 16); max set on 4 (Swiss 35, ADB 35, Turkey Research PhD 34, MAIPs 35); **42/50 (84%) have no age bounds** |
| GPA | min set on **1** (KAUST = 3.0) |
| English | `NOT_REQUIRED` ×3; `PREFERRED` ×0; free text ×47 |
| Deadline | 30 set / 20 null; 9 within 60 days; 3 within 30 days |
| Competition | medium 33, high 13, low 4 |
| Benefits | 50/50 populated; 20 mention full tuition; 48 mention tuition |
| Matching-critical completeness | 50/50 (countries + education + field + benefits all present) |

## 6. Persona Methodology

17 synthetic personas (`scripts/matching-audit/personas.ts`) cover the realistic student segments and the boundary conditions: nationality (Egypt/India/empty), age (15/23/24/40), GPA (2.5/3.5/3.8/null), target degree (bachelor/master/phd/exchange), English attitude (YES/WILLING/PREFER_WITHOUT/legacy), and field (Engineering/CS/Chemistry/Business). DOBs are fixed to make runs deterministic.

| # | Persona | Eligible / Returned | Top 3 |
|---|---|---|---|
| P01 | Egypt HS → Bachelor (CS) | 27/50 | Üsküdar 86% · China UG 84% · Australia UG 80% |
| P02 | Egypt UG → Master (CS, 3.5) | 40/50 | Üsküdar 91% · China all-levels 88% · Germany 88% |
| P03 | Egypt grad → PhD (Eng) | 32/50 | Üsküdar 91% · China all-levels 88% · Iraq 88% |
| P04 | Saudi UG → Master (Biz) | 38/50 | Üsküdar 91% · ADB 88% · China all-levels 88% |
| P05 | India → Master (nationality check) | 27/50 | Üsküdar 91% · China 88% · Iraq 88% |
| P06 | Age 40 → PhD | 29/50 | Üsküdar 86% · Iraq 84% · Australia 84% |
| P07 | Age 15 → Bachelor | 26/50 | Russia Quota 85% · Turkiye Burslari 85% · Romania 85% |
| P08 | GPA 2.5 → Master | 40/50 | Üsküdar 86% · Iraq 84% · China 83% |
| P09 | GPA 3.8 → Master | 40/50 | Üsküdar 91% · China 88% · Germany 88% |
| P10 | Chemistry grad → Master | 40/50 | China all-levels 83% · Schwarzman 83% · Mastercard 81% |
| P11 | Business → Master | 40/50 | Üsküdar 91% · China 88% · Iraq 88% |
| P12 | GPA null → Master | 40/50 | China all-levels 83% · Schwarzman 83% · Mastercard 81% |
| P13 | Empty country → Master | 26/50 | Üsküdar 86% · Iraq 84% · Australia 84% |
| P14 | Fully-funded hunter, no test wanted → Bachelor | 27/50 | Russia Quota 85% · Turkiye Burslari 85% · Romania 85% |
| P15 | Broad Egypt → Bachelor | 27/50 | Üsküdar 86% · Australia UG 84% · Russia Quota 82% |
| P16 | Exchange target → exchange | **0/5** | all 5 returned are **ineligible** (72-69%) |
| P17 | Legacy (Jordan, no hasEnglishTest) → PhD | 32/50 | Üsküdar 89% · China 87% · KAUST 87% |

## 7. Matcher Results & False Positives/Negatives

### Safety tests (`safety-tests.mts`): 7/8 pass, 1 fail

| Case | Result | Detail |
|---|---|---|
| S1 India vs Gates Cambridge (MENA list) | **PASS** | eligible=false, disq present |
| S2 India vs Manaaki (SEA list) | **PASS** | eligible=false, disq present |
| S3 Bachelor vs Schwarzman (master only) | **PASS** | eligible=false, disq present |
| S4 Age 40 vs Turkey PhD (max 34) | **PASS** | eligible=false, disq present |
| S5 Age 15 vs Schwarzman (min 18) | **PASS** | eligible=false, disq present |
| **S6 GPA 2.5 vs KAUST (min 3.0)** | **FAIL** | **isEligible=true, fit=85** |
| S7 Expired deadlines excluded | **PASS** | 0 expired returned |
| S8 Missing country data neutrality | REPORT | all 50 have country lists; empty-list path never fires on frozen data |

### Persona patterns
- **Country gate works.** India drops from 40 → 27 eligible (16 list records exclude it); Gates, Manaaki, Rhodes correctly hard-excluded.
- **Age gate works.** P06 (40) excluded from all 4 max-age scholarships; P07 (15) excluded from all 4 min-age scholarships.
- **Degree gate works.** P16 (exchange) has **zero** eligible scholarships — and this is where the MIN_RESULTS padding leaks ineligible records to the UI (see finding 2).

## 8. Findings

### CRITICAL

**1. `minimumGPA` is not part of the eligibility gate — a below-minimum GPA student is presented as fully eligible.**
`eligible` (matcher lines 350-357) checks score, country, education, age, deadline — but never GPA. The GPA component only shifts the score (lines 229-244, max +12). S6: KAUST `minimumGPA=3.0`, applicant GPA 2.5 → `isEligible=true`, `fit=85`, empty disqualifiers, plus a positive "✓" reason list and a working "Start Application" button. Blast radius today is limited (only 1/50 records has a GPA floor), but the defect is real and will grow with more data.

### HIGH

**2. MIN_RESULTS=5 padding returns ineligible scholarships to the UI.**
When fewer than 5 scholarships are eligible, the matcher returns the top-5 results **unfiltered** (lines 396-414). P16 (exchange): 0 eligible, 5 returned — all `isEligible=false`, fit 69-72%. The dashboard then renders `slice(0,6)` of them as recommendations (dashboard page lines 579-601).

**3. The UI never filters on `isEligible` and never renders `disqualifiers`.**
`isEligible` appears only once in the codebase (compare page type declaration) — it is never read. `ScholarshipCard` renders `reasons.slice(0,3)` only (positive green ✓ bullets) and ignores the `disqualifiers` array entirely (card lines 104-109). Combined with finding 2, an exchange student sees "72% fit", "✓ Accepts master students"-style green bullets, and a "Start Application" button for scholarships they are definitively ineligible for.

### MEDIUM

**4. Funding quality is invisible to the scorer — a partial-fee private university outranks fully-funded government programmes.**
`benefits` is parsed only for display (`getTotalValue`), never scored; `budget` only triggers a −3 application-fee penalty. Üsküdar (private Turkish university, "Tuition discounts of 25-100%… Not fully funded for all students") ranks #1 for 10 of 17 personas because it stacks: deadline urgent +12 (Aug 30, ~21 days), All countries +25, all degrees +20, no GPA +8, no research/work penalty +6, plus a loose field match +20 (finding 5). Russian/Saudi/Romanian government scholarships — the actual target audience for budget-`NONE` students — sit below it.

**5. Loose field word-matching fabricates "✓ Your field aligns".**
Line 212: `userMajor.split(/[\s,/]+/).some(word => word.length > 2 && fLower.includes(word))`. P02 (CS) matched "Artificial Intelligence and Data Science" via the token "science" → +20 and a false-positive alignment reason. Single generic tokens (science, studies, engineering, management) produce spurious field matches.

**6. Empty user country is a hard exclusion, not "unknown".**
The "unknown never blocks" philosophy is implemented for scholarship-side missing data only. With `country=''`, list-based records evaluate `user.country.toLowerCase()` against the list and hard-exclude: P13 eligible drops to 26 vs 40 for the identical Egypt profile. A user who skipped the country field silently loses 14 scholarships.

### LOW

**7. Deadline urgency dominates and punishes null-deadline records.** 20/50 (40%) have null deadlines (scraper gap) → +3; a near-deadline record gets +12. Combined with finding 4, urgency outweighs funding quality.
**8. Passed-deadline branch is effectively dead code** (`score -= 15` + disqualifier) because `visibleScholarshipWhere()` already excludes it with a 2-day grace. Harmless defense-in-depth.
**9. Age gap ≤ 2 adds +10 score but no disqualifier** (lines 187-194). Verified: age 35 vs max 34 → `isEligible=false`, `disqualifiers=[]`, reason "⚠ Slightly above maximum age". The gate correctly excludes, but the result record claims a soft warning while being hard-ineligible — confusing if the UI later starts rendering disqualifiers.
**10. `successProbability` is not capped by eligibility** — ineligible padded records (fit 72%) still show ~50% "success" odds, adding false confidence on top of finding 2.

## 9. Proposed MVP Architecture (implementation-ready, not applied)

1. **Add GPA to the eligibility gate** (CRITICAL fix): `(minimumGPA null OR user.gpa null → unknown, allowed) OR user.gpa >= minimumGPA`. If `gpa` is null and a minimum exists, keep eligible but push an "unknown" note, never a hard pass on a confirmed-below score.
2. **Never return 0-eligible padding:** when `eligibleCount === 0`, return the empty list and let the UI render a true empty state ("no scholarships match exchange programs yet") instead of fabricated recommendations.
3. **Filter + surface eligibility in the UI:** API returns only eligible records for the "recommended" list; if ineligible records are ever shown (e.g. a "near misses" section), render `disqualifiers` in red and disable "Start Application".
4. **Score funding:** parse `benefits.coverage`; heavy positive weight for full funding when `budget === NONE`, negative weight for partial/loan/conditional coverage.
5. **Tighten field matching:** require whole-phrase or ≥2-token matches; reject stoplist single tokens ("science", "studies", "engineering", "management", "any").
6. **Normalize missing user country to unknown:** if `user.country` empty, treat country-list records as unknown (no exclusion) and surface an "unknown nationality" note, mirroring the scholarship-side philosophy.
7. **Cap urgency vs quality:** when a record's funding is partial AND other hard signals are weak, cap the deadline bonus at +9.

## 10. Validation

- **Safety tests:** 7/8 pass; the single failure (S6 GPA) is finding 1.
- **Persona sweep:** 17/17 completed; `matching-audit-results.json` regenerated from the live frozen DB.
- Full suite still green after the freeze (Task 3A): vitest **108/108**, `npx tsc --noEmit` exit 0, `npm run build` exit 0.

## 11. Appendix

- Audit tooling (read-only, kept for reproducibility): `scripts/matching-audit/personas.ts`, `scripts/matching-audit/run-audit.mts`, `scripts/matching-audit/safety-tests.mts`, `scripts/matching-audit/stats.mts`.
- Output artifacts: `matching-audit-results.json` (repo root), `scripts/matching-audit/` scripts.
- Data source: frozen 50-scholarship database (see `SCHOLARSHIP_MVP_DATABASE_FREEZE_REPORT.md`).
