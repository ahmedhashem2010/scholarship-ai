import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

try {
  // Upsert referral code at 5 uses
  const r = await p.referralCode.upsert({
    where: { code: "scholarships" },
    update: { usedCount: 5 },
    create: {
      code: "scholarships",
      credits: 15,
      maxUses: 32,
      usedCount: 5,
    },
  });
  console.log(`Referral code '${r.code}': ${r.usedCount} / ${r.maxUses} uses (${r.credits} credits each)`);
} catch (e) {
  console.error("Error:", e.message || e);
} finally {
  await p.$disconnect();
}
