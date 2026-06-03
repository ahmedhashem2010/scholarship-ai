-- Run this in Supabase Dashboard > SQL Editor
CREATE TABLE IF NOT EXISTS "ReferralCode" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    credits INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the "scholarships" code
INSERT INTO "ReferralCode" (code, credits, "maxUses", "usedCount")
VALUES ('scholarships', 15, 32, 5)
ON CONFLICT (code) DO UPDATE SET "usedCount" = 5;
