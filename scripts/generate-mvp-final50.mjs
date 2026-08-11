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
  RESEARCH_DATE,
} from "./lib/mvp-ranking.mjs";

/**
 * Task 2K — the final "currently usable" MVP 50.
 *
 *   npx tsx scripts/generate-mvp-final50.mjs
 *
 * Re-ranks the full live DB (250 scholarships) with the deterministic ranking
 * formula, then filters to *currently usable* records and selects the top 50:
 *
 *   - isActive = true
 *   - not past its deadline (null / recurring deadlines qualify when the
 *     record represents an active recurring programme with a source URL)
 *   - not a placeholder deadline (e.g. a far-future year such as 2030)
 *   - is an actual scholarship (name / country / degree present)
 *   - has enough info to display a useful card (source URL + funding + completeness)
 *   - has enough structured eligibility for meaningful matching
 *     (eligibleCountries + eligibleEducation + fieldOfStudy all populated)
 *
 * Any previously Top-50 record that fails these criteria (expired deadline,
 * placeholder deadline, missing matching data) is replaced by the highest-ranked
 * qualifying scholarship below rank 50. The output file
 * SCHOLARSHIP_MVP_FINAL_50.md contains the exact 50 records, a replacement
 * report and a diversity report.
 *
 * Pure read + report — never writes to the database.
 */

const prisma = new PrismaClient();
const now = new Date();
const TODAY = now.toISOString().slice(0, 10);
const PLACEHOLDER_YEAR = 2027;

const rows = await prisma.scholarship.findMany({ orderBy: { nameEn: "asc" } });

const scored = rows.map((r) => {
  const s = scoreScholarship(r, now);
  return {
    id: r.id,
    nameEn: r.nameEn,
    nameAr: r.nameAr ?? null,
    country: r.country,
    university: r.university ?? null,
    degree: r.degree,
    deadline: r.deadline ? r.deadline.toISOString().slice(0, 10) : null,
    source: r.source,
    sourceUrl: r.sourceUrl ?? null,
    isActive: r.isActive !== false,
    eligibleCountries: Array.isArray(r.eligibleCountries) ? r.eligibleCountries : [],
    eligibleEducation: Array.isArray(r.eligibleEducation) ? r.eligibleEducation : [],
    fieldOfStudy: Array.isArray(r.fieldOfStudy) ? r.fieldOfStudy : [],
    requiredDocuments: Array.isArray(r.requiredDocuments) ? r.requiredDocuments : [],
    benefits: r.benefits ?? null,
    requirements: r.requirements ?? null,
    updatedAt: r.updatedAt.toISOString().slice(0, 10),
    components: s.components,
    total: s.total,
  };
});

scored.sort((a, b) => b.total - a.total || a.nameEn.localeCompare(b.nameEn));
scored.forEach((s, i) => { s.rank = i + 1; });

/* ---------------- "currently usable" test ---------------- */

const qualify = (s) => {
  const reasons = [];

  if (s.isActive !== true) {
    reasons.push(`not active (isActive=${s.isActive})`);
  }

  if (!s.nameEn || !s.country || !s.degree) {
    reasons.push(`not an actual scholarship (name="${s.nameEn}", country="${s.country}", degree="${s.degree}")`);
  }

  if (s.deadline) {
    const d = new Date(s.deadline);
    if (d.getTime() < now.getTime()) {
      reasons.push(`deadline passed (${s.deadline})`);
    } else if (d.getUTCFullYear() > PLACEHOLDER_YEAR) {
      reasons.push(`placeholder deadline (${s.deadline}, beyond ${PLACEHOLDER_YEAR})`);
    }
  }

  if (!s.sourceUrl || !/^https?:\/\//i.test(s.sourceUrl)) {
    reasons.push("no source URL");
  }

  if (s.components.completeness < 12) {
    reasons.push(`low card completeness (${s.components.completeness}/20)`);
  }

  if (s.components.funding < 5) {
    reasons.push(`weak funding info (${s.components.funding}/15)`);
  }

  const matchable =
    s.eligibleCountries.length > 0 &&
    s.eligibleEducation.length > 0 &&
    s.fieldOfStudy.length > 0;
  if (!matchable) {
    reasons.push(
      `insufficient matching data (eligibleCountries=${s.eligibleCountries.length}, eligibleEducation=${s.eligibleEducation.length}, fieldOfStudy=${s.fieldOfStudy.length})`
    );
  }

  return { ok: reasons.length === 0, reasons };
};

const assessed = scored.map((s) => {
  const q = qualify(s);
  return { ...s, disqualifiers: q.ok ? [] : q.reasons };
});

const qualifying = assessed.filter((s) => s.disqualifiers.length === 0);
qualifying.forEach((s, i) => { s.finalRank = i + 1; });

const top50 = qualifying.slice(0, 50);
const top50Names = new Set(top50.map((s) => s.nameEn));

/* ---------------- replacement report (records pushed out) ---------------- */

const previousTop50 = assessed.slice(0, 50);
const replaced = previousTop50.filter((s) => !top50Names.has(s.nameEn));
const promoted = qualifying
  .slice(50)
  .filter((s) => previousTop50.some((p) => p.nameEn === s.nameEn))
  .map((s) => s.nameEn);

const replacements = replaced.map((s) => ({
  rank: s.rank,
  nameEn: s.nameEn,
  country: s.country,
  total: s.total,
  reasons: s.disqualifiers.length ? s.disqualifiers : ["outside final 50 after re-rank"],
}));

