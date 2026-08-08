import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

/**
 * Deletes user accounts, everywhere they exist.
 *
 *   node scripts/delete-user.mjs a@b.com c@d.com          # DRY RUN — shows only
 *   node scripts/delete-user.mjs a@b.com --yes            # actually deletes
 *
 * WHY THIS IS A SCRIPT AND NOT A FEW CLICKS
 *
 * A user lives in three places: the Supabase auth project, the application
 * database, and Supabase Storage. Deleting from the dashboard removes the
 * first and orphans the other two — the student's CV and personal statement
 * stay in the bucket indefinitely, which is a data-protection problem, not
 * just untidy.
 *
 * ORDER MATTERS
 *
 * Only UserProfile and RoadmapMilestone declare onDelete: Cascade. Document,
 * Review and Application do not, so deleting the User row first
 * fails on a foreign key. Children go first, in dependency order — reviews
 * reference documents, so reviews before documents.
 *
 * DRY RUN IS THE DEFAULT. This is irreversible and there is no undo.
 */

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const CONFIRM = args.includes("--yes");
const emails = args
  .filter((a) => !a.startsWith("--"))
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const info = (m) => console.log(`    ${m}`);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "documents";

/** Finds an auth user by email. listUsers is paginated; email filter isn't exact. */
async function findAuthUser(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** Storage path from a stored file URL, or null if it isn't one of ours. */
function storagePath(url) {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

async function main() {
  if (emails.length === 0) {
    console.log(`
  Usage:
    node scripts/delete-user.mjs someone@example.com [more@example.com ...]
    node scripts/delete-user.mjs someone@example.com --yes

  Without --yes this only reports what would be deleted.
`);
    return;
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

  console.log(`\n  ${CONFIRM ? "DELETING" : "DRY RUN — nothing will be deleted"}`);
  console.log(`  ${"─".repeat(58)}`);

  let anyAdmin = false;

  for (const email of emails) {
    console.log(`\n  ${email}`);

    const authUser = await findAuthUser(email).catch((e) => {
      bad(`auth lookup failed: ${e.message}`);
      return null;
    });
    const dbUser = await prisma.user.findUnique({ where: { email } });

    if (!authUser && !dbUser) {
      warn("no account found in either place — nothing to do");
      continue;
    }

    const userId = authUser?.id ?? dbUser?.id;

    if (email === adminEmail) {
      anyAdmin = true;
      warn("THIS IS YOUR ADMIN_EMAIL — deleting it removes the only account with admin access");
    }

    // What's attached.
    const [docs, reviews, apps, milestones, profile] = await Promise.all([
      prisma.document.findMany({ where: { userId }, select: { id: true, fileUrl: true } }),
      prisma.review.count({ where: { userId } }).catch(() => 0),
      prisma.application.count({ where: { userId } }).catch(() => 0),
      prisma.roadmapMilestone.count({ where: { userId } }).catch(() => 0),
      prisma.userProfile.findUnique({ where: { userId } }).catch(() => null),
    ]);

    info(`auth user      ${authUser ? authUser.id : "—"}`);
    info(`db user        ${dbUser ? "yes" : "—"}`);
    info(`profile        ${profile ? "yes" : "—"}`);
    info(`documents      ${docs.length}`);
    info(`reviews        ${reviews}`);
    info(`applications   ${apps}`);
    info(`milestones     ${milestones}`);

    const files = docs.map((d) => storagePath(d.fileUrl)).filter(Boolean);
    info(`storage files  ${files.length}`);

    if (!CONFIRM) continue;

    // --- Storage first. An orphaned file is worse than an orphaned row:
    // rows are invisible, files sit in a bucket holding someone's CV.
    if (files.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(files);
      if (error) warn(`storage: ${error.message}`);
      else ok(`removed ${files.length} file(s) from storage`);
    }

    // --- Database, children before parents.
    if (dbUser) {
      await prisma.review.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.document.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.application.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.roadmapMilestone.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId } });
      ok("database rows deleted");
    }

    // --- Auth last. If this succeeded first and the DB delete then failed,
    // you'd be left with orphaned rows and no way to look the person up.
    if (authUser) {
      const { error } = await supabase.auth.admin.deleteUser(authUser.id);
      if (error) bad(`auth: ${error.message}`);
      else ok("auth account deleted");
    }
  }

  console.log(`\n  ${"─".repeat(58)}`);
  if (!CONFIRM) {
    console.log(`  Nothing was deleted. Re-run with --yes to go ahead.\n`);
  } else {
    console.log(`  Done.`);
    if (anyAdmin) {
      console.log(`\n  You deleted your ADMIN_EMAIL account. Sign up again with the`);
      console.log(`  same address to restore admin access — the API checks`);
      console.log(`  the email, not a stored role.`);
    }
    console.log();
  }
}

main()
  .catch((e) => {
    console.error("\n  delete-user failed:", e.message, "\n");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
