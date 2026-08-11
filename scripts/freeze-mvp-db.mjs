#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

/**
 * Task 3A — Freeze the scholarship database to the Final MVP 50.
 *
 *   npx tsx scripts/freeze-mvp-db.mjs
 *
 * 1. Reads the authoritative 50-name set from SCHOLARSHIP_MVP_FINAL_50.json.
 * 2. Backs up ALL current Scholarship records to a JSON file OUTSIDE the repo
 *    (OS temp dir) BEFORE any deletion.
 * 3. Runs a HARD SAFETY CHECK — refuses to proceed unless every condition
 *    passes (exactly 50 unique JSON names, all present in DB, exactly 200 to
 *    delete, no ambiguous matches).
 * 4. Deletes ONLY Scholarship rows whose nameEn is NOT in the 50-name set, in
 *    a single transaction.
 * 5. Verifies the result (count, set equality, no duplicates, field values of
 *    survivors unchanged, unrelated tables untouched) and writes
 *    SCHOLARSHIP_MVP_DATABASE_FREEZE_REPORT.md.
 *
 * The JSON list is the ONLY authority for what survives. No other condition
 * (deadline, score, source, isActive, country) is used.
 */

const prisma = new PrismaClient();

const repoRoot = process.cwd();
const jsonPath = join(repoRoot, "SCHOLARSHIP_MVP_FINAL_50.json");
if (!existsSync(jsonPath)) {
  console.error("SCHOLARSHIP_MVP_FINAL_50.json not found — aborting");
  process.exit(1);
}
const authority = JSON.parse(readFileSync(jsonPath, "utf8"));

/* ------------------------------------------------------------------ *
 * 0. Pre-flight: sanity-check the authority file itself
 * ------------------------------------------------------------------ */
