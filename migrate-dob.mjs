import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  await prisma.$connect();

  // Drop and recreate UserProfile with dateOfBirth instead of age
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "UserProfile" CASCADE`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "UserProfile" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
      "displayName" TEXT NOT NULL,
      "dateOfBirth" TIMESTAMPTZ NOT NULL,
      country TEXT NOT NULL,
      "educationLevel" TEXT NOT NULL,
      major TEXT,
      "targetDegree" TEXT NOT NULL,
      "englishLevel" TEXT NOT NULL,
      "englishScore" INTEGER,
      gpa DOUBLE PRECISION,
      "hasWorkExperience" BOOLEAN NOT NULL DEFAULT false,
      "workYears" INTEGER,
      "hasResearch" BOOLEAN NOT NULL DEFAULT false,
      budget TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserProfile_userId_idx" ON "UserProfile"("userId")`);
  console.log("UserProfile recreated with dateOfBirth");
} catch (e) {
  console.error("Error:", e.message);
}
await prisma.$disconnect();
