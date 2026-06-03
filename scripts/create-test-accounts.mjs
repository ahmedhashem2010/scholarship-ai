import { PrismaClient } from "@prisma/client";

const SUPABASE_URL = "https://kkqhvlizcbxikypsaxff.supabase.co";
const ANON_KEY = "sb_publishable__89o5d0QJ9vjfE8aXW-cJQ_y20wiKIn";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcWh2bGl6Y2J4aWt5cHNheGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM3NjU0NiwiZXhwIjoyMDkzOTUyNTQ2fQ.zU1ZUkhegXYPRXwV7Fb35jhh90WAr0qpqTYMtum0qfI";

const HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const TEST_ACCOUNTS = [
  { email: "testuser1@nothing.com", password: "test1234", name: "Test User 1" },
  { email: "testuser2@nothing.com", password: "test1234", name: "Test User 2" },
  { email: "testuser3@nothing.com", password: "test1234", name: "Test User 3" },
  { email: "testuser4@nothing.com", password: "test1234", name: "Test User 4" },
  { email: "testuser5@nothing.com", password: "test1234", name: "Test User 5" },
];

async function createSupabaseUser(acct) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      email: acct.email,
      password: acct.password,
      email_confirm: true,
      user_metadata: { full_name: acct.name },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const isDuplicate = data.msg?.includes("already exists") || data.message?.includes("already exists") || data.error_code === "email_exists";
    if (isDuplicate) {
      console.log(`  ↳ Already exists in Auth, fetching ID...`);
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter%5Bemail%5D=${encodeURIComponent(acct.email)}`, { headers: HEADERS });
      const listData = await listRes.json();
      const existing = listData.users?.[0];
      return existing?.id;
    }
    console.error(`  ✗ Auth error:`, data);
    return null;
  }
  console.log(`  ✓ Auth user created: ${data.id}`);
  return data.id;
}

async function createPrismaUser(authId, acct) {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { id: authId },
      update: { reviewCredits: 20 },
      create: {
        id: authId,
        email: acct.email,
        name: acct.name,
        reviewCredits: 20,
      },
    });
    console.log(`  ✓ Prisma user upserted: ${user.id} (${user.reviewCredits} credits)`);
  } catch (e) {
    console.error(`  ✗ Prisma error:`, e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("Creating 5 test accounts...\n");

  for (const acct of TEST_ACCOUNTS) {
    console.log(`\n--- ${acct.email} ---`);
    const authId = await createSupabaseUser(acct);
    if (authId) {
      await createPrismaUser(authId, acct);
    }
  }

  console.log("\nDone! Test accounts:");
  TEST_ACCOUNTS.forEach((a) => console.log(`  ${a.email} / ${a.password}`));
}

main().catch(console.error);
