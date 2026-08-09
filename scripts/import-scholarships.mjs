#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import {
  planImport,
  formatPlanSummary,
} from "./lib/scholarship-data.mjs";

/**
 * Import scholarships from a data file into the database.
 *
 *   node scripts/import-scholarships.mjs ./data/new-scholarships.json       # dry run (default)
 *   node scripts/import-scholarships.mjs ./data/new-scholarships.json --apply
 *   node scripts/import-scholarships.mjs ./data/new-scholarships.json --apply --force
 *   node scripts/import-scholarships.mjs ./data/new-scholarships.json --json
 *
 * File formats (auto-detected by extension):
 *   .json   — a bare array, or { scholarships: [...] } / { records: [...] }
 *   .cjs/.js/.mjs/.ts — a module whose default/named export is an array
 *                       (run .ts files through `npx tsx`).
 *
 * Behaviour (shared with prisma/seed.ts via scripts/lib/scholarship-data.mjs):
 *   - Identity is nameEn. An incoming record matching an existing nameEn is an
 *     update; matching nothing is a new record; matching a single existing
 *     record by sourceUrl (different nameEn) is a safe rename.
 *   - Fill-empty merge: never erases a populated existing field. When both
 *     sides differ, the existing value is kept and reported as a conflict —
 *     use --force to overwrite instead.
 *   - Text fields are mojibake-repaired deterministically at ingest time.
 *
 * Nothing is written unless --apply is passed.
 */

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const FORCE = argv.includes("--force");
const JSON_OUT = argv.includes("--json");
const MATCH_BY_SOURCE_URL = !argv.includes("--no-source-url-match");

const fileArg = argv.find((a) => !a.startsWith("--"));
if (!fileArg) {
  console.error("Usage: node scripts/import-scholarships.mjs <file> [--apply] [--force] [--json]");
  process.exitCode = 1;
  await prisma.$disconnect();
  process.exit();
}

async function loadRecords(file) {
  if (file.endsWith(".json")) {
    const parsed = JSON.parse(readFileSync(file, "utf-8"));
    if (Array.isArray(parsed)) return parsed;
    if (parsed.scholarships && Array.isArray(parsed.scholarships)) return parsed.scholarships;
    if (parsed.records && Array.isArray(parsed.records)) return parsed.records;
    throw new Error(`JSON file must be an array or contain "scholarships"/"records" array`);
  }
  try {
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
    const value = mod.default ?? mod.scholarships ?? mod.records;
    if (Array.isArray(value)) return value;
    throw new Error(`Module export is not an array (file: ${file})`);
  } catch (err) {
    if (file.endsWith(".ts")) {
      throw new Error(
        `Could not load "${file}" with plain node. Run through tsx instead:\n` +
        `  npx tsx scripts/import-scholarships.mjs ${file} ${APPLY ? "--apply" : ""}`
      );
    }
    throw err;
  }
}

let plan;
try {
  const incomingRecords = await loadRecords(fileArg);
  const existingRecords = await prisma.scholarship.findMany({
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      country: true,
      university: true,
      degree: true,
      deadline: true,
      flagUrl: true,
      eligibleCountries: true,
      eligibleEducation: true,
      fieldOfStudy: true,
      minimumAge: true,
      maximumAge: true,
      minimumGPA: true,
      englishRequirement: true,
      requiresResearch: true,
      requiresWorkExp: true,
      applicationFee: true,
      competitionLevel: true,
      requiredDocuments: true,
      description: true,
      benefits: true,
      requirements: true,
      sourceUrl: true,
      source: true,
    },
  });

  plan = planImport({
    existingRecords,
    incomingRecords,
    force: FORCE,
    matchBySourceUrl: MATCH_BY_SOURCE_URL,
  });
} catch (err) {
  console.error(`Import failed: ${err.message}`);
  await prisma.$disconnect();
  process.exit(1);
}

if (JSON_OUT) {
  console.log(JSON.stringify(plan, (k, v) => (k === "raw" ? undefined : v), 2));
} else {
  console.log(formatPlanSummary(plan));

  const skipped = plan.items.filter((i) => i.status === "skipped");
  if (skipped.length) {
    console.log(`\n${skipped.length} skipped:`);
    for (const s of skipped) {
      console.log(`  #${s.index + 1} ${String(s.raw?.nameEn ?? "(no name)").slice(0, 70)}`);
      for (const e of s.errors) console.log(`      ✗ ${e}`);
      for (const w of s.warnings) console.log(`      ⚠ ${w}`);
    }
  }

  const renamed = plan.items.filter((i) => i.isRename);
  if (renamed.length) {
    console.log(`\n${renamed.length} rename(s) via sourceUrl match:`);
    for (const r of renamed) {
      console.log(`  "${r.existing.nameEn}"`);
      console.log(`        → "${r.incoming.nameEn}"`);
    }
  }

  const conflicted = plan.items.filter((i) => i.kept.length > 0);
  if (conflicted.length && !FORCE) {
    console.log(`\nConflicts kept (existing value preserved):`);
    for (const c of conflicted) {
      const n = String(c.incoming?.nameEn ?? "").slice(0, 60);
      console.log(`  ${n}`);
      for (const k of c.kept) {
        console.log(`      ${k.field}: kept "${String(k.existing).slice(0, 50)}" ≠ "${String(k.incoming).slice(0, 50)}"`);
      }
    }
  }

  if (!APPLY) {
    console.log("\nDry run only — nothing was written. Re-run with --apply to commit.");
  } else {
    const { new: created, update: updated } = plan.summary;
    console.log(`\nApplying: ${created} create(s), ${updated} update(s)`);
  }
}

if (APPLY) {
  let n = 0;
  for (const item of plan.items) {
    if (item.status === "new") {
      await prisma.scholarship.create({
        data: item.createPayload,
      });
      n += 1;
    } else if (item.status === "update") {
      await prisma.scholarship.update({
        where: { id: item.existing.id },
        data: item.updatePayload,
      });
      n += 1;
    }
  }
  const total = await prisma.scholarship.count();
  console.log(`✓ Applied ${n} change(s). Database now has ${total} scholarships.`);
}

await prisma.$disconnect();
