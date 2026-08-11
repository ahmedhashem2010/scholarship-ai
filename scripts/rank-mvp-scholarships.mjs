#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  scoreScholarship,
  whyMadeTop50,
  funding,
  RESEARCH_DATE,
} from "./lib/mvp-ranking.mjs";
import pending2hModule from "../prisma/scholarship-enrichment-2h.ts";
const pending2h = Array.isArray(pending2hModule)
  ? pending2hModule
  : pending2hModule.scholarships;

/**
 * Rank all scholarships for the SmartScholar MVP Top-50 catalog.
 *
 *   node scripts/rank-mvp-scholarships.mjs               # writes SCHOLARSHIP_MVP_RANKING.md
 *   node scripts/rank-mvp-scholarships.mjs --json out.json
 *
 * Pure read + report: never writes to the database.
 *
 * Task 2H was applied to the database in Task 2J (Phase 2) — the DB now holds
 * 250 scholarships including the 8 formerly-pending records and the 3 updates.
 * The in-memory 2H overlay below is now a no-op safety net (matching by nameEn
 * finds the records already in the DB), kept so the script also works against
 * a pre-2H database snapshot.
 */

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const jsonArg = argv.find((a) => a.startsWith("--json"));
const now = new Date();

const dbRows = await prisma.scholarship.findMany({ orderBy: { nameEn: "asc" } });

// In-memory catalogue: DB rows + pending Task 2H records.
const catalog = new Map(dbRows.map((r) => [r.nameEn, r]));
let pendingAdded = 0;
let pendingUpdated = 0;
for (const rec of pending2h) {
  const existing = catalog.get(rec.nameEn);
  if (existing) {
    for (const k of Object.keys(rec)) {
      if (rec[k] !== undefined) existing[k] = rec[k];
    }
    existing.pending2h = "updated";
    pendingUpdated += 1;
  } else {
    catalog.set(rec.nameEn, {
      ...rec,
      description: rec.description ?? null,
      updatedAt: rec.verifiedAt ?? RESEARCH_DATE,
      pending2h: "new",
    });
    pendingAdded += 1;
  }
}
const rows = [...catalog.values()];

const scored = rows.map((r) => {
  const s = scoreScholarship(r, now);
  return {
    id: r.id,
    nameEn: r.nameEn,
    country: r.country,
    degree: r.degree,
    deadline: r.deadline ? r.deadline.toISOString().slice(0, 10) : null,
    source: r.source,
    sourceUrl: r.sourceUrl,
    fundingLabel: funding(r).label,
    isVerified: r.isVerified,
    verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString().slice(0, 10) : null,
    updatedAt: r.updatedAt.toISOString().slice(0, 10),
    pending2h: r.pending2h ?? false,
    components: s.components,
    total: s.total,
  };
});

scored.sort((a, b) => b.total - a.total || a.nameEn.localeCompare(b.nameEn));
scored.forEach((s, i) => { s.rank = i + 1; });

const TIER_B_MIN = 30;

const top50 = scored.slice(0, 50);
const rest = scored.slice(50);
const tierB = rest.filter((s) => s.total >= TIER_B_MIN);
const tierC = rest.filter((s) => s.total < TIER_B_MIN);

const stats = {
  audited: scored.length,
  top50: top50.length,
  tierB: tierB.length,
  tierC: tierC.length,
  pending2hAdded: pendingAdded,
  pending2hUpdated: pendingUpdated,
};

// Column statistics for the Top 50.
const statsTop = {
  bachelor: top50.filter((s) => s.components.bachelor === 10).length,
  fullyFunded: top50.filter((s) => s.components.funding === 15).length,
  tuitionStipend: top50.filter((s) => s.components.funding === 12).length,
  governmentSource: top50.filter((s) => s.source === "MANUAL").length,
  officialUrl: top50.filter((s) => /\.(gov|edu|ac|mil|int)\b|\.gov\.|\.ac\.|\.edu\./i.test(s.sourceUrl ?? "") || s.source === "MANUAL").length,
  international: top50.filter((s) => (s.components.mena >= 8)).length,
  egyptMena: top50.filter((s) => s.components.mena >= 9).length,
  confirmedDeadline: top50.filter((s) => s.components.deadline === 15).length,
  completeEligibility: top50.filter((s) => s.components.matching === 5).length,
};

