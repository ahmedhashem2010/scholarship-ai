// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createApiClient } = vi.hoisted(() => ({ createApiClient: vi.fn() }));

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user: {
      upsert: vi.fn().mockResolvedValue({ id: "user-1" }),
    },
    userProfile: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/supabase/api-auth", () => ({ createApiClient }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { NextRequest } from "next/server";
import { POST, PUT } from "@/app/api/user/profile/route";

const ENGLISH_FIELDS = [
  "hasEnglishTest",
  "englishTestType",
  "englishTestDate",
  "testTimeframe",
  "englishScore",
] as const;

function mockSession(email: string, id = "user-1") {
  createApiClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id, email } },
        error: null,
      }),
    },
  });
}

function profileBody(overrides: Record<string, unknown> = {}) {
  return {
    displayName: "Normal Student",
    dateOfBirth: "2000-01-01",
    country: "Egypt",
    educationLevel: "BACHELOR",
    targetDegree: "MASTER",
    ...overrides,
  };
}

async function postProfile(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/user/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

async function putProfile(body: Record<string, unknown>) {
  return PUT(
    new NextRequest("http://localhost/api/user/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

function lastProfileUpsert(): {
  create: Record<string, unknown>;
  update: Record<string, unknown>;
} {
  const calls = prisma.userProfile.upsert.mock
    .calls as unknown as [{ create: Record<string, unknown>; update: Record<string, unknown> }][];
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1]![0];
}

describe("profile updates preserve English-test data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps English-test fields untouched when editing an unrelated field", async () => {
    mockSession("student@example.com");

    // 1. Create a profile containing English-test information.
    await postProfile(
      profileBody({
        hasEnglishTest: "YES",
        englishTestType: "IELTS",
        englishScore: "6.5",
        englishTestDate: "2025-05-01",
        testTimeframe: "1-3M",
      })
    );

    // 2. Edit only an unrelated field such as name.
    await putProfile({ displayName: "Renamed Student" });

    // 3. Confirm every English-test field remains unchanged — the update
    //    payload must not null them out.
    const update = lastProfileUpsert().update;
    for (const field of ENGLISH_FIELDS) {
      expect(update[field], `${field} must not be touched by a partial edit`).toBeUndefined();
    }
  });

  it("stores IELTS half-point scores as decimals, not truncated integers", async () => {
    mockSession("student@example.com");
    await postProfile(
      profileBody({ hasEnglishTest: "YES", englishTestType: "IELTS", englishScore: "6.5" })
    );
    expect(lastProfileUpsert().create.englishScore).toBe(6.5);
  });

  it("still applies English-test fields that ARE sent", async () => {
    mockSession("student@example.com");
    await postProfile(profileBody());
    await putProfile({
      displayName: "X",
      hasEnglishTest: "PREFER_WITHOUT",
      englishTestType: null,
    });
    const update = lastProfileUpsert().update;
    expect(update.hasEnglishTest).toBe("PREFER_WITHOUT");
    expect(update.englishTestType).toBeNull();
  });
});