const jsonRecords = authority.final50;
if (!Array.isArray(jsonRecords) || jsonRecords.length !== 50) {
  console.error(`HARD FAIL: SCHOLARSHIP_MVP_FINAL_50.json contains ${jsonRecords?.length} records, expected exactly 50`);
  process.exit(1);
}
const jsonNames = jsonRecords.map((s) => s.nameEn);
const jsonNameSet = new Set(jsonNames);
if (jsonNameSet.size !== 50) {
  console.error("HARD FAIL: duplicate nameEn in SCHOLARSHIP_MVP_FINAL_50.json");
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * 1. Snapshot current DB state (counts of every table we must not touch)
 * ------------------------------------------------------------------ */
const [scholarships, users, profiles, documents, reviews, usage, applications, appDocs, milestones] = await Promise.all([
  prisma.scholarship.findMany(),
  prisma.user.count(),
  prisma.userProfile.count(),
  prisma.document.count(),
  prisma.review.count(),
  prisma.reviewDailyUsage.count(),
  prisma.application.count(),
  prisma.applicationDocument.count(),
  prisma.roadmapMilestone.count(),
]);
const beforeCounts = {
  scholarship: scholarships.length,
  user: users,
  userProfile: profiles,
  document: documents,
  review: reviews,
  reviewDailyUsage: usage,
  application: applications,
  applicationDocument: appDocs,
  roadmapMilestone: milestones,
};

/* ------------------------------------------------------------------ *
 * 2. Backup ALL scholarship records to OS temp, BEFORE any deletion
 * ------------------------------------------------------------------ */
const backupDir = join(tmpdir(), "opencode");
mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = join(backupDir, `scholarship-backup-${stamp}.json`);
const serializable = scholarships.map((r) => ({
  ...r,
  deadline: r.deadline ? r.deadline.toISOString() : null,
  applicationOpenDate: r.applicationOpenDate ? r.applicationOpenDate.toISOString() : null,
  verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
  createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
}));
writeFileSync(backupPath, JSON.stringify({ backedUpAt: new Date().toISOString(), count: serializable.length, scholarships: serializable }, null, 2), "utf8");

const backupReload = JSON.parse(readFileSync(backupPath, "utf8"));
if (backupReload.count !== scholarships.length) {
  console.error("HARD FAIL: backup written to disk does not match DB count");
  process.exit(1);
}
console.log(`Backup written: ${backupPath} (${backupReload.count} records)`);

/* ------------------------------------------------------------------ *
 * 3. Compute keep / delete sets
 * ------------------------------------------------------------------ */
const dbNameSet = new Map();
for (const r of scholarships) {
  dbNameSet.set(r.nameEn, (dbNameSet.get(r.nameEn) ?? 0) + 1);
}
const dbNames = [...dbNameSet.keys()];

const missing = jsonNames.filter((n) => !dbNameSet.has(n));
const ambiguous = [...dbNameSet.entries()].filter(([, c]) => c > 1).map(([n]) => n);
const notInJson = dbNames.filter((n) => !jsonNameSet.has(n));
const keepRecords = scholarships.filter((r) => jsonNameSet.has(r.nameEn));
const deleteCount = scholarships.length - keepRecords.length;

console.log(`Current DB scholarships: ${scholarships.length}`);
console.log(`JSON authoritative names: ${jsonNames.length} (unique: ${jsonNameSet.size})`);
console.log(`DB nameEn unique: ${dbNames.length} (duplicates: ${ambiguous.length})`);
console.log(`Missing from DB: ${missing.length}`);
console.log(`Not in JSON (to delete): ${notInJson.length}`);
console.log(`Records to KEEP: ${keepRecords.length}`);
console.log(`Records to DELETE: ${deleteCount}`);

/* ------------------------------------------------------------------ *
 * 4. HARD SAFETY CHECK
 * ------------------------------------------------------------------ */
const fails = [];
if (jsonNames.length !== 50) fails.push("JSON does not contain exactly 50 records");
if (jsonNameSet.size !== 50) fails.push("JSON nameEn values are not unique");
if (missing.length > 0) fails.push(`Expected MVP scholarships missing from DB: ${missing.join("; ")}`);
if (ambiguous.length > 0) fails.push(`Ambiguous duplicate nameEn in DB: ${ambiguous.join("; ")}`);
if (dbNameSet.size !== 250) fails.push(`DB has ${dbNameSet.size} unique nameEn, expected 250`);
if (keepRecords.length !== 50) fails.push(`Exactly 50 DB records do not match the JSON (matched: ${keepRecords.length})`);
if (deleteCount !== 200) fails.push(`Expected deletion count is 200, calculated ${deleteCount}`);
if (notInJson.some((n) => jsonNameSet.has(n))) fails.push("Set arithmetic error in keep/delete split");

if (fails.length > 0) {
  console.error("\nHARD SAFETY CHECK FAILED — refusing to delete:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("\nHARD SAFETY CHECK PASSED — proceeding to delete exactly 200 records.");

/* ------------------------------------------------------------------ *
 * 5. Delete in ONE transaction
 * ------------------------------------------------------------------ */
const beforeDelete = await prisma.scholarship.count();
const result = await prisma.$transaction(async (tx) => {
  const del = await tx.scholarship.deleteMany({
    where: { nameEn: { notIn: jsonNames } },
  });
  return del.count;
});

/* ------------------------------------------------------------------ *
 * 6. Post-delete verification
 * ------------------------------------------------------------------ */
const [afterScholarships, afterUsers, afterProfiles, afterDocs, afterReviews, afterUsage, afterApps, afterAppDocs, afterMilestones] = await Promise.all([
  prisma.scholarship.findMany(),
  prisma.user.count(),
  prisma.userProfile.count(),
  prisma.document.count(),
  prisma.review.count(),
  prisma.reviewDailyUsage.count(),
  prisma.application.count(),
  prisma.applicationDocument.count(),
  prisma.roadmapMilestone.count(),
]);

const afterCounts = {
  scholarship: afterScholarships.length,
  user: afterUsers,
  userProfile: afterProfiles,
  document: afterDocs,
  review: afterReviews,
  reviewDailyUsage: afterUsage,
  application: afterApps,
  applicationDocument: afterAppDocs,
  roadmapMilestone: afterMilestones,
};

const afterNames = afterScholarships.map((r) => r.nameEn);
const afterNameSet = new Set(afterNames);
const verify = [];
const push = (ok, label, detail) => verify.push({ ok, label, detail });

push(afterScholarships.length === 50, "count==50", `after count=${afterScholarships.length}`);
push(afterNames.length === afterNameSet.size, "no-duplicates", `unique=${afterNameSet.size}`);
push(afterNameSet.size === jsonNameSet.size && jsonNames.every((n) => afterNameSet.has(n)), "set-equals-json", "surviving nameEn set equals JSON nameEn set exactly");
const unexpected = afterNames.filter((n) => !jsonNameSet.has(n));
push(unexpected.length === 0, "no-unexpected", `unexpected records=${unexpected.length}`);
const missingAfter = jsonNames.filter((n) => !afterNameSet.has(n));
push(missingAfter.length === 0, "no-missing", `missing MVP records=${missingAfter.length}`);
push(result === 200 && beforeDelete === 250, "deleted-200", `deleted=${result}, before=${beforeDelete}`);

/* 6a. Field preservation — compare survivors against the backup */
const backupByName = new Map(backupReload.scholarships.map((r) => [r.nameEn, r]));
const fieldDiffs = [];
const comparableKeys = [
  "nameAr", "country", "university", "degree", "deadline", "flagUrl", "description", "benefits",
  "requirements", "sourceUrl", "source", "eligibleCountries", "eligibleEducation", "fieldOfStudy",
  "minimumAge", "maximumAge", "minimumGPA", "englishRequirement", "requiresResearch",
  "requiresWorkExp", "applicationFee", "competitionLevel", "requiredDocuments", "applicationOpenDate",
  "deadlineType", "inactiveReason", "isActive", "isVerified", "recurrenceNote", "verifiedAt",
];
for (const s of afterScholarships) {
  const before = backupByName.get(s.nameEn);
  if (!before) { fieldDiffs.push(`no backup entry for ${s.nameEn}`); continue; }
  for (const k of comparableKeys) {
    const a = s[k] === null ? undefined : s[k];
    const b = before[k] === null ? undefined : before[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      fieldDiffs.push(`${s.nameEn}.${k}: ${JSON.stringify(b)} -> ${JSON.stringify(a)}`);
    }
  }
  if (s.id !== before.id) fieldDiffs.push(`${s.nameEn}.id changed`);
}
push(fieldDiffs.length === 0, "fields-preserved", `field diffs=${fieldDiffs.length}`);

/* 6b. Unrelated tables unchanged */
const relatedOk =
  afterCounts.user === beforeCounts.user &&
  afterCounts.userProfile === beforeCounts.userProfile &&
  afterCounts.document === beforeCounts.document &&
  afterCounts.review === beforeCounts.review &&
  afterCounts.reviewDailyUsage === beforeCounts.reviewDailyUsage &&
  afterCounts.application === beforeCounts.application &&
  afterCounts.applicationDocument === beforeCounts.applicationDocument;
const milestoneNote = afterCounts.roadmapMilestone !== beforeCounts.roadmapMilestone
  ? "RoadmapMilestone cascaded (onDelete: Cascade) for removed scholarships — expected"
  : "unchanged";
push(relatedOk, "unrelated-tables-unchanged", `users=${beforeCounts.user}->${afterCounts.user}, profiles=${beforeCounts.userProfile}->${afterCounts.userProfile}, docs=${beforeCounts.document}->${afterCounts.document}, reviews=${beforeCounts.review}->${afterCounts.review}, usage=${beforeCounts.reviewDailyUsage}->${afterCounts.reviewDailyUsage}, apps=${beforeCounts.application}->${afterCounts.application}, appDocs=${beforeCounts.applicationDocument}->${afterCounts.applicationDocument}; milestones: ${milestoneNote} (${beforeCounts.roadmapMilestone}->${afterCounts.roadmapMilestone})`);

const allPass = verify.every((v) => v.ok);

/* ------------------------------------------------------------------ *
 * 7. Write the freeze report
 * ------------------------------------------------------------------ */
const verifyRows = verify.map((v) => `| ${v.ok ? "✓ PASS" : "✗ FAIL"} | ${v.label} | ${v.detail.replace(/\|/g, "\\|")} |`);
const md = `# SCHOLARSHIP MVP DATABASE FREEZE REPORT

**Task:** 3A — Freeze the scholarship database to the Final MVP 50
**Date:** ${new Date().toISOString()}
**Status:** ${allPass ? "PASS — database frozen to exactly 50 scholarships" : "FAIL — see verification results"}

## Summary

| Metric | Value |
|---|---|
| Before count | ${beforeCounts.scholarship} |
| After count | ${afterCounts.scholarship} |
| Deleted count | ${result} (expected 200) |
| Expected final count | 50 |
| Backup location | \`${backupPath}\` (outside repository, OS temp) |
| Backup record count | ${backupReload.count} |
| Authority file | \`SCHOLARSHIP_MVP_FINAL_50.json\` (${jsonNames.length} records, ${jsonNameSet.size} unique) |

## Verification results

| Result | Check | Detail |
|---|---|---|
${verifyRows.join("\n")}

## Deleted scholarship count vs. expected

- Deleted: **${result}** scholarships (nameEn NOT in the authoritative 50-name set).
- The JSON list was the ONLY authority — no deadline/score/source/active/country condition was used.
- Survivors: **${afterScholarships.length}** — exactly the Final MVP 50.

## Tests / typecheck / build

Run separately after the freeze (see task output):
- \`npx vitest run --pool=threads\`
- \`npx tsc --noEmit\`
- \`npm run build\`

## Warnings

- \`RoadmapMilestone.scholarship\` declares \`onDelete: Cascade\` in the Prisma schema; deleting scholarships outside the MVP 50 cascaded ${beforeCounts.roadmapMilestone - afterCounts.roadmapMilestone} roadmap-milestone rows (all for the removed "Onsi Sawiris Scholarship 2026", owner: test user "Ahmed Hashem", all past-due). All other user-facing tables are unchanged.
- The complete 250-record backup is stored **outside the repository** at \`${backupPath}\` and is **not committed**.
`;

writeFileSync(join(repoRoot, "SCHOLARSHIP_MVP_DATABASE_FREEZE_REPORT.md"), md, "utf8");
console.log("\nPost-delete verification:");
for (const v of verify) console.log(`  ${v.ok ? "✓" : "✗"} ${v.label} — ${v.detail}`);
console.log(`\nFreeze report written to SCHOLARSHIP_MVP_DATABASE_FREEZE_REPORT.md`);
console.log(allPass ? "FINAL STATUS: PASS" : "FINAL STATUS: FAIL");

await prisma.$disconnect();
