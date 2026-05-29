import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.fpgnuksswpivdltcldbi:MVySMNniJybCjFC7@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify",
    },
  },
});

try {
  await prisma.$connect();
  console.log("Connected!");
  const result = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("Query:", JSON.stringify(result));
  await prisma.$disconnect();
} catch (e) {
  console.error("Error:", e.message);
  console.error("Stack:", e.stack?.substring(0, 500));
}
