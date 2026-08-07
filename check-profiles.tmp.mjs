import "./scripts/_env.mjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  include: { profile: true },
  orderBy: { createdAt: "desc" },
  take: 20,
});

console.log("=== Users & profiles ===");
for (const u of users) {
  console.log({
    id: u.id.slice(0, 8),
    email: u.email,
    name: u.name,
    profileExists: !!u.profile,
    displayName: u.profile?.displayName ?? null,
    dateOfBirth: u.profile?.dateOfBirth?.toISOString().split("T")[0] ?? null,
    country: u.profile?.country ?? null,
  });
}

const emptyDisplay = await prisma.userProfile.findMany({
  where: { displayName: "" },
  select: { userId: true, displayName: true },
});
console.log("\nProfiles with empty displayName:", emptyDisplay.length, emptyDisplay);

await prisma.$disconnect();