const money = (n) => n.toLocaleString("en-US");

const fundingDisplay = (s) => {
  switch (s.components.funding) {
    case 15: return "Fully funded";
    case 12: return "Tuition + stipend";
    case 10: return "Tuition + accommodation";
    case 8: return "Substantial";
    case 5: return "Partial";
    case 3: return "Benefits listed";
    case 2: return "Unknown";
    case 0: return "No funding";
    default: return s.fundingLabel;
  }
};

const sourceDisplay = (s) =>
  s.source === "MANUAL" ? "Official (curated)" :
    /for9a\.com/i.test(s.sourceUrl ?? "") ? "Aggregator (scraped)" : "Official URL";

const deadlineDisplay = (s) => {
  if (!s.deadline) return "—";
  return s.deadline;
};

const mark = (s) => (s.pending2h ? " †" : "");

const rows50 = top50.map((s) =>
  `| ${s.rank} | ${s.nameEn.replace(/\|/g, "\\|")}${mark(s)} | ${s.country} | ${s.degree} | ${fundingDisplay(s)} | ${deadlineDisplay(s)} | ${sourceDisplay(s)} | ${s.total} | ${whyMadeTop50({ components: s.components }, s)} |`
);

const rowsB = tierB.map((s) =>
  `| ${s.rank} | ${s.nameEn.replace(/\|/g, "\\|")}${mark(s)} | ${s.country} | ${s.degree} | ${s.total} |`
);

const rowsC = tierC.map((s) =>
  `| ${s.rank} | ${s.nameEn.replace(/\|/g, "\\|")}${mark(s)} | ${s.country} | ${s.degree} | ${s.total} |`
);