/* ---------------- diversity report ---------------- */

const countBy = (arr, key) => {
  const m = new Map();
  for (const s of arr) {
    const k = s[key] ?? "(none)";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const degreeBreakdown = countBy(top50, "degree");
const sourceBreakdown = countBy(top50, "source");
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
    default: return funding({ benefits: s.benefits, description: null }).label;
  }
};
const fundingBreakdown = new Map();
for (const s of top50) {
  const l = fundingLabel(s);
  fundingBreakdown.set(l, (fundingBreakdown.get(l) ?? 0) + 1);
}
const fundingRows = [...fundingBreakdown.entries()].sort((a, b) => b[1] - a[1]);

const countries = countBy(top50, "country");
const universities = countBy(top50, "university");

/* ---------------- markdown ---------------- */

const mdRows = top50.map((s) =>
  `| ${s.finalRank} | ${s.nameEn.replace(/\|/g, "\\|")} | ${(s.country ?? "").replace(/\|/g, "\\|")} | ${s.degree.replace(/\|/g, "\\|")} | ${fundingLabel(s)} | ${s.deadline ?? "Recurring / unknown"} | ${s.source} | ${s.components.completeness}/20 | ${s.components.matching}/5 | ${s.total} |`
);

const replaceRows = replacements.map((r) =>
  `| ${r.rank} | ${r.nameEn.replace(/\|/g, "\\|")} | ${r.reasons.join("; ")} |`
);

const countryTable = countries.map(([c, n]) => `| ${c} | ${n} |`).join("\n");
const degreeTable = degreeBreakdown.map(([d, n]) => `| ${d} | ${n} |`).join("\n");
const fundingTable = fundingRows.map(([f, n]) => `| ${f} | ${n} |`).join("\n");
const sourceTable = sourceBreakdown.map(([s, n]) => `| ${s} | ${n} |`).join("\n");

const md = `# SmartScholar — Final MVP 50 (Task 2K)

Generated on ${TODAY} by \`scripts/generate-mvp-final50.mjs\`.

This is the **final, currently-usable MVP list of exactly 50 scholarships** for
the testing team. Unlike the earlier catalog, every record here is usable
**today**:

- active in the database
- **not past its deadline** (as of ${TODAY}); recurring programmes with an
  unknown deadline qualify only when they represent an active programme with a
  source URL
- **no placeholder deadlines** (nothing beyond ${PLACEHOLDER_YEAR})
- an actual scholarship with name / country / degree
- enough info to display a useful card (source URL, funding, completeness ≥ 12)
- **enough structured eligibility for meaningful matching** — all of
  \`eligibleCountries\`, \`eligibleEducation\` and \`fieldOfStudy\` populated

**No database changes were made.** The other 200 records remain in the database,
inactive in this catalog, exactly as they were.

## Final 50

| Rank | Scholarship | Country | Degree | Funding | Deadline | Source | Completeness | Matchability | Score |
|---|---|---|---|---|---|---|---|---|---|
${mdRows.join("\n")}

## Replaced from the earlier Top 50

These records were in the top 50 by raw score but fail the "currently usable"
criteria, so they were replaced by the highest-ranked qualifying scholarship
below rank 50.

| Rank | Scholarship | Reason |
|---|---|---|
${replaceRows.length ? replaceRows.join("\n") : "None."}

## Diversity report

### By country (top 15)
| Country | Count |
|---|---|
${countryTable}

### By degree level
| Degree | Count |
|---|---|
${degreeTable}

### By funding level
| Funding | Count |
|---|---|
${fundingTable}

### By data source
| Source | Count |
|---|---|
${sourceTable}

### Notes
- Total distinct countries: **${countries.length}** (${universities.length} distinct universities / hosts).
- Matchability ${top50.filter((s) => s.components.matching === 5).length}/50 records have fully structured eligibility.
- All 50 records have a source URL and a funding classification.
- This list is a pure report: the database was not modified.
`;

writeFileSync(join(process.cwd(), "SCHOLARSHIP_MVP_FINAL_50.md"), md, "utf8");

const json = {
  generatedAt: new Date().toISOString(),
  dbCount: rows.length,
  qualifying: qualifying.length,
  final50: top50.map((s) => ({
    rank: s.finalRank,
    id: s.id,
    nameEn: s.nameEn,
    country: s.country,
    degree: s.degree,
    funding: fundingLabel(s),
    deadline: s.deadline,
    source: s.source,
    completeness: s.components.completeness,
    matchability: s.components.matching,
    total: s.total,
  })),
};
writeFileSync(join(process.cwd(), "SCHOLARSHIP_MVP_FINAL_50.json"), JSON.stringify(json, null, 2), "utf8");
console.log(`Final 50: ${top50.length} qualifying records written to SCHOLARSHIP_MVP_FINAL_50.md`);
console.log(`Wrote SCHOLARSHIP_MVP_FINAL_50.json (machine-readable sidecar)`);
console.log(`Replaced from earlier top 50: ${replacements.length}`);
for (const r of replacements) {
  console.log(`  #${r.rank} ${r.nameEn} — ${r.reasons.join("; ")}`);
}
console.log(`Qualifying pool: ${qualifying.length} | Countries: ${countries.length}`);

await prisma.$disconnect();
