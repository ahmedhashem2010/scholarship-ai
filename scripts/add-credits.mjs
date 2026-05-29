import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "ahmedprogrammer2010@gmail.com";
  const creditsToAdd = 10;

  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    console.log(`User with email "${email}" not found.`);
    console.log("Available users:");
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, reviewCredits: true } });
    for (const u of users) {
      console.log(`  - ${u.name ?? "?"} (${u.email ?? "?"}) id=${u.id} credits=${u.reviewCredits}`);
    }
    process.exit(1);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { reviewCredits: { increment: creditsToAdd } },
    }),
    prisma.payment.create({
      data: {
        userId: user.id,
        amount: 0,
        credits: creditsToAdd,
        status: "approved",
      },
    }),
  ]);

  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  console.log(`Added ${creditsToAdd} credits to ${user.name ?? user.email}`);
  console.log(`Credits: ${user.reviewCredits} → ${updated.reviewCredits}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
