# MATCHING_SAFETY_FIX_REPORT — Task 3C

**Date:** 2026-08-10 · **Scope:** three safety bugs from `MATCHING_ALGORITHM_AUDIT.md`
**Constraint honored:** scoring/ranking intentionally untouched — no weight, formula, deadline, funding, field-matching, or ranking changes. Only hard-eligibility gating and result-surface behavior. No DB/schema changes, no new scholarships, no migrations, no commit.

---

## Bugs Fixed

### BUG 1 — CRITICAL: `minimumGPA` is now HARD eligibility

**Before:** the eligibility gate checked score, country, degree, age, and deadline — but never GPA. A 2.5-GPA student received KAUST (`minimumGPA=3.0`) as `isEligible=true`, `fit=85%`, with a working "Start Application" button.

**After:** a confirmed GPA below the scholarship minimum is a hard exclusion, on par with a country or degree mismatch. Missing user GPA stays "unknown" (never blocks), consistent with the product's existing missing-data philosophy (a `minimumGPA`-set scholarship + `gpa: null` returns eligible with the existing `⚠ GPA not provided` reason — same policy the score path already applied).

**Rule implemented:**
```
scholarship.minimumGPA === null   → passes (no invented behavior)
user.gpa === null                 → passes (unknown, never blocks)
user.gpa >= scholarship.minimumGPA → passes
user.gpa <  scholarship.minimumGPA → eligible = false
```

**Files changed:**
- `src/lib/scholarship-matcher.ts` — added `gpaEligible` computation and `gpaEligible &&` to the `eligible` gate.

**Verification on the frozen-50 DB:** P08 (GPA 2.5) now yields 39 eligible (KAUST excluded); P09 (GPA 3.8) and P02 (GPA 3.6) keep KAUST eligible.

### BUG 2 — HIGH: never pad with ineligible results

**Before:** `MIN_RESULTS = 5` forced 5 results even when fewer than 5 were eligible. P16 (exchange target) got 5 cards at 69-72% — every one `isEligible=false`.

**After:** the matcher returns only results that pass the hard eligibility gate, and nothing else.
```
0 eligible → 0 recommendations
1 eligible → 1 recommendation
2 eligible → 2 recommendations
5+ eligible → all eligible results (sorted, ranked), no ineligible row
```

**Files changed:**
- `src/lib/scholarship-matcher.ts` — removed the `MIN_RESULTS` padding block; return `results.filter(r => r.isEligible)` (rank assigned after filtering, order preserved from the eligible-first sort).

**Verification on the frozen-50 DB:** P16 returns `0` (was 5 ineligible); P02 returns 40/40 eligible; zero returned rows are ineligible across the persona sweep.

### BUG 3 — HIGH: cards never present ineligible scholarships as application opportunities

**Before:** `ScholarshipCard` rendered "Start Application" for every result and displayed only positive `reasons` (disqualifiers ignored). Ineligible results — which BUG 2 previously allowed to leak through — looked like real application opportunities.

**After:**
- `ScholarshipCard` renders the "Start Application" CTA **only** when `match.isEligible === true`. Ineligible cards show only "Details".
- Dashboard recommendation list defensively filters `isEligible !== false` before slicing to 6, so a stale/cached backend response can never surface an ineligible recommendation.

**Files changed:**
- `src/components/ui/scholarship-card.tsx` — wrapped the application CTA in `{match.isEligible && (...)}`.
- `src/app/dashboard/page.tsx` — added `.filter((m: any) => m.isEligible !== false)` before `.slice(0, 6)` in the matches mapping.

No card redesign, no visual/design/font changes. Wise Sans Refined remains the primary font for future UI work.

---

## Regression Tests

New file: `src/lib/__tests__/scholarship-matcher-safety.test.tsx` — 21 tests, reusing the **17 synthetic personas from Task 3B** (`scripts/matching-audit/personas.ts`).

### BUG 1 (GPA) — 5 tests
- GPA below minimum → ineligible (P08 2.5 vs KAUST 3.0) — KAUST absent from results, alone and in a mixed pool
- GPA exactly at minimum → eligible
- GPA above minimum → eligible (P09 3.8 vs KAUST)
- scholarship without `minimumGPA` → existing behavior preserved (eligible, empty disqualifiers)
- missing student GPA + minimum exists → **not** blocked; `⚠ GPA not provided` reason present

### BUG 2 (no padding) — 5 tests
- 0 eligible → 0 recommendations
- 1 eligible → 1 recommendation
- 2 eligible → 2 recommendations
- 5+ eligible → normal result-limit behavior (≥5, all eligible)
- no returned recommendation may be `isEligible=false` (swept across all 17 personas)

### Persona safety cases — 8 tests (the required checklist)
1. ineligible nationality → blocked (P05 India vs MENA list)
2. wrong degree → blocked (P02 master vs bachelor-only)
3. maximum age exceeded → blocked (P06 40 vs max 34)
4. below minimum age → blocked (P07 15 vs min 18)
5. expired scholarship → blocked
6. below minimum GPA → blocked (P08 vs KAUST)
7. eligible GPA → allowed (P09 vs KAUST)
8. no returned recommendation may be `isEligible=false` (frozen-50-like pool, all 17 personas)
   + explicit **P16 exchange case → 0 recommendations, never padded**

### BUG 3 (card) — 2 component tests
- ineligible match → no "Start Application" link; "Details" still rendered
- eligible match → "Start Application" link rendered

---

## Test Results

| Check | Result |
|---|---|
| `npx vitest run --pool=threads` | **129 passed** (7 files; 108 pre-existing + 21 new) |
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **Compiled successfully** |

## Confirmation

- **Scoring/ranking intentionally untouched:** no changes to any weight, the fit-score normalization, `calcSuccessProbability`, deadline/funding/field handling, sorting tie-breaks, or the `reasons`/`disqualifiers`/`unknowns` text. Task 3D scope (Üsküdar ranking, funding score, deadline urgency, loose CS/Data-Science matching, "All" countries, missing-country behavior) was explicitly left alone.
- **No DB/schema changes**, no migrations, no `db push`, no scholarship add/delete.
- **Nothing committed or pushed** — all changes are uncommitted working-tree edits.
