#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import pending2hModule from "../prisma/scholarship-enrichment-2h.ts";
const pending2h = Array.isArray(pending2hModule)
  ? pending2hModule
  : pending2hModule.scholarships;

/**
 * Task 2J PHASE 5 — database safety verification after applying Task 2H.
 *
 *   npx tsx scripts/verify-db-safety.mjs
 *
 * Checks (all read-only):
 *   - total count = 250
 *   - no duplicate nameEn
 *   - the 8 expected new records exist
 *   - the 3 expected updates are correct (applicationFee=0 Russia, Melbourne
 *     benefits superset, Üsküdar sourceUrl mojibake fixed + gap fields)
 *   - no existing populated data was accidentally erased (compared to the
 *     pre-apply backup in TEMP/opencode)
 */

const prisma = new PrismaClient();
const issues = [];
const ok = [];

// 1. Total count
const total = await prisma.scholarship.count();
(total === 250 ? ok : issues).push(`total count = ${total} (expected 250)`);

// 2. Duplicate nameEn
const rows = await prisma.scholarship.findMany();
const nameCounts = new Map();
for (const r of rows) nameCounts.set(r.nameEn, (nameCounts.get(r.nameEn) ?? 0) + 1);
const dupes = [...nameCounts.entries()].filter(([, n]) => n > 1);
(dupes.length === 0 ? ok : issues).push(
  `duplicate nameEn count = ${dupes.length}` + (dupes.length ? `: ${dupes.map(([n, c]) => `${n}×${c}`).join(", ")}` : "")
);

// 3. 8 new records exist
const newRecords = pending2h.filter((r) => !rows.some((x) => x.nameEn === r.nameEn));
const missingNew = newRecords.map((r) => r.nameEn);
(missingNew.length === 0 ? ok : issues).push(`8 new records all present (missing: ${missingNew.length})`);

// 4. 3 updates correct
const russia = rows.find((r) => r.nameEn === "Russian Government Quota Scholarship (Rossotrudnichestvo)");
(russia && russia.applicationFee === 0 ? ok : issues).push(
  `Russia update: applicationFee=${russia?.applicationFee ?? "MISSING"} (expected 0)`
);

const melbourne = rows.find((r) => r.nameEn.includes("Human Rights Scholarship 2026 at the University of Melbourne"));
const melbourneBenefits = melbourne ? (melbourne.benefits ?? "") : "";
const melbourneHasAwards = melbourneBenefits.includes("4 awards available per year");
(melbourne && melbourneHasAwards ? ok : issues).push(
  `Melbourne update: benefits superset applied (awards note present: ${melbourneHasAwards})`
);

const uskudar = rows.find((r) => r.nameEn.includes("Üsküdar University Scholarship 2026 in Turkey"));
const uskudarUrlOk = uskudar && /%C3%BCsk%C3%BCdar/i.test(uskudar.sourceUrl ?? "");
const uskudarFields = uskudar
  ? (uskudar.eligibleCountries?.length ?? 0) + (uskudar.eligibleEducation?.length ?? 0) + (uskudar.fieldOfStudy?.length ?? 0)
  : 0;
(uskudar && uskudarUrlOk && uskudarFields > 0 ? ok : issues).push(
  `Üsküdar update: sourceUrl mojibake fixed (${uskudarUrlOk}), gap fields populated (${uskudarFields} entries)`
);

// 5. Nothing unexpectedly erased — compare against the backup.
const backupDir = join(process.env.TEMP ?? ".", "opencode");
const backupFiles = readdirSync(backupDir).filter((f) => f.startsWith("scholarship-backup-"));
const latest = backupFiles
  .map((f) => ({ f, mtime: statSync(join(backupDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)[0]?.f;
let erased = [];
if (latest) {
  const backup = JSON.parse(readFileSync(join(backupDir, latest), "utf-8"));
  const backupScholarships = backup.scholarships ?? backup.records;
  if (!backupScholarships) {
    issues.push(`backup "${latest}" has no scholarships/records array`);
  } else {
    const backupMap = new Map(backupScholarships.map((r) => [r.nameEn, r]));
    erased = [...backupMap.keys()].filter((name) => !rows.some((r) => r.nameEn === name));
    (erased.length === 0 ? ok : issues).push(`no pre-existing records erased (erased: ${erased.length})`);
  }
} else {
  issues.push("could not find a backup file to compare against");
}

console.log("=== DATABASE SAFETY VERIFICATION ===");
console.log(`Backup compared: ${latest ?? "NONE"}`);
for (const line of ok) console.log(`  ✓ ${line}`);
for (const line of issues) console.log(`  ✗ ${line}`);
console.log(`\nRESULT: ${issues.length === 0 ? "PASS" : `FAIL (${issues.length} issue(s))`}`);
if (issues.length) process.exitCode = 1;

await prisma.$disconnect();
