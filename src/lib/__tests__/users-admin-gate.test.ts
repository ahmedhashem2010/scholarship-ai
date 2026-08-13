// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createApiClient } = vi.hoisted(() => ({ createApiClient: vi.fn() }));

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([
        { id: "u1", email: "a@example.com" },
        { id: "u2", email: "b@example.com" },
      ]),
    },
  },
}));

vi.mock("@/lib/supabase/api-auth", () => ({ createApiClient }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { GET } from "@/app/api/users/route";
import { NextRequest } from "next/server";

const ADMIN_EMAIL = "admin@smartscholar.org";

function mockSession(email: string | null) {
  createApiClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: email ? { id: "sess-user", email } : null },
        error: email ? null : new Error("no session"),
      }),
    },
  });
}

async function callGet() {
  return GET(new NextRequest("http://localhost/api/users"));
}

describe("GET /api/users — admin gate uses the authenticated session email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  });

  it("returns 403 for a normal user", async () => {
    mockSession("normal@example.com");
    const res = await callGet();
    expect(res.status).toBe(403);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("returns 403 even when the DB User.email was spoofed to the admin address", async () => {
    mockSession("normal@example.com");
    prisma.user.findUnique.mockResolvedValue({ id: "sess-user", email: ADMIN_EMAIL });

    const res = await callGet();
    expect(res.status).toBe(403);
    // The gate must never consult the DB email for authorization.
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 200 with the user list for the real admin session", async () => {
    mockSession(ADMIN_EMAIL);
    const res = await callGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession(null);
    const res = await callGet();
    expect(res.status).toBe(401);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("returns 500 when ADMIN_EMAIL is not configured", async () => {
    delete process.env.ADMIN_EMAIL;
    mockSession("admin@example.com");
    const res = await callGet();
    expect(res.status).toBe(500);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
