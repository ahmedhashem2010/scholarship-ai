# SCHOLARSHIP_LAUNCH_AUDIT — TASK 2H

**Date:** 2026-08-09 · **Scope:** read-only audit of all 242 scholarship records + scholarship-related code
**Constraint honoured:** no DB changes, no code changes, no schema changes, no seeds, no commits/pushes.

---

## 0. Baseline

| Metric | Value |
|---|---|
| Total records | 242 (234 original + 8 new 2026–27 priority) |
| `isActive = true` | 242 (100%) |
| `isVerified = true` | 0 (100% unverified) |
| `deadlineType` | 242 × `UNKNOWN` (100%) |
| `applicationOpenDate` | not populated |
| Sources | `SCRAPED` 212 (88%, all for9a.com), `MANUAL` 30 (12%, curated) |

---

## 1. Deadlines (relative to 2026-08-09)

| Bucket | Count | % of 242 |
|---|---|---|
| Missing (null deadline) | 85 | 35% |
| **Expired** (past 2-day grace → hidden) | 85 | 35% |
| Upcoming | 72 | 30% |
| **Visible to students** (null + upcoming) | **157** | 65% |
| Upcoming within **30 days** | 5 | 2% |
| Upcoming within **60 days** | 15 | 6% |
| Upcoming within **90 days** | 21 | 9% |

**Key facts**
- 85 records are expired but still `isActive = true`. They are only hidden by the `withVisibility`/`visibleScholarshipWhere` filter (`src/lib/scholarship-filters.ts:34`). Any query path that forgets that filter will expose dead records.
- Of the 72 "upcoming", **39 carry the identical placeholder date `2030-02-19`** (scraper fallback). Only 33 visible records have genuine deadlines.
- Soonest genuine deadlines (all for9a listicles, not flagships): 2026-08-15 UK AI Master's, 2026-08-20 UK renewables Master's, 2026-08-28 York UK, 2026-08-30 Üsküdar (Turkey), 2026-09-01 "Fully Funded … Germany 2026".
- Closest priority flagship: **Schwarzman (China) 2026-09-09** (~31 days), then Knight-Hennessy 2026-10-06, Commonwealth 2026-10-20, Russian quota 2027-01-15.

---

## 2. Application readiness (field-level, n / 242)

| Field | Present | % |
|---|---|---|
| sourceUrl | 242 | 100% |
| usable description | 240 | 99% |
| deadline | 157 | 65% |
| country | 242 | 100% |
| degree | 242 | 100% |
| **eligibleCountries** | **44** | **18%** |
| **eligibleEducation** | **47** | **19%** |
| **fieldOfStudy** | **47** | **19%** |
| **benefits** | **47** | **19%** |
| **requirements** | **47** | **19%** |
| **requiredDocuments** | **47** | **19%** |

**Readiness gap:** every required free-text field is present, but the entire structured-eligibility layer exists for only **47 records (19%)**. The remaining 195 records (all for9a scraped) have zero eligibility data.

- The 47 structured records = 30 curated MANUAL + 13 matched 2026-27 flagships + 4 scraped.
- **Only 9 of those 47 structured records are currently visible.** The other 38 are hidden by stale deadlines.
- Of the 47 structured records, 3 lack `eligibleCountries` (Commonwealth, DAAD EPOS, GOI-IES).

---

## 3. Priority

### The 8 new 2026–27 records (well-structured, official sources) — all visible
| Scholarship | Deadline | Notes |
|---|---|---|
| Schwarzman Scholars (China) | 2026-09-09 | **closest real deadline (~31d)** |
| Knight-Hennessy Scholars (Stanford) | 2026-10-06 | |
| Commonwealth Scholarships (UK) | 2026-10-20 | |
| Russian Government Quota (Rossotrudnichestvo) | 2027-01-15 | |
| DAAD EPOS (Germany) | null | cycle facts in `requirements` |
| Government of Ireland (GOI-IES) | null | |
| Manaaki New Zealand | null | |
| Romanian Government | null | |

### The 13 matched flagships — **12 are invisible to testers** ⚠️
These records received the researched structured data (eligible countries/education/fields/documents, benefits, requirements — fill-empty worked) **but kept their stale deadlines** because the fill-empty merge never overwrites a populated existing value (`mergeScholarship`, `scripts/lib/scholarship-data.mjs:356`). The researched 2026–27 deadlines from `prisma/priority-scholarships-2026.ts` were dropped.

| Flagship | DB deadline (stale) | Researched 2026-27 | Status |
|---|---|---|---|
| Chevening (UK) | 2025-11-05 | 2026-10-06 | **hidden** |
| Gates Cambridge (UK) | 2025-10-15 | 2026-12-03 | **hidden** |
| Rhodes (Oxford) | 2025-09-15 | — | **hidden** |
| MEXT (Japan) | 2026-05-30 | — | **hidden** |
| Fulbright (USA) | 2026-04-15 | — | **hidden** |
| Chinese Gov. CSC | 2026-03-01 | — | **hidden** |
| Australia Awards | 2026-04-30 | — | **hidden** |
| Erasmus Mundus | 2026-01-10 | — | **hidden** |
| Stipendium Hungaricum | 2026-01-15 | — | **hidden** |
| Swedish Institute SGP | 2026-02-12 | — | **hidden** |
| Swiss Government Excellence | 2025-12-10 | — | **hidden** |
| Turkiye Burslari | 2026-02-20 | — | **hidden** |
| KAUST (Saudi Arabia) | null | — | **visible** (no deadline) |

