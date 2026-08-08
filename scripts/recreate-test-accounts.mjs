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
  { email: "student1@scholar.test", password: "test1234", name: "Student One" },
  { email: "student2@scholar.test", password: "test1234", name: "Student Two" },
  { email: "student3@scholar.test", password: "test1234", name: "Student Three" },
  { email: "student4@scholar.test", password: "test1234", name: "Student Four" },
  { email: "student5@scholar.test", password: "test1234", name: "Student Five" },
];

async function getExistingAuthUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers: HEADERS });
  const data = await res.json();
  return data.users || [];
}

async function deleteAuthUser(id) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: HEADERS,
  });
  return res.ok;
}

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
    console.error(`  ✗ Auth error creating ${acct.email}:`, data.msg || data.message || data.error_code);
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
      update: { name: acct.name, email: acct.email },
      create: {
        id: authId,
        email: acct.email,
        name: acct.name,
      },
    });
    console.log(`  ✓ Prisma user upserted: ${user.email}`);
  } catch (e) {
    console.error(`  ✗ Prisma error:`, e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("Checking existing Auth users...");
  const existing = await getExistingAuthUsers();
  const testEmails = new Set(TEST_ACCOUNTS.map((a) => a.email));

  for (const user of existing) {
    if (testEmails.has(user.email)) {
      console.log(`  Deleting existing: ${user.email} (${user.id})`);
      await deleteAuthUser(user.id);
    }
  }

  const prisma = new PrismaClient();
  try {
    const testUserIds = await prisma.user.findMany({ where: { email: { in: [...testEmails] } }, select: { id: true } }).then(rows => rows.map(r => r.id));
    if (testUserIds.length > 0) {
      await prisma.review.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.applicationDocument.deleteMany({ where: { application: { userId: { in: testUserIds } } } });
      await prisma.application.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.document.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.userProfile.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }
    console.log("  ✓ Deleted Prisma records for test users");
  } catch (e) {
    console.error("  ✗ Prisma delete error:", e.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nCreating 5 fresh test accounts...\n");

  for (const acct of TEST_ACCOUNTS) {
    console.log(`--- ${acct.email} ---`);
    const authId = await createSupabaseUser(acct);
    if (authId) {
      await createPrismaUser(authId, acct);
    }
  }

  console.log("\nDone! Test accounts:");
  TEST_ACCOUNTS.forEach((a) => console.log(`  ${a.email} / ${a.password}`));
}

main().catch(console.error);