const md = `# SmartScholar MVP Scholarship Ranking

Generated on ${now.toISOString().slice(0, 10)} by \`scripts/rank-mvp-scholarships.mjs\`.
Deterministic ranking — every score is computed from scholarship fields by \`scripts/lib/mvp-ranking.mjs\`.
No scholarships were added, deleted or modified. Nothing was written to the database.

> Task 2H is applied (Task 2J, Phase 2): the database holds ${dbRows.length}
> scholarships. The 8 new Task 2H records and 3 Task 2H updates are live.
> Records marked † previously needed the in-memory overlay; the overlay is now
> a no-op and marks are retained only for traceability. See
> \`SCHOLARSHIP_MVP_CATALOG.md\` for the official MVP catalog (Top 50).

## Scoring formula (100 points)

| Component | Weight | What is scored (from database fields) |
|---|---|---|
| Data completeness | 20 | 10 checks × 2: eligibleCountries, eligibleEducation, fieldOfStudy, benefits, requirements, requiredDocuments, deadline, englishRequirement, age/GPA depth, description |
| Source quality | 15 | \`source\` = MANUAL → 15; SCRAPED with official URL → 10; SCRAPED aggregator (for9a.com) → 3 |
| Deadline quality | 15 | Confirmed future 2026/27 deadline → 15; null + curated (cycle in requirements) → 10; null + scraped → 8; expired → 0 |
| Funding | 15 | Keyword tiers over benefits+description: fully funded 15, tuition+stipend 12, tuition+accommodation 10, substantial 8, partial 5, unknown 2, none 0 |
| Bachelor relevance | 10 | Bachelor's / undergraduate eligible → 10; Master/PhD only → 4; unknown → 5 |
| Egypt/MENA eligibility | 10 | Egypt explicitly listed → 10; MENA country listed → 9; \`All\` (international) → 8; other countries → 5; unknown → 4 |
| Application usability | 5 | Official application URL / MANUAL → 5; aggregator link → 2 |
| Matching confidence | 5 | country + education + field all structured → 5; partial → 3; none → 1 |
| Programme value | 3 | Government/official/university → 3; aggregator → 1 |
| Freshness | 2 | updatedAt within 90 days → 2; within 365 → 1; older → 0 |
| **Total** | **100** | |

Notes:
- Scores are fully reproducible from the scholarship fields; no AI is involved.
- Expired deadlines score 0 in the deadline component but the record is never deleted.
- "Data completeness" measures whether a field is present, not whether it is current (currency is scored separately).

## Top 50

| Rank | Scholarship | Country | Degree | Funding | Deadline | Source quality | Score | Why it made the Top 50 |
|---|---|---|---|---|---|---|---|---|
${rows50.join("\n")}

## Tier B — kept, ranked 51+ (still worth showing in a full catalog, not in the MVP Top 50)

Threshold: score ${TIER_B_MIN}+. ${tierB.length} scholarships.

| Rank | Scholarship | Country | Degree | Score |
|---|---|---|---|
${rowsB.join("\n")}

## Tier C — hidden from the MVP (too incomplete / expired / aggregator-only / low quality)

Threshold: score < ${TIER_B_MIN}. ${tierC.length} scholarships. These are not deleted — the app's existing \`isActive\` flag (see below) can hide them.

| Rank | Scholarship | Country | Degree | Score |
|---|---|---|---|
${rowsC.join("\n")}

## Statistics

Total scholarships audited: **${stats.audited}**
Top 50: **${stats.top50}** (official MVP catalog: \`SCHOLARSHIP_MVP_CATALOG.md\`)
Tier B (worth keeping): **${stats.tierB}**
Tier C (hide from MVP): **${stats.tierC}**

Of the **Top 50**:

| Measure | Count |
|---|---|
| Bachelor's-eligible (recent high-school graduates) | ${statsTop.bachelor} |
| Fully funded | ${statsTop.fullyFunded} |
| Tuition + stipend | ${statsTop.tuitionStipend} |
| Government / official source (MANUAL) | ${statsTop.governmentSource} |
| Official application / source URL | ${statsTop.officialUrl} |
| Accepting international students (All / listed) | ${statsTop.international} |
| Clearly eligible for Egyptians / MENA | ${statsTop.egyptMena} |
| Confirmed 2026/27 deadline | ${statsTop.confirmedDeadline} |
| Complete structured eligibility (country + education + field) | ${statsTop.completeEligibility} |

## Hiding mechanism

The application already has a safe active/inactive mechanism:

- Schema: \`Scholarship.isActive\` (default \`true\`), plus \`inactiveReason\` and \`deadlineType\`.
- Every student-facing query goes through \`src/lib/scholarship-filters.ts\`
  (\`visibleScholarshipWhere\` / \`withVisibility\`), which requires
  \`isActive: true\`. This is used by \`/api/scholarships\` (list/search) and
  \`/api/scholarships/match\` (matching).
- Setting \`isActive: false\` (optionally with \`inactiveReason: "MVP_TIER_C"\`)
  would hide a Tier C record from the MVP catalogue without deleting it.

Recommendation: this mechanism can be used safely to hide Tier C records when
the product decision is made. It is NOT applied here — the ranking is a report
only, and the Top 50 has not been made the MVP-visible catalog yet.

## Data notes

- ${stats.audited} scholarships audited (Task 2H applied — all 250 in the database). Source values seen: MANUAL (curated) and SCRAPED (for9a.com aggregator).
- All records carry \`deadlineType = "UNKNOWN"\`, so deadline scoring does not rely on it.
- ${top50.filter((s) => s.components.deadline === 15).length} of the Top 50 have a confirmed future 2026/27 deadline.
- Data-quality flag: one record ("Onsi Sawiris Scholarship 2026 for Egyptian Students Fully Funded Bachelor's in USA", rank ${(scored.find((s) => /; United States;/.test(s.country)) || {}).rank}) has a corrupted country value ("United States; United States; United States; United States") — flagged for cleanup, not scored differently.
- Tier C is the 11 lowest-scoring records (score < ${TIER_B_MIN}): incomplete, expired or aggregator-only listings. They remain in the database.
`;

writeFileSync(join(process.cwd(), "SCHOLARSHIP_MVP_RANKING.md"), md, "utf8");
console.log(`Wrote SCHOLARSHIP_MVP_RANKING.md (${stats.audited} audited, top ${stats.top50}, tierB ${stats.tierB}, tierC ${stats.tierC})`);

if (jsonArg) {
  const out = jsonArg.slice("--json".length).replace(/^=/, "");
  mkdirSync(join(process.env.TEMP ?? ".", "opencode"), { recursive: true });
  const path = out || join(process.env.TEMP ?? ".", "opencode", "mvp-scores.json");
  writeFileSync(path, JSON.stringify({ generatedAt: now.toISOString(), stats, statsTop, scored }, null, 2));
  console.log(`Wrote ${path}`);
}

await prisma.$disconnect();
