// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

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

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { POST } from "@/app/api/user/profile/route";

const ADMIN_EMAIL = "admin@smartscholar.org";

function mockSession(email: string, id = "user-1") {
  createClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id, email } },
        error: null,
      }),
    },
  });
}

function mockNoSession() {
  createClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error("no session"),
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
    new Request("http://localhost/api/user/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

type UserUpsertPayload = { create: Record<string, unknown>; update: Record<string, unknown> };

function lastUserUpsert(): UserUpsertPayload {
  const calls = prisma.user.upsert.mock.calls as unknown as [UserUpsertPayload][];
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1]![0];
}

describe("POST /api/user/profile — email is authoritative from the session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores a client-supplied admin email on profile creation", async () => {
    mockSession("real.student@example.com");
    const res = await postProfile({ ...profileBody(), email: ADMIN_EMAIL });
    expect(res.status).toBe(200);

    const payload = lastUserUpsert();
    expect(payload.create.email).toBe("real.student@example.com");
    expect(payload.create.email).not.toBe(ADMIN_EMAIL);
  });

  it("stores the authenticated session email, never a spoofed body email", async () => {
    mockSession("real.student@example.com");
    await postProfile({ ...profileBody(), email: "attacker@evil.example" });

    const payload = lastUserUpsert();
    expect(payload.create.email).toBe("real.student@example.com");
    expect(payload.create.email).not.toBe("attacker@evil.example");
  });

  it("self-heals an existing User email toward the session value on update", async () => {
    mockSession("real.student@example.com");
    await postProfile(profileBody());

    const payload = lastUserUpsert();
    expect(payload.update?.email).toBe("real.student@example.com");
  });

  it("preserves legitimate profile data through the upsert", async () => {
    mockSession("real.student@example.com");
    const res = await postProfile(profileBody({ major: "Engineering", gpa: "3.5" }));
    expect(res.status).toBe(200);

    const calls = prisma.userProfile.upsert.mock.calls as unknown as [{ create: Record<string, unknown> }][];
    expect(calls.length).toBe(1);
    const create = calls[0]![0].create;
    expect(create.displayName).toBe("Normal Student");
    expect(create.country).toBe("Egypt");
    expect(create.major).toBe("Engineering");
    expect(create.gpa).toBe(3.5);
    expect(create.educationLevel).toBe("BACHELOR");
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoSession();
    const res = await postProfile(profileBody());
    expect(res.status).toBe(401);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});