### 22 curated MANUAL records also hidden (stale 2026 deadlines)
ARES, OeAD, Clarendon, Danish Gov., ETH Zurich, Heinrich Böll, King Saud, Pearson (Toronto), Mälardalen, MBR Al Maktoum, Orange Tulip, Qatar University, Sawiris Foundation, Bologna, Geneva, UQ Destination Australia, Tokyo–ADB, Warsaw, Vanier, VLIR-UOS, +2.

---

## 4. Data quality

| Issue | Count | Examples |
|---|---|---|
| Placeholder Arabic names (`منحة <latin>`) | 13 | "منحة DAAD الألمانية", "منحة ETH زيورخ", "منحة A & J لتنظيف المجاري…" |
| Mojibake in **nameEn** | 20 | "Ãsküdar University…", "Masterâ€™s in Renewable…", "KoÃ§ University…" |
| Mojibake in description / benefits | 12 / 5 | same encoding corruption survives in free text |
| Truncated descriptions | 5 | "…a bachelor s (or equivalent) degree for", "…ranked according to" |
| Generic / very short description | 1 | Schwarzman (133 chars) |
| Suspicious source URLs | 195 | all link to **for9a.com** aggregator listicle pages, not official sites |
| Duplicate / near-duplicate | 4 pairs | see below |
| Expired (hidden) | 85 | see §1 |
| **Needs 2026-27 cycle refresh** | **34 curated records** | all 22 MANUAL + 12 matched flagships with stale deadlines |
| Placeholder far-future deadlines | 39 | all identical `2030-02-19` |

### Duplicates / near-duplicates
- **DAAD EPOS** — `DAAD EPOS Scholarship (Development-Related Postgraduate Courses)` (new, dl=null) vs `DAAD EPOS Scholarship 2026-27 for Postgraduate Studies in Germany` (scraped, dl=2027-03-29).
- **Erasmus Mundus** — `Erasmus Mundus Joint Master Degree` (curated, hidden) vs `Erasmus Mundus Joint Master Degree Scholarships` (scraped, visible).
- **Swiss Government Excellence** — curated `…Scholarship` (hidden) vs scraped `…Scholarships 2026-2027` (visible, dl=2026-11-29).
- **Onsi Sawiris** — two scraped records of the same scholarship, both with the corrupted country string `"United States; United States; United States; United States"`.

### Not really scholarships (should be dropped)
- `Top Five Fully Funded Scholarships This Week` — content roundup.
- `Online IELTS Scholarships from IELTSPodcast 2026` — commercial IELTS-prep ad.
- `Full MBA Scholarship at the Breyer State Theology University` — Breyer State is widely reported as non-accredited.
- `A & J Duct Cleaning Scholarship 2026…` — $2,000 US local-business award, irrelevant to the Arab/Egyptian audience.

### Country-field anomalies (24 records)
- 12 records use `country = "Multiple"` (flag renders 🌍, breaks country filter).
- 12 records use semicolon-joined multi-country strings (`"Morocco; Tunisia; Algeria; Nigeria"`, `"United States; Canada"`, `"Philippines; Malaysia; Thailand; China; Japan; Democratic People's Republic of Korea"`, and the doubled `"United States; United States; United States; United States"`).
- `country` is a free-text string; the country **filter and flag lookup are exact-match** (`scholarship-card-list.tsx:113`, `getCountryFlag`), so these records are unreachable when filtering by a single country.

---

## 5. Product compatibility (fields × features)

| Feature | Fields used | Compatible? |
|---|---|---|
| Search | nameEn, nameAr, university, country, description, degree | ✅ works; recall limited by 195 weak listicle titles |
| Country filter | country (exact) | ⚠️ works for 218; 24 multi-country/`Multiple` records break it |
| Degree filter | degree (substring) | ✅ works ("Bachelor / Master / PhD" matches all three) |
| Competition filter | competitionLevel | ✅ all set (medium 186 / high 45 / low 11) |
| Deadline sort | deadline | ⚠️ works, but 85 null + 39 placeholder `2030-02-19` dates distort ordering |
| AI matching | eligibleCountries, eligibleEducation, fieldOfStudy, min/maxAge, minimumGPA, englishRequirement, requiresResearch/WorkExp, applicationFee, deadline, competitionLevel | ⚠️ engine works; **195/242 records contribute only neutral/unknown terms** (empty arrays treated as "unknown" by design — `scholarship-matcher.ts:124`), so matches are generic for 81% of the catalogue |
| Eligibility matching | same eligibility fields | ⚠️ only 47 records produce real country/degree/field verdicts; the rest yield "check official page" |
| Scholarship cards | nameEn, nameAr, country, university, degree, competitionLevel, description, benefits, deadline, fitScore | ✅ renders; benefits missing on 195 → "Varies"; mojibake titles on 20 |
| Detail page | all + requiredDocuments, englishRequirement | ✅ honest "Not stated" fallback for gaps (`scholarships/[id]/page.tsx:346`) |
| Verification badge | isVerified, verifiedAt | ⚠️ all 242 show "Not yet manually checked" |
| **Field-of-study filter** | fieldOfStudy | ❌ **not implemented** (UI or API) |
| Sitemap | visibleScholarshipWhere | ✅ correct; `lastModified` omitted (no `updatedAt` on model) |

