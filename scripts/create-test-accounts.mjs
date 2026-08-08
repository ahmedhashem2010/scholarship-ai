import "./_env.mjs";
import { PrismaClient } from "@prisma/client";


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

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
      update: {},
      create: {
        id: authId,
        email: acct.email,
        name: acct.name,
      },
    });
    console.log(`  ✓ Prisma user upserted: ${user.id} (${user.email})`);
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
