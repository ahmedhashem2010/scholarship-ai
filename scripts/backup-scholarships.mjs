#!/usr/bin/env node
import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Task 2J PHASE 2 — full backup of the Scholarship table (and related tables
 * that reference it, for integrity) before applying the Task 2H import.
 *
 *   npx tsx scripts/backup-scholarships.mjs [out.json]
 *
 * Default output: <TEMP>/opencode/scholarship-backup-<timestamp>.json
 * (outside the repository, per the task requirement).
 */

const prisma = new PrismaClient();
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const defaultPath = join(
  process.env.TEMP ?? ".",
  "opencode",
  `scholarship-backup-${ts}.json`
);
const outPath = process.argv[2] ?? defaultPath;

const scholarships = await prisma.scholarship.findMany({ orderBy: { nameEn: "asc" } });
const applications = await prisma.application.findMany({ orderBy: { createdAt: "asc" } });
const applicationDocuments = await prisma.applicationDocument.findMany({ orderBy: { createdAt: "asc" } });
const reviews = await prisma.review.findMany({ orderBy: { createdAt: "asc" } });
const documents = await prisma.document.findMany({ orderBy: { uploadedAt: "asc" } });
const roadmapMilestones = await prisma.roadmapMilestone.findMany({ orderBy: { dueDate: "asc" } });

const backup = {
  exportedAt: new Date().toISOString(),
  schemaVersion: "scholarship-project 2J backup",
  counts: {
    scholarship: scholarships.length,
    application: applications.length,
    applicationDocument: applicationDocuments.length,
    review: reviews.length,
    document: documents.length,
    roadmapMilestone: roadmapMilestones.length,
  },
  scholarships,
  applications,
  applicationDocuments,
  reviews,
  documents,
  roadmapMilestones,
};

mkdirSync(join(process.env.TEMP ?? ".", "opencode"), { recursive: true });
writeFileSync(outPath, JSON.stringify(backup, (k, v) => (v instanceof Date ? v.toISOString() : v), 2));
console.log(`Backup written to ${outPath}`);
console.log(`  scholarships: ${scholarships.length}`);

await prisma.$disconnect();
