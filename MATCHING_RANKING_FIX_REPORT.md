# MATCHING_RANKING_FIX_REPORT — Task 3D

**Date:** 2026-08-10 · **Scope:** the ranking-quality items explicitly deferred
by `MATCHING_SAFETY_FIX_REPORT.md` (Task 3C) and itemised in `MATCHING_ALGORITHM_AUDIT.md`
Section 9 (items 4–7): funding score, deadline-urgency cap, tighter field
matching, and missing-country behaviour.
**Constraint honored:** the Task 3C safety fixes (GPA hard gate, no padding,
card CTA gating) are untouched and their tests still pass. No DB/schema
changes, no migrations, no commit.

---

## Changes

### 1. Funding score — `benefits` is now scored against the student's budget

A scholarship's coverage is **classified from its `benefits` text** (`classifyFunding`,
exported), never from the record name — several records are *named* "Fully
Funded" while actually covering only tuition.

**Classification (FULL / TUITION_ONLY / PARTIAL / UNKNOWN),** per benefit value:
- every value is read as its own segment, so a GPA requirement
  ("average of at least 97%") is never mistaken for a tuition discount, and a
  Singapore "Tuition Grant" is never treated as partial funding;
- `NO_LIVING` markers ("cost of study only", "stipend … not automatically
  included") → TUITION_ONLY;
- partial markers (discount / reduction / partial / not fully funded) or a
  sub-100% tuition range ("20–100% of tuition", matched with `\u2010-\u2015\u2212-`
  to survive U+2013 en-dashes in real data) → PARTIAL;
- stipend / allowance / living / subsistence / fully funded → FULL;
- tuition/fee only → TUITION_ONLY;
- otherwise UNKNOWN (surfaced as an unknown, not a mark against the user).

**Result on the frozen 50:** 36 FULL · 11 PARTIAL · 3 TUITION_ONLY · 0 UNKNOWN.

**Scoring** (`fundingScores` keyed by the user's `budget`, null → MODERATE):

| budget | FULL | TUITION_ONLY | PARTIAL | UNKNOWN |
|---|---|---|---|---|
| NONE    | +18 | +4 | **−10** | +4 |
| LIMITED | +14 | +5 | −3 | +4 |
| MODERATE| +10 | +6 | +2 | +2 |
| FULL    | +6  | +6 | +6 | +2 |

A budget-NONE student is pushed hard toward genuinely funded scholarships and
away from partial ones; a self-funding student is barely affected. The penalty
is scoring-only — partial funding never disqualifies.

### 2. Deadline urgency cap on partial funding

The urgent-deadline bump is `+12` — but capped to `+9` when the scholarship is
PARTIAL, so a "last chance" deadline can no longer mask weak funding.

### 3. Tighter field matching

Replaced the old substring/word-in-field test (`userMajor.split(…).some(word →
field.includes(word))`, which matched "Arts"→"Artificial Intelligence" and let a
single generic word match) with `fieldsMatch`:
- exact phrase, or the field phrase fully contained in the major, or (major ≥2
  words) the major phrase fully contained in the field;
- stopword-filtered token comparison (stopwords: science/sciences, study,
  studies, the, and, of, in, for, with, international, applied, it — but **not**
  information/technology/management, which carry real signal);
- ≥2 shared non-stopword tokens, or 1 shared token ≥5 chars;
- a single-token major must hit a **whole** token ("Arts" can't match
  "Artificial Intelligence"; "Engineering" matches "Software Engineering");
- a small hand-picked `FIELD_ALIASES` map for names that don't contain the major
  but clearly accept it (Biology → "Life Sciences", Political Science →
  "Social Sciences", etc.).
- A major of `Other` (or empty) is now treated as *unknown* (`+13` + note),
  never a fabricated mismatch.

### 4. Missing nationality is no longer a hard exclusion

A user with an empty `country` (legacy/partial profiles) previously hit
`countryEligible=false` — a fabricated `✗ … is not in the eligible countries list`.
Now an empty country is tri-state *unknown*: `+16`, an
"Your nationality isn't set on your profile — eligibility can't be verified"
unknown note, and **never blocks**. Confirmed lists (`all` / `any` /
`all middle east`) still count as eligible for everyone with a country set.

### 5. `maxScore` recalibrated 130 → 150

The new funding dimension (worst −10, best +18) exceeds the old theoretical max,
so the normalization ceiling was raised. Fit scores are slightly lower overall
(≈15% scale shift) but remain comparable; the eligibility floor of `score ≥ 30`
is unchanged.

---

## Verification on the frozen-50 DB

| Check | Before (3C) | After (3D) |
|---|---|---|
| P13 (missing nationality) eligible | 26 | **42** |
| Üsküdar (partial tuition discounts) for P02 (CS master, budget NONE) | **#1, 86–91%** | **rank 37, fit 61** — still eligible & present |
| P02 (CS master) top-10 | Üsküdar-led, near-identical per persona | fully-funded programmes (China, KAUST, Germany…) |
| P10 (Chemistry) vs P11 (Business) top fit | 85 / 85 | 85 / 88 (Business-aligned scholarships rank above the field mismatch) |
| Safety tests S1–S8 | S1–S6 "UNKNOWN" (harness blind to absence) | **S1–S7 PASS**, S8 REPORT |

- `scripts/matching-audit/safety-tests.mts` updated: post-BUG-2 the matcher only
  returns eligible rows, so a restricted scholarship being **absent** is now the
  PASS outcome for the `NOT_ELIGIBLE` cases instead of an "UNKNOWN".
- Üsküdar stays in the result set (rank 37, `isEligible=true`) — a Medicine /
  Dentistry / Pharmacy student matches it correctly; only the ranking moved.
- P16 (`targetDegree=exchange`) still returns 0 — pre-existing, out of scope
  (the frozen `eligibleEducation` only contains BACHELOR/MASTER/PHD; onboarding
  still offers exchange/summer-school). Tracked for a data/onboarding follow-up.

---

## Regression Tests

`src/lib/__tests__/scholarship-matcher-safety.test.tsx` grew from 21 → **39 tests**
(+18 Task 3D):

- **Funding classification (6):** full from stipend; tuition-only from a 100%
  waiver; GPA "at least 97%" not read as a discount; en-dash range "20–100% of
  tuition" → PARTIAL; Singapore "Tuition Grant" not partial; "25% tuition-fee
  reduction" → PARTIAL.
- **Funding scoring (3):** FULL ranks above TUITION_ONLY for NONE budget;
  partial funding penalized but never hidden; the FULL-vs-PARTIAL gap shrinks
  when the student can self-fund.
- **Field matching (6):** exact phrase; major contained in a combined field;
  Arts NOT matched to Artificial Intelligence; Biology→Life Sciences via alias;
  Engineering→Software Engineering via whole token; `Other` major → unknown.
- **Country & deadline (3):** empty country never disqualifies (unknown note);
  confirmed ineligible country still blocked; partial funding caps the urgent
  deadline bonus.

## Test Results

| Check | Result |
|---|---|
| `npx vitest run` | **147 passed** (7 files; 129 pre-existing/3C + 18 new) |
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **Compiled successfully** (zero TS errors) |
| `scripts/matching-audit/safety-tests.mts` | **7 PASS / 1 REPORT** |

## Confirmation

- **Task 3C fixes untouched:** GPA hard gate, no-padding filter and card CTA
  gating still covered by their 21 tests, all passing.
- **No DB/schema changes**, no migrations, no `db push`, no scholarship
  add/delete — the frozen 50 are unchanged.
- **Nothing committed or pushed** — all changes are uncommitted working-tree
  edits in `src/lib/scholarship-matcher.ts`,
  `src/lib/__tests__/scholarship-matcher-safety.test.tsx` and
  `scripts/matching-audit/safety-tests.mts`.