All student-facing list/match queries correctly apply the visibility filter (`/api/scholarships`, `/api/scholarships/match`, sitemap). The detail API (`/api/scholarships/[id]`) does **not** — an expired scholarship is still reachable by direct URL.

---

## 6. Launch minimum (ranked)

### CRITICAL — fix before MVP testing
1. **Refresh the 13 matched flagships' deadlines to the researched 2026–27 dates** (data already in `prisma/priority-scholarships-2026.ts`; Chevening 2026-10-06, Gates Cambridge 2026-12-03, etc.). Today 12/13 major flagships are invisible. Extend to the 22 curated MANUAL records (§3) so the curated tier is actually on-screen.
2. **Clean the 195 for9a-scraped records**: drop the 4 non-scholarships (§4), and hide/refresh the rest. 147 of the 157 visible records are aggregator listicles with no structured data — this is the majority of what testers see.
3. **Remove the 39 `2030-02-19` placeholder deadlines** (null them or replace with real dates).
4. **Fix mojibake in 20 `nameEn` values** (visible in every card title).
5. **Normalize the 24 multi-country/`Multiple` country values** (single `country` + `eligibleCountries` list, or array support).

### HIGH — before public launch
6. Backfill structured eligibility (eligibleCountries / eligibleEducation / fieldOfStudy / requiredDocuments) for the visible scraped records, or matches stay generic ("unknown") for 81% of the catalogue.
7. Replace for9a.com source URLs with official programme links on the records kept.
8. Fix 13 placeholder Arabic names + description mojibake (12).
9. Set `isVerified=true` + `verifiedAt` on the 8 newly researched records (evidence exists in `PRIORITY_SCHOLARSHIPS_2026.md`); the whole catalogue currently reads "Not yet manually checked".
10. Populate `deadlineType` (ROLLING / ANNUAL / CLOSED) — currently 100% UNKNOWN, so recurring programmes (KAUST, MEXT) can't show "opens annually".
11. Resolve the 4 duplicate/near-duplicate pairs (merge or deactivate one side).

### MEDIUM — after launch
12. Add a field-of-study filter to browse UI + `/api/scholarships`.
13. Rewrite the 6 generic/truncated descriptions.
14. English-requirement data for the 195 scraped records (matcher currently assumes "not required").
15. Add `updatedAt` to the Scholarship model (sitemap `lastModified` + freshness signals).
16. Surface `dataCompleteness` on cards (already computed by the matcher).

### LOW — future enhancement
17. Replace the emoji flag map with a country-code flag service.
18. Normalize eligibility enum values (`ALL` / `ANY` / `All`).
19. Structured benefits schema for the scraped set.
20. Seasonal refresh workflow for recurring scholarships.
21. **Any UI work must keep the SmartScholar brand font (IBM Plex Sans / Arabic, refined Wise Sans system) — no new primary font.**

---

## 7. What the ~72 testers will immediately hit

- **The best-known scholarships are missing.** Chevening, MEXT, Fulbright, Gates Cambridge, Rhodes, CSC, Australia Awards, Erasmus Mundus, Stipendium Hungaricum, Turkiye Burslari, Swedish Institute and Swiss Excellence all resolve to expired hidden records. Tester searches for these names return nothing.
- **Most visible records look like SEO listicles** — "Fully Funded Scholarships for Bachelor's, Master's, and PhD in Germany 2026" — with no eligibility info, no benefits, and a for9a.com source.
- **Every detail page** shows the "Not yet manually checked" badge (0 of 242 verified).
- **Match results** are dominated by "not listed — check the official page" neutral reasons, since 81% of records have empty eligibility arrays.
- **Broken text in titles**: "Ãsküdar University", "Masterâ€™s in Renewable…".
- **Country filter** lists nonsense options: "Multiple", "United States; Canada", "United States; United States; United States; United States".
- **Deadline sort** surfaces the same "19 Feb 2030" date for 39 records.
- Some "scholarships" are an IELTS-prep ad, a weekly roundup article, and a diploma-mill MBA.

---

## 8. Summary verdict

The platform code is launch-capable and handles missing data honestly. The **database is not launch-ready**: only 47 of 242 records carry structured eligibility, only 9 of those are visible, the curated flagships that matter most are hidden behind stale deadlines, and the visible majority is low-trust aggregator content. Fixing §6-CRITICAL items 1–3 converts a catalogue of 157 visible-but-weak records into one with real, visible, trustworthy scholarships for the MVP testers.
