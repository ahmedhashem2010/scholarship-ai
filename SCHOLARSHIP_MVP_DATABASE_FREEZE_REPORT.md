# SCHOLARSHIP MVP DATABASE FREEZE REPORT

**Task:** 3A — Freeze the scholarship database to the Final MVP 50
**Date:** 2026-08-10T16:29:33.162Z
**Status:** PASS — database frozen to exactly 50 scholarships

## Summary

| Metric | Value |
|---|---|
| Before count | 250 |
| After count | 50 |
| Deleted count | 200 (expected 200) |
| Expected final count | 50 |
| Backup location | `C:\Users\ahmed\AppData\Local\Temp\opencode\scholarship-backup-2026-08-10T16-29-29-269Z.json` (outside repository, OS temp) |
| Backup record count | 250 |
| Authority file | `SCHOLARSHIP_MVP_FINAL_50.json` (50 records, 50 unique) |

## Verification results

| Result | Check | Detail |
|---|---|---|
| ✓ PASS | count==50 | after count=50 |
| ✓ PASS | no-duplicates | unique=50 |
| ✓ PASS | set-equals-json | surviving nameEn set equals JSON nameEn set exactly |
| ✓ PASS | no-unexpected | unexpected records=0 |
| ✓ PASS | no-missing | missing MVP records=0 |
| ✓ PASS | deleted-200 | deleted=200, before=250 |
| ✓ PASS | fields-preserved | field diffs=0 |
| ✓ PASS | unrelated-tables-unchanged | users=30->30, profiles=21->21, docs=10->10, reviews=8->8, usage=0->0, apps=0->0, appDocs=0->0; milestones: RoadmapMilestone cascaded (onDelete: Cascade) for removed scholarships — expected (8->0) |

## Deleted scholarship count vs. expected

- Deleted: **200** scholarships (nameEn NOT in the authoritative 50-name set).
- The JSON list was the ONLY authority — no deadline/score/source/active/country condition was used.
- Survivors: **50** — exactly the Final MVP 50.

## Tests / typecheck / build

Run separately after the freeze (see task output):
- `npx vitest run --pool=threads`
- `npx tsc --noEmit`
- `npm run build`

## Warnings

- `RoadmapMilestone.scholarship` declares `onDelete: Cascade` in the Prisma schema; deleting scholarships outside the MVP 50 cascaded 8 roadmap-milestone rows (all for the removed "Onsi Sawiris Scholarship 2026", owner: test user "Ahmed Hashem", all past-due). All other user-facing tables are unchanged.
- The complete 250-record backup is stored **outside the repository** at `C:\Users\ahmed\AppData\Local\Temp\opencode\scholarship-backup-2026-08-10T16-29-29-269Z.json` and is **not committed**.
