#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  scoreScholarship,
  RESEARCH_DATE,
} from "./lib/mvp-ranking.mjs";

/**
 * Verify the Task 2K "Final MVP 50" (SCHOLARSHIP_MVP_FINAL_50.md).
 *
 *   npx tsx scripts/verify-mvp-final50.mjs
 *   npx tsx scripts/verify-mvp-final50.mjs --json
 *
 * Independently re-derives the currently-usable final 50 straight from the live
 * database and cross-checks the committed machine-readable sidecar
 * (SCHOLARSHIP_MVP_FINAL_50.json):
 *   - exactly 50 rows, no duplicate nameEn
 *   - every row exists in the DB (id present)
 *   - isActive
 *   - not expired / no placeholder deadline
 *   - real scholarship (name / country / degree)
 *   - source URL present
 *   - completeness >= 12 and funding info present
 *   - matching-critical fields populated (eligibleCountries/Education/fieldOfStudy)
 *   - the sidecar list matches the derived list exactly (same set + order)
 *
 * Pure read + report — never writes to the database.
 */

const prisma = new PrismaClient();
const now = new Date();
const jsonArg = process.argv.find((a) => a.startsWith("--json"));

const sidecarPath = join(process.cwd(), "SCHOLARSHIP_MVP_FINAL_50.json");
if (!existsSync(sidecarPath)) {
  console.error("SCHOLARSHIP_MVP_FINAL_50.json not found");
  process.exit(1);
}
const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
const mdRows = sidecar.final50.map((s) => s.nameEn);

const rows = await prisma.scholarship.findMany({ orderBy: { nameEn: "asc" } });
const dbById = new Map(rows.map((r) => [r.id, r]));

const scored = rows.map((r) => {
  const s = scoreScholarship(r, now);
  return {
    id: r.id,
    nameEn: r.nameEn,
    country: r.country,
    degree: r.degree,
    deadline: r.deadline ? r.deadline.toISOString().slice(0, 10) : null,
    isActive: r.isActive !== false,
    sourceUrl: r.sourceUrl ?? null,
    benefits: r.benefits ?? null,
    eligibleCountries: Array.isArray(r.eligibleCountries) ? r.eligibleCountries : [],
    eligibleEducation: Array.isArray(r.eligibleEducation) ? r.eligibleEducation : [],
    fieldOfStudy: Array.isArray(r.fieldOfStudy) ? r.fieldOfStudy : [],
    components: s.components,
    total: s.total,
  };
});

scored.sort((a, b) => b.total - a.total || a.nameEn.localeCompare(b.nameEn));
scored.forEach((s, i) => { s.rank = i + 1; });

const PLACEHOLDER_YEAR = 2027;
const qualify = (s) => {
  const reasons = [];
  if (s.isActive !== true) reasons.push("inactive");
  if (!s.nameEn || !s.country || !s.degree) reasons.push("not-a-scholarship");
  if (s.deadline) {
    const d = new Date(s.deadline);
    if (d.getTime() < now.getTime()) reasons.push(`expired (${s.deadline})`);
    else if (d.getUTCFullYear() > PLACEHOLDER_YEAR) reasons.push(`placeholder (${s.deadline})`);
  }
  if (!s.sourceUrl || !/^https?:\/\//i.test(s.sourceUrl)) reasons.push("no-source-url");
  if (s.components.completeness < 12) reasons.push(`completeness ${s.components.completeness}`);
  if (s.components.funding < 5) reasons.push(`funding ${s.components.funding}`);
  if (!(s.eligibleCountries.length && s.eligibleEducation.length && s.fieldOfStudy.length)) {
    reasons.push(`matching (c=${s.eligibleCountries.length},e=${s.eligibleEducation.length},f=${s.fieldOfStudy.length})`);
  }
  return reasons;
};

const derived = [];
for (const s of scored) {
  const reasons = qualify(s);
  if (reasons.length === 0) derived.push(s);
  if (derived.length === 50) break;
}
const derivedNames = derived.map((s) => s.nameEn);

const problems = [];

if (mdRows.length !== 50) problems.push(`markdown has ${mdRows.length} rows (expected 50)`);
const dup = mdRows.filter((n, i) => mdRows.indexOf(n) !== i);
if (dup.length) problems.push(`duplicate names in markdown: ${[...new Set(dup)].join(", ")}`);
if (new Set(mdRows).size !== 50) problems.push("markdown set not exactly 50 unique names");

const mdSet = new Set(mdRows);
const derivedSet = new Set(derivedNames);
const inMdNotDerived = [...mdSet].filter((n) => !derivedSet.has(n));
const inDerivedNotMd = [...derivedSet].filter((n) => !mdSet.has(n));
if (inMdNotDerived.length) problems.push(`in MD but not derived: ${inMdNotDerived.join("; ")}`);
if (inDerivedNotMd.length) problems.push(`derived but not in MD: ${inDerivedNotMd.join("; ")}`);
const orderDiffers = mdRows.some((n, i) => n !== derivedNames[i]);
if (orderDiffers) problems.push("markdown order does not match derived order");

const flags = [];
for (const s of derived) {
  const reasons = qualify(s);
  if (reasons.length) flags.push({ nameEn: s.nameEn, reasons });
}

const summary = {
  generatedAt: now.toISOString(),
  dbCount: rows.length,
  derived: derived.length,
  sidecarRows: mdRows.length,
  uniqueMarkdown: new Set(mdRows).size,
  problems,
  flagged: flags,
  deadlineNull: derived.filter((s) => !s.deadline).length,
  deadlineConfirmed: derived.filter((s) => s.deadline).length,
  allActive: derived.every((s) => s.isActive === true),
  allMatchable: derived.every((s) => s.components.matching === 5),
  allInDb: derived.every((s) => dbById.has(s.id)),
  countries: new Set(derived.map((s) => s.country)).size,
};

if (jsonArg) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`DB: ${rows.length} | derived final-50: ${derived.length} | sidecar rows: ${mdRows.length} (${summary.uniqueMarkdown} unique)`);
  console.log(`Active: ${summary.allActive} | Matchable 5/5: ${summary.allMatchable} | All in DB: ${summary.allInDb} | Countries: ${summary.countries}`);
  console.log(`Deadlines: ${summary.deadlineConfirmed} confirmed / ${summary.deadlineNull} recurring-unknown`);
  if (problems.length) {
    console.log("PROBLEMS:");
    for (const p of problems) console.log(`  ✗ ${p}`);
    process.exitCode = 1;
  } else {
    console.log("VERIFY OK — sidecar matches DB-derived final 50 exactly (set + order).");
  }
  for (const f of flags) console.log(`  ⚠ ${f.nameEn}: ${f.reasons.join(", ")}`);
}

await prisma.$disconnect();
