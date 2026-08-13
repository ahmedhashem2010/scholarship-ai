// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
const { sendEmail } = vi.hoisted(() => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: true }),
}));
const { consumeRateLimitBucket, clientIp } = vi.hoisted(() => ({
  consumeRateLimitBucket: vi.fn().mockResolvedValue(true),
  clientIp: vi.fn().mockReturnValue("203.0.113.7"),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient }));
vi.mock("@/lib/email", () => ({ sendEmail }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimitBucket,
  clientIp,
  SIGNUP_IP_LIMIT: 5,
  SIGNUP_EMAIL_LIMIT: 3,
}));

import { POST } from "@/app/api/auth/signup/route";

function mockGenerateLink(result: { data?: unknown; error: Error | null }) {
  createClient.mockReturnValue({
    auth: {
      admin: {
        generateLink: vi.fn().mockResolvedValue(result),
      },
    },
  });
}

function signupBody(overrides: Record<string, unknown> = {}) {
  return {
    email: "Student@Example.com",
    password: "correct-horse-battery",
    name: "Test Student",
    ...overrides,
  };
}

async function postSignup(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/auth/signup — no email-enumeration oracle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success for a fresh address and sends the confirmation email", async () => {
    mockGenerateLink({
      data: { properties: { hashed_token: "abc123" } },
      error: null,
    });

    const res = await postSignup(signupBody());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      email: "student@example.com",
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("responds identically when the address is already registered, and sends no email", async () => {
    mockGenerateLink({ data: null, error: new Error("User already registered") });

    const res = await postSignup(signupBody());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      email: "student@example.com",
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("anonymous callers cannot distinguish an existing address from a new one", async () => {
    mockGenerateLink({ data: { properties: { hashed_token: "tok" } }, error: null });
    const freshRes = await postSignup(signupBody());
    const freshBody = await freshRes.json();

    vi.clearAllMocks();
    mockGenerateLink({ data: null, error: new Error("already registered") });
    const existingRes = await postSignup(signupBody());
    const existingBody = await existingRes.json();

    expect(existingRes.status).toBe(freshRes.status);
    expect(existingBody).toEqual(freshBody);
    expect(existingBody).not.toHaveProperty("code");
    expect(JSON.stringify(existingBody)).not.toMatch(/exist|registered/i);
  });

  it("still rejects invalid/weak inputs before touching Supabase", async () => {
    mockGenerateLink({ data: null, error: new Error("should not be called") });

    const weak = await postSignup(signupBody({ password: "12345" }));
    expect(weak.status).toBe(400);

    const badEmail = await postSignup(signupBody({ email: "not-an-email" }));
    expect(badEmail.status).toBe(400);

    expect(createClient).not.toHaveBeenCalled();
  });
});
