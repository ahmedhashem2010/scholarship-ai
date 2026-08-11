#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  scoreScholarship,
  funding,
  whyMadeTop50,
} from "./lib/mvp-ranking.mjs";

/**
 * Task 2J PHASE 3 + 4 — generate the official SmartScholar MVP scholarship
 * catalog.
 *
 *   npx tsx scripts/generate-mvp-catalog.mjs
 *
 * Reads the 250 scholarships now in the DB, re-scores them deterministically
 * with the ranking formula, and writes SCHOLARSHIP_MVP_CATALOG.md containing
 * the exact 50 records to expose during MVP testing, plus a per-record quality
 * report (Phase 4) flagging anything missing critical information.
 *
 * Pure read + report — never writes to the database.
 */

const prisma = new PrismaClient();
const now = new Date();

const rows = await prisma.scholarship.findMany({ orderBy: { nameEn: "asc" } });

const scored = rows.map((r) => {
  const s = scoreScholarship(r, now);
  return {
    id: r.id,
    nameEn: r.nameEn,
    nameAr: r.nameAr,
    country: r.country,
    university: r.university,
    degree: r.degree,
    deadline: r.deadline ? r.deadline.toISOString().slice(0, 10) : null,
    source: r.source,
    sourceUrl: r.sourceUrl,
    isVerified: r.isVerified,
    updatedAt: r.updatedAt.toISOString().slice(0, 10),
    benefits: r.benefits,
    description: r.description,
    components: s.components,
    total: s.total,
  };
});

scored.sort((a, b) => b.total - a.total || a.nameEn.localeCompare(b.nameEn));
scored.forEach((s, i) => { s.rank = i + 1; });

const top50 = scored.slice(0, 50);

const fundingLabel = (s) => {
  switch (s.components.funding) {
    case 15: return "Fully funded";
    case 12: return "Tuition + stipend";
    case 10: return "Tuition + accommodation";
    case 8: return "Substantial";
    case 5: return "Partial";
    case 3: return "Benefits listed";
    case 2: return "Unknown";
    case 0: return "No funding";
    default: return funding({ benefits: s.benefits, description: s.description }).label;
  }
};

const PLACEHOLDER_YEAR = 2027;

const flags = [];
for (const s of top50) {
  const issues = [];
  if (!s.sourceUrl || !/^https?:\/\//i.test(s.sourceUrl)) {
    issues.push(`missing application URL`);
  }
  if (s.deadline) {
    const d = new Date(s.deadline);
    if (d.getTime() < now.getTime()) {
      issues.push(`deadline passed (${s.deadline})`);
    } else if (d.getUTCFullYear() > PLACEHOLDER_YEAR) {
      issues.push(`suspicious far-future deadline (${s.deadline})`);
    }
  } else if (s.source === "SCRAPED") {
    issues.push(`no deadline captured (verify on official page)`);
  }
  if (s.components.matching < 5) {
    issues.push(`incomplete structured eligibility for matching (${s.components.matching}/5)`);
  }
  if (s.components.completeness < 12) {
    issues.push(`low data completeness (${s.components.completeness}/20)`);
  }
  flags.push({ rank: s.rank, issues });
}

const flagsCount = flags.filter((f) => f.issues.length).length;

const rows50 = top50.map((s) =>
  `| ${s.rank} | ${s.nameEn.replace(/\|/g, "\\|")} | ${s.country.replace(/\|/g, "\\|")} | ${s.degree.replace(/\|/g, "\\|")} | ${fundingLabel(s)} | ${s.deadline ?? "—"} | ${s.source} | ${s.sourceUrl ?? "—"} | ${s.components.completeness}/20 | ${s.components.matching}/5 | ${s.total} |`
);

const flagsTable = flags
  .filter((f) => f.issues.length)
  .map((f) => `| ${f.rank} | ${top50[f.rank - 1].nameEn.replace(/\|/g, "\\|")} | ${f.issues.join("; ")} |`);

const md = `# SmartScholar MVP Scholarship Catalog

Generated on ${now.toISOString().slice(0, 10)} by \`scripts/generate-mvp-catalog.mjs\`.

This is the **official SmartScholar MVP catalog** — the exact **50 scholarships**
to expose during MVP testing with the ~72-person testing team. It is read from
the live database (250 scholarships) and re-scored with the deterministic
ranking formula in \`scripts/lib/mvp-ranking.mjs\`.

The remaining 200 database records (Tier B "worth keeping" and Tier C
"incomplete/expired") are **not deleted and not deactivated** — they simply are
not part of this MVP exposure list. See \`SCHOLARSHIP_MVP_RANKING.md\` for the
full ranking.

## MVP Top 50

| Rank | Scholarship | Country | Degree | Funding | Deadline | Source | Application URL | Data completeness | Matchability | Score |
|---|---|---|---|---|---|---|---|---|---|---|
${rows50.join("\n")}

## Phase 4 — quality flags

Any Top-50 record missing critical information is flagged below rather than
assumed ready. **${flagsCount} of 50** records have at least one flag.

| Rank | Scholarship | Flagged issue(s) |
|---|---|---|
${flagsTable.length ? flagsTable.join("\n") : "None — all Top 50 records are complete."}

## Notes

- Data completeness is out of 20 (10 fields × 2). Matchability is out of 5
  (country + education + field of study all structured).
- Expired-deadline flags are informational: the app's visibility filter
  (\`src/lib/scholarship-filters.ts\`) already hides passed deadlines with a
  2-day grace period, and the matching engine treats a passed deadline as a
  disqualifier. These records may still open a new 2027/28 cycle.
- Phase 2 (Task 2H) is applied: the database holds 250 scholarships.
`;

writeFileSync(join(process.cwd(), "SCHOLARSHIP_MVP_CATALOG.md"), md, "utf8");
console.log(`Wrote SCHOLARSHIP_MVP_CATALOG.md (${top50.length} records, ${flagsCount} flagged)`);

await prisma.$disconnect();
