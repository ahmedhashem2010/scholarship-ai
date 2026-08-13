// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
const { sendEmail } = vi.hoisted(() => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: true }),
}));
const { consumeRateLimitBucket, clientIp } = vi.hoisted(() => ({
  consumeRateLimitBucket: vi.fn(),
  clientIp: vi.fn().mockReturnValue("203.0.113.7"),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient }));
vi.mock("@/lib/email", () => ({ sendEmail }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimitBucket,
  clientIp,
  SIGNUP_IP_LIMIT: 5,
  SIGNUP_EMAIL_LIMIT: 3,
  RESEND_IP_LIMIT: 3,
  RESEND_EMAIL_LIMIT: 3,
}));

import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as resend } from "@/app/api/auth/resend-verification/route";

function generateLinkResult() {
  return {
    data: {
      properties: { hashed_token: "tok-123" },
      user: { user_metadata: { name: "Test Student" } },
    },
    error: null,
  };
}

function mockGenerateLink(
  result: { data: unknown; error: Error | null } = generateLinkResult()
) {
  createClient.mockReturnValue({
    auth: { admin: { generateLink: vi.fn().mockResolvedValue(result) } },
  });
}

function postSignup(overrides: Record<string, unknown> = {}) {
  return signup(
    new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
      body: JSON.stringify({
        email: "student@example.com",
        password: "correct-horse-battery",
        name: "Test Student",
        ...overrides,
      }),
    })
  );
}

function postResend(overrides: Record<string, unknown> = {}) {
  return resend(
    new NextRequest("http://localhost/api/auth/resend-verification", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
      body: JSON.stringify({ email: "student@example.com", ...overrides }),
    })
  );
}

describe("POST /api/auth/signup — rate limited", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimitBucket.mockResolvedValue(true);
    mockGenerateLink();
  });

  it("enforces both the IP and the email bucket before creating an account", async () => {
    const res = await postSignup();
    expect(res.status).toBe(200);

    expect(consumeRateLimitBucket).toHaveBeenCalledTimes(2);
    expect(consumeRateLimitBucket).toHaveBeenNthCalledWith(1, {
      scope: "signup",
      dimension: "ip",
      value: "203.0.113.7",
      limit: 5,
    });
    expect(consumeRateLimitBucket).toHaveBeenNthCalledWith(2, {
      scope: "signup",
      dimension: "email",
      value: "student@example.com",
      limit: 3,
    });
  });

  it("rejects repeated signup attempts when the IP bucket is exhausted", async () => {
    consumeRateLimitBucket.mockResolvedValueOnce(false);

    const res = await postSignup();
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining("sign-up") });
    expect(createClient).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects repeated signup attempts when the email bucket is exhausted", async () => {
    consumeRateLimitBucket.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const res = await postSignup();
    expect(res.status).toBe(429);
    expect(createClient).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/resend-verification — rate limited", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimitBucket.mockResolvedValue(true);
    mockGenerateLink();
  });

  it("enforces both buckets, then resends normally when allowed", async () => {
    const res = await postResend();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true });

    expect(consumeRateLimitBucket).toHaveBeenCalledTimes(2);
    expect(consumeRateLimitBucket).toHaveBeenNthCalledWith(1, {
      scope: "resend",
      dimension: "ip",
      value: "203.0.113.7",
      limit: 3,
    });
    expect(consumeRateLimitBucket).toHaveBeenNthCalledWith(2, {
      scope: "resend",
      dimension: "email",
      value: "student@example.com",
      limit: 3,
    });
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects repeated resend attempts when the IP bucket is exhausted", async () => {
    consumeRateLimitBucket.mockResolvedValueOnce(false);

    const res = await postResend();
    expect(res.status).toBe(429);
    expect(createClient).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects repeated resend attempts when the email bucket is exhausted", async () => {
    consumeRateLimitBucket.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const res = await postResend();
    expect(res.status).toBe(429);
    expect(createClient).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("still answers a rate-limited resend without revealing whether the address exists", async () => {
    consumeRateLimitBucket.mockResolvedValue(false);

    const res = await postResend();
    const limited = await res.json();

    vi.clearAllMocks();
    consumeRateLimitBucket.mockResolvedValue(true);
    mockGenerateLink({ data: null, error: new Error("User not found") });
    const res2 = await postResend({ email: "never-registered@example.com" });
    await res2.json();

    // Both are 429s or 200s respectively — the 429 is keyed to attempts, so it
    // never distinguishes "exists" from "doesn't". Assert the limited response
    // body carries no existence signal beyond the generic message.
    expect(limited).not.toHaveProperty("code");
    expect(JSON.stringify(limited)).not.toMatch(/exist|registered|found/i);
    expect(res2.status).toBe(200);
  });
});
