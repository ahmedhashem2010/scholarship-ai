import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";

/**
 * Manage referral codes.
 *
 *   node scripts/referral.mjs                          list every code
 *   node scripts/referral.mjs disable scholarships     kill a code dead
 *   node scripts/referral.mjs set scholarships 3 20    code, credits, max uses
 *   node scripts/referral.mjs delete scholarships      remove it entirely
 *
 * WHY THIS EXISTS
 *
 * The `ReferralCode` model has no `isActive` flag, so there is no obvious way
 * to switch a code off without opening a database GUI. "Disable" here means
 * setting maxUses down to whatever has already been redeemed — the code stops
 * working immediately, and you keep the history of who used it, which you'd
 * lose by deleting the row.
 *
 * Worth knowing what a code is actually worth before you create one: credits
 * multiply by uses. A code granting 15 credits with 32 uses is 480 free AI
 * reviews. At the listed price that is a serious amount of product to leave
 * behind a guessable English word.
 */

const prisma = new PrismaClient();
const [cmd, code, creditsArg, maxUsesArg] = process.argv.slice(2);

const money = (credits) => `${credits} credit${credits === 1 ? "" : "s"}`;

async function list() {
  const codes = await prisma.referralCode.findMany({ orderBy: { createdAt: "asc" } });

  if (codes.length === 0) {
    console.log("\n  No referral codes exist.\n");
    return;
  }

  console.log(`\n  Referral codes\n  ${"─".repeat(62)}`);
  console.log(
    `  ${"CODE".padEnd(20)} ${"CREDITS".padStart(8)} ${"USED".padStart(6)} ${"MAX".padStart(6)}  STATUS`
  );

  for (const c of codes) {
    const remaining = c.maxUses - c.usedCount;
    const status = remaining <= 0 ? "exhausted" : `${remaining} left`;
    console.log(
      `  ${c.code.padEnd(20)} ${String(c.credits).padStart(8)} ${String(c.usedCount).padStart(6)} ${String(c.maxUses).padStart(6)}  ${status}`
    );
  }

  // The exposure figure is the point of this script. A code is a liability
  // equal to everything it can still hand out.
  const exposure = codes.reduce(
    (sum, c) => sum + c.credits * Math.max(0, c.maxUses - c.usedCount),
    0
  );
  console.log(`  ${"─".repeat(62)}`);
  console.log(`  Still redeemable: ${money(exposure)} across all active codes.\n`);
}

async function main() {
  if (!cmd || cmd === "list") return list();

  if (!code) {
    console.error(`\n  Which code? e.g.  node scripts/referral.mjs ${cmd} scholarships\n`);
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.referralCode.findUnique({ where: { code } });
  if (!existing) {
    console.error(`\n  No code called "${code}". Run without arguments to list them.\n`);
    process.exitCode = 1;
    return;
  }

  if (cmd === "disable") {
    await prisma.referralCode.update({
      where: { code },
      // Not zero: maxUses below usedCount would misreport history.
      data: { maxUses: existing.usedCount },
    });
    console.log(`\n  ✓ "${code}" disabled. ${existing.usedCount} past use(s) kept on record.\n`);
    return list();
  }

  if (cmd === "delete") {
    await prisma.referralCode.delete({ where: { code } });
    console.log(`\n  ✓ "${code}" deleted.\n`);
    return list();
  }

  if (cmd === "set") {
    const credits = Number(creditsArg);
    const maxUses = Number(maxUsesArg);
    if (!Number.isInteger(credits) || !Number.isInteger(maxUses) || credits < 0 || maxUses < 0) {
      console.error(`\n  Usage: node scripts/referral.mjs set ${code} <credits> <maxUses>\n`);
      process.exitCode = 1;
      return;
    }
    if (maxUses < existing.usedCount) {
      console.error(
        `\n  maxUses (${maxUses}) is below the ${existing.usedCount} already redeemed.` +
          `\n  Use "disable" instead if you want to stop it now.\n`
      );
      process.exitCode = 1;
      return;
    }
    await prisma.referralCode.update({ where: { code }, data: { credits, maxUses } });
    console.log(`\n  ✓ "${code}" is now ${money(credits)} × ${maxUses} uses.\n`);
    return list();
  }

  console.error(`\n  Unknown command "${cmd}". Use: list | disable | set | delete\n`);
  process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("referral failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
