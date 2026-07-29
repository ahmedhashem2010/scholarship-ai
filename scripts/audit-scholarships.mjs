import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

/**
 * Scholarship data quality audit.
 *
 *   node scripts/audit-scholarships.mjs           # report only
 *   node scripts/audit-scholarships.mjs --fix     # also deactivate expired records
 *
 * Writes scholarship-verification-worklist.csv — open it in Excel, work down
 * the list, and mark records verified. This is the highest-leverage manual
 * task of the week: the matching engine is only as good as this data.
 */

const prisma = new PrismaClient();
const APPLY_FIXES = process.argv.includes("--fix");

const GRACE_DAYS = 2;
const now = new Date();
const cutoff = new Date(now);
cutoff.setDate(cutoff.getDate() - GRACE_DAYS);

function pct(n, total) {
  return total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`;
}

function bar(n, total, width = 28) {
  const filled = total === 0 ? 0 : Math.round((n / total) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

async function main() {
  const all = await prisma.scholarship.findMany();
  const total = all.length;

  if (total === 0) {
    console.log("No scholarships in the database. Run `npm run db:seed` first.");
    return;
  }

  console.log(`\n${"=".repeat(64)}`);
  console.log(`  SCHOLARSHIP DATA AUDIT — ${total} records`);
  console.log(`  ${now.toISOString().slice(0, 10)}`);
  console.log("=".repeat(64));

  const checks = {
    "No deadline": (s) => s.deadline === null,
    "Deadline passed": (s) => s.deadline !== null && s.deadline < cutoff,
    "No eligible countries": (s) => s.eligibleCountries.length === 0,
    "No eligible education": (s) => s.eligibleEducation.length === 0,
    "No field of study": (s) => s.fieldOfStudy.length === 0,
    "No required documents": (s) => s.requiredDocuments.length === 0,
    "No benefits text": (s) => !s.benefits,
    "No requirements text": (s) => !s.requirements,
    "No source URL": (s) => !s.sourceUrl,
    "Placeholder Arabic name": (s) => /^منحة\s+[A-Za-z]/.test(s.nameAr ?? ""),
    "Never human-verified": (s) => !s.isVerified,
  };

  console.log("\n  ISSUE                        COUNT              SHARE");
  console.log("  " + "-".repeat(60));
  for (const [label, fn] of Object.entries(checks)) {
    const n = all.filter(fn).length;
    if (n === 0) continue;
    console.log(
      `  ${label.padEnd(26)} ${String(n).padStart(4)}  ${bar(n, total)} ${pct(n, total).padStart(4)}`
    );
  }

  // Completeness score per record
  const completeness = (s) => {
    const c = [
      s.deadline !== null,
      s.eligibleCountries.length > 0,
      s.eligibleEducation.length > 0,
      s.fieldOfStudy.length > 0,
      s.requiredDocuments.length > 0,
      Boolean(s.benefits),
      Boolean(s.requirements),
    ];
    return Math.round((c.filter(Boolean).length / c.length) * 100);
  };

  const buckets = { "0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0 };
  for (const s of all) {
    const c = completeness(s);
    if (c <= 25) buckets["0-25%"]++;
    else if (c <= 50) buckets["26-50%"]++;
    else if (c <= 75) buckets["51-75%"]++;
    else buckets["76-100%"]++;
  }

  console.log("\n  DATA COMPLETENESS DISTRIBUTION");
  console.log("  " + "-".repeat(60));
  for (const [range, n] of Object.entries(buckets)) {
    console.log(`  ${range.padEnd(26)} ${String(n).padStart(4)}  ${bar(n, total)} ${pct(n, total).padStart(4)}`);
  }

  // By source
  const bySource = {};
  for (const s of all) {
    const key = s.source ?? "UNKNOWN";
    bySource[key] ??= { n: 0, complete: 0 };
    bySource[key].n++;
    bySource[key].complete += completeness(s);
  }
  console.log("\n  BY SOURCE");
  console.log("  " + "-".repeat(60));
  for (const [src, v] of Object.entries(bySource)) {
    console.log(`  ${src.padEnd(26)} ${String(v.n).padStart(4)}  avg completeness ${Math.round(v.complete / v.n)}%`);
  }

  const expired = all.filter((s) => s.deadline !== null && s.deadline < cutoff && s.isActive);
  const visible = all.filter(
    (s) => s.isActive && (s.deadline === null || s.deadline >= cutoff)
  );

  console.log("\n  " + "=".repeat(60));
  console.log(`  Currently visible to students:  ${visible.length}`);
  console.log(`  Expired but still active:       ${expired.length}`);
  console.log(`  Human-verified:                 ${all.filter((s) => s.isVerified).length}`);
  console.log("  " + "=".repeat(60));

  // ---- Worklist CSV -------------------------------------------------------
  const needsWork = all
    .filter((s) => !s.isVerified)
    .map((s) => ({ s, c: completeness(s) }))
    // Worst data first, but deadline-bearing records above deadline-less ones
    // (a real deadline means the scholarship is probably real and worth fixing)
    .sort((a, b) => a.c - b.c || (a.s.deadline ? -1 : 1))
    .map(({ s, c }) => ({
      id: s.id,
      name: s.nameEn,
      country: s.country,
      completeness: c,
      deadline: s.deadline ? s.deadline.toISOString().slice(0, 10) : "MISSING",
      missing: [
        s.deadline === null && "deadline",
        s.eligibleCountries.length === 0 && "countries",
        s.eligibleEducation.length === 0 && "education",
        s.fieldOfStudy.length === 0 && "fields",
        s.requiredDocuments.length === 0 && "documents",
        !s.benefits && "benefits",
      ]
        .filter(Boolean)
        .join(" "),
      sourceUrl: s.sourceUrl ?? "",
    }));

  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    "id,name,country,completeness,deadline,missing_fields,source_url,VERIFIED_YN,NOTES",
    ...needsWork.map((r) =>
      [r.id, r.name, r.country, r.completeness, r.deadline, r.missing, r.sourceUrl, "", ""]
        .map(esc)
        .join(",")
    ),
  ].join("\n");

  writeFileSync("scholarship-verification-worklist.csv", "﻿" + csv, "utf8");
  console.log(`\n  → Wrote scholarship-verification-worklist.csv (${needsWork.length} rows)`);
  console.log("    Open in Excel. Work top-down — worst data first.");
  console.log("    Put Y in VERIFIED_YN once you've checked the source URL.\n");

  // ---- Optional fixes -----------------------------------------------------
  if (APPLY_FIXES) {
    if (expired.length > 0) {
      const res = await prisma.scholarship.updateMany({
        where: { id: { in: expired.map((s) => s.id) } },
        data: { isActive: false, inactiveReason: "EXPIRED" },
      });
      console.log(`  ✓ Deactivated ${res.count} expired scholarships.\n`);
    } else {
      console.log("  Nothing to deactivate.\n");
    }
  } else if (expired.length > 0) {
    console.log(`  Run with --fix to deactivate the ${expired.length} expired records.\n`);
  }
}

main()
  .catch((e) => {
    console.error("Audit failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
