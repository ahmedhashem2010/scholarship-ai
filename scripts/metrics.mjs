import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";

/**
 * Launch metrics.
 *
 *   node scripts/metrics.mjs            # snapshot
 *   node scripts/metrics.mjs --daily    # per-day breakdown since launch
 *   node scripts/metrics.mjs --json     # machine-readable
 *
 * WHY THIS EXISTS
 *
 * "Results" is one of five scored criteria in the Lumos competition, and it's
 * the only one that needs calendar time rather than effort. You cannot generate
 * usage numbers in the final week.
 *
 * "43 signups in 11 days, 12 completed profiles, 6 saved plans, 2 paid reviews"
 * is an answer. "People liked it" is not. This script gives you the first kind,
 * on demand, without opening the database.
 *
 * Run it every few days and keep the outputs — the trend line is a better story
 * than any single number.
 */

const prisma = new PrismaClient();
const DAILY = process.argv.includes("--daily");
const JSON_OUT = process.argv.includes("--json");

const DAY = 86_400_000;

function bar(n, max, width = 28) {
  if (max <= 0) return "";
  return "█".repeat(Math.max(n > 0 ? 1 : 0, Math.round((n / max) * width)));
}

function pct(a, b) {
  if (!b) return "—";
  return `${((a / b) * 100).toFixed(0)}%`;
}

async function main() {
  const now = new Date();

  const [
    users, profiles, documents, reviews, roadmapUsers, roadmapRows,
    payments, paidPayments, scholarships, verified, applications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userProfile.count(),
    prisma.document.count(),
    prisma.review.count(),
    prisma.roadmapMilestone.findMany({ select: { userId: true }, distinct: ["userId"] })
      .then((r) => r.length).catch(() => 0),
    prisma.roadmapMilestone.count().catch(() => 0),
    prisma.payment.count().catch(() => 0),
    // Payment.status is a free-text String, not an enum. Both success paths —
    // the Stripe webhook and the manual-transfer admin approval — write
    // "approved". ("paid" appears in the webhook but that's Stripe's own
    // session.payment_status, not ours.) "paid" is kept in the filter purely
    // as a safety net in case a future path writes it.
    prisma.payment.count({ where: { status: { in: ["approved", "paid"] } } }).catch(() => 0),
    prisma.scholarship.count(),
    prisma.scholarship.count({ where: { isVerified: true } }).catch(() => 0),
    prisma.application.count().catch(() => 0),
  ]);

  const first = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" }, select: { createdAt: true },
  });
  const days = first
    ? Math.max(1, Math.ceil((now - first.createdAt) / DAY))
    : 0;

  const completedRoadmaps = await prisma.roadmapMilestone
    .count({ where: { isDone: true } }).catch(() => 0);

  const data = {
    generatedAt: now.toISOString(),
    daysLive: days,
    signups: users,
    completedProfiles: profiles,
    documentsUploaded: documents,
    aiReviews: reviews,
    studentsWithSavedPlans: roadmapUsers,
    savedMilestones: roadmapRows,
    milestonesCompleted: completedRoadmaps,
    applicationsTracked: applications,
    paymentsAttempted: payments,
    paymentsCompleted: paidPayments,
    scholarships,
    scholarshipsVerified: verified,
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(`\n  SmartScholar — metrics`);
  console.log(`  ${now.toISOString().slice(0, 16).replace("T", " ")} UTC`);
  if (days) console.log(`  ${days} day${days === 1 ? "" : "s"} since first signup`);
  console.log(`  ${"─".repeat(52)}`);

  // The funnel is the story. Each line is the previous line's survivors, so
  // the drop-off tells you what to fix next — and gives you a real sentence
  // for the competition's "Results" answer.
  const funnel = [
    ["Signed up", users],
    ["Completed a profile", profiles],
    ["Saved a scholarship plan", roadmapUsers],
    ["Uploaded a document", documents],
    ["Ran an AI review", reviews],
    ["Paid", paidPayments],
  ];
  const top = funnel[0][1] || 1;

  console.log(`\n  FUNNEL`);
  for (const [label, n] of funnel) {
    console.log(
      `    ${label.padEnd(26)} ${String(n).padStart(5)}  ${pct(n, top).padStart(4)}  ${bar(n, top)}`
    );
  }

  console.log(`\n  ENGAGEMENT`);
  console.log(`    Saved milestones           ${String(roadmapRows).padStart(5)}`);
  console.log(`    Milestones ticked off      ${String(completedRoadmaps).padStart(5)}`);
  console.log(`    Applications tracked       ${String(applications).padStart(5)}`);

  console.log(`\n  CATALOGUE`);
  console.log(`    Scholarships               ${String(scholarships).padStart(5)}`);
  console.log(`    Human-verified             ${String(verified).padStart(5)}  ${pct(verified, scholarships)}`);

  if (DAILY && users > 0) {
    const all = await prisma.user.findMany({ select: { createdAt: true },
                                             orderBy: { createdAt: "asc" } });
    const byDay = new Map();
    for (const u of all) {
      const k = u.createdAt.toISOString().slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + 1);
    }
    const max = Math.max(...byDay.values());
    console.log(`\n  SIGNUPS PER DAY`);
    let cum = 0;
    for (const [day, n] of byDay) {
      cum += n;
      console.log(`    ${day}  ${String(n).padStart(3)}  (${String(cum).padStart(4)} total)  ${bar(n, max, 24)}`);
    }
  }

  // A ready-to-paste sentence. Writing this by hand at 1am the night before a
  // deadline is how numbers get overstated by accident.
  console.log(`\n  ${"─".repeat(52)}`);
  console.log(`  FOR YOUR SUBMISSION — copy this, verify it, then use it:\n`);
  const parts = [];
  if (users) parts.push(`${users} student${users === 1 ? "" : "s"} signed up`);
  if (days) parts.push(`in ${days} day${days === 1 ? "" : "s"}`);
  const tail = [];
  if (profiles) tail.push(`${profiles} completed a full profile`);
  if (roadmapUsers) tail.push(`${roadmapUsers} saved an application plan`);
  if (reviews) tail.push(`${reviews} ran an AI document review`);
  if (paidPayments) tail.push(`${paidPayments} paid`);

  if (parts.length === 0) {
    console.log(`    No users yet. Nothing to report — this is the number that`);
    console.log(`    needs calendar time, so launch and start sharing today.\n`);
  } else {
    console.log(`    ${parts.join(" ")}${tail.length ? ". " + tail.join(", ") + "." : "."}\n`);
  }
}

main()
  .catch((e) => {
    console.error("metrics failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
