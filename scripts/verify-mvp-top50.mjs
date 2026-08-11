#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import {
  scoreScholarship,
  funding,
  whyMadeTop50,
  RESEARCH_DATE,
} from "./lib/mvp-ranking.mjs";
import pending2hModule from "../prisma/scholarship-enrichment-2h.ts";
const pending2h = Array.isArray(pending2hModule)
  ? pending2hModule
  : pending2hModule.scholarships;

/**
 * Verify the MVP Top-50 catalog (Task 2J PHASE 1 + PHASE 4).
 *
 *   npx tsx scripts/verify-mvp-top50.mjs
 *   npx tsx scripts/verify-mvp-top50.mjs --json
 *
 * Rebuilds the same in-memory catalogue as the ranking script (DB + approved
 * Task 2H records overlaid by nameEn), re-scores it deterministically, then
 * checks every Top-50 record against hard criteria:
 *   - exists in DB OR is an approved Task 2H record
 *   - nameEn unique across the full catalogue
 *   - has a source URL
 *   - is actually a scholarship (name / country / degree present)
 *   - has enough structured data for the matching engine
 *   - is not expired and has no placeholder deadline
 *   - has meaningful eligibility / funding info
 * Pure read + report — never writes to the database.
 */

const prisma = new PrismaClient();
const now = new Date();
const jsonArg = process.argv.find((a) => a.startsWith("--json"));

const dbRows = await prisma.scholarship.findMany({ orderBy: { nameEn: "asc" } });

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
    id: r.id ?? null,
    nameEn: r.nameEn,
    nameAr: r.nameAr ?? null,
    country: r.country,
    degree: r.degree,
    deadline: r.deadline ? r.deadline.toISOString().slice(0, 10) : null,
    source: r.source,
    sourceUrl: r.sourceUrl ?? null,
    university: r.university ?? null,
    eligibleCountries: Array.isArray(r.eligibleCountries) ? r.eligibleCountries : [],
    eligibleEducation: Array.isArray(r.eligibleEducation) ? r.eligibleEducation : [],
    fieldOfStudy: Array.isArray(r.fieldOfStudy) ? r.fieldOfStudy : [],
    requiredDocuments: Array.isArray(r.requiredDocuments) ? r.requiredDocuments : [],
    benefits: r.benefits ?? null,
    requirements: r.requirements ?? null,
    englishRequirement: r.englishRequirement ?? null,
    minimumAge: r.minimumAge ?? null,
    maximumAge: r.maximumAge ?? null,
    minimumGPA: r.minimumGPA ?? null,
    applicationFee: r.applicationFee ?? null,
    competitionLevel: r.competitionLevel ?? null,
    updatedAt: r.updatedAt.toISOString().slice(0, 10),
    pending2h: r.pending2h ?? null,
    components: s.components,
    total: s.total,
  };
});

scored.sort((a, b) => b.total - a.total || a.nameEn.localeCompare(b.nameEn));
scored.forEach((s, i) => { s.rank = i + 1; });

const top50 = scored.slice(0, 50);

const dbNameEn = new Set(dbRows.map((r) => r.nameEn));
const catalogNameEn = new Map();
for (const r of rows) {
  catalogNameEn.set(r.nameEn, (catalogNameEn.get(r.nameEn) ?? 0) + 1);
}

const PLACEHOLDER_YEAR = 2027;
const flag = (s, issue, detail) => ({ rank: s.rank, nameEn: s.nameEn, issue, detail });

const checks = [];
for (const s of top50) {
  const problems = [];

  if (!s.id && s.pending2h !== "new") {
    problems.push({ issue: "not-in-db-not-pending", detail: "neither a DB record nor a marked pending-2H record" });
  }
  if (!s.sourceUrl || !/^https?:\/\//i.test(s.sourceUrl)) {
    problems.push({ issue: "no-source-url", detail: `sourceUrl=${String(s.sourceUrl).slice(0, 60) || "(empty)"}` });
  }
  if (!s.nameEn || !s.country || !s.degree) {
    problems.push({ issue: "not-a-scholarship", detail: `name=${s.nameEn}, country=${s.country}, degree=${s.degree}` });
  }
  const dupCount = catalogNameEn.get(s.nameEn) ?? 0;
  if (dupCount > 1) {
    problems.push({ issue: "duplicate-nameEn", detail: `${dupCount} records share this nameEn` });
  }
  const matchable =
    s.eligibleCountries.length > 0 &&
    s.eligibleEducation.length > 0 &&
    s.fieldOfStudy.length > 0;
  if (!matchable) {
    problems.push({
      issue: "insufficient-matching-data",
      detail: `eligibleCountries=${s.eligibleCountries.length}, eligibleEducation=${s.eligibleEducation.length}, fieldOfStudy=${s.fieldOfStudy.length}`,
    });
  }
  if (s.deadline) {
    const d = new Date(s.deadline);
    if (d.getTime() < now.getTime()) {
      problems.push({ issue: "expired-deadline", detail: s.deadline });
    } else if (d.getUTCFullYear() > PLACEHOLDER_YEAR) {
      problems.push({ issue: "placeholder-deadline", detail: `${s.deadline} (beyond ${PLACEHOLDER_YEAR})` });
    }
  }
  const fundingScore = s.components.funding;
  if (fundingScore < 5) {
    problems.push({
      issue: "weak-funding-info",
      detail: `funding score=${fundingScore} (${funding({ benefits: s.benefits, description: null }).label})`,
    });
  }
  if (problems.length === 0) {
    checks.push({ rank: s.rank, nameEn: s.nameEn, status: "OK", problems: [] });
  } else {
    for (const p of problems) {
      checks.push({ rank: s.rank, nameEn: s.nameEn, status: "FLAG", ...p });
    }
  }
}

const summary = {
  generatedAt: now.toISOString(),
  dbCount: dbRows.length,
  audited: scored.length,
  top50: top50.length,
  pending2hAdded: pendingAdded,
  pending2hUpdated: pendingUpdated,
  okCount: checks.filter((c) => c.status === "OK").length,
  flagCount: checks.filter((c) => c.status === "FLAG").length,
  flags: checks.filter((c) => c.status === "FLAG"),
  top50: top50.map((s) => ({
    rank: s.rank,
    nameEn: s.nameEn,
    country: s.country,
    degree: s.degree,
    deadline: s.deadline,
    source: s.source,
    sourceUrl: s.sourceUrl,
    university: s.university,
    funding: funding({ benefits: s.benefits, description: null }).label,
    fundingScore: s.components.funding,
    dataCompleteness: s.components.completeness,
    matchability: s.components.matching,
    total: s.total,
    pending2h: s.pending2h,
    inDb: Boolean(s.id),
  })),
};

if (jsonArg) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`DB: ${dbRows.length} | audited: ${scored.length} | Top 50 verified: ${summary.okCount} OK, ${summary.flagCount} flagged`);
  for (const f of summary.flags) {
    console.log(`  ⚠ #${f.rank} ${f.nameEn} — ${f.issue}: ${f.detail}`);
  }
  console.log("\nTop 50 recap (rank | name | country | deadline | funding score | matchability | total | in-DB | pending):");
  for (const s of summary.top50) {
    console.log(
      `${String(s.rank).padStart(2)} | ${s.nameEn.slice(0, 55).padEnd(55)} | ${s.country.padEnd(12)} | ${String(s.deadline ?? "—").padStart(10)} | fund=${String(s.fundingScore).padStart(2)} | match=${s.matchability} | ${s.total} | db=${s.inDb ? "Y" : "N"} | 2H=${s.pending2h ?? "-"}`
    );
  }
}

await prisma.$disconnect();
