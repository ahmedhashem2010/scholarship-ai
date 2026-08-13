// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    rateLimitBucket: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));

import { consumeRateLimitBucket, WINDOW_SECONDS } from "@/lib/rate-limit";

const WINDOW_MS = WINDOW_SECONDS * 1000;

describe("consumeRateLimitBucket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows a request when the count stays within the limit", async () => {
    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });
    const allowed = await consumeRateLimitBucket({
      scope: "signup",
      dimension: "ip",
      value: "203.0.113.7",
      limit: 3,
      now: new Date("2026-08-13T10:15:30.000Z"),
    });
    expect(allowed).toBe(true);
  });

  it("allows exactly `limit` requests and blocks the next one", async () => {
    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 3 });
    await expect(
      consumeRateLimitBucket({
        scope: "signup",
        dimension: "ip",
        value: "203.0.113.7",
        limit: 3,
        now: new Date("2026-08-13T10:15:30.000Z"),
      })
    ).resolves.toBe(true);

    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 4 });
    await expect(
      consumeRateLimitBucket({
        scope: "signup",
        dimension: "ip",
        value: "203.0.113.7",
        limit: 3,
        now: new Date("2026-08-13T10:16:30.000Z"),
      })
    ).resolves.toBe(false);
  });

  it("embeds the fixed window in the key and mirrors it as windowStart", async () => {
    const now = new Date("2026-08-13T10:15:30.000Z");
    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });

    await consumeRateLimitBucket({
      scope: "signup",
      dimension: "ip",
      value: "203.0.113.7",
      limit: 3,
      now,
    });

    const expectedWindowMs = Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS;
    const call = prisma.rateLimitBucket.upsert.mock.calls[0]![0];
    expect(call.where.key).toBe(call.create.key);
    expect(call.create.key).toMatch(/^signup:ip:[0-9a-f]{64}:\d+$/);
    expect(call.create.windowStart).toEqual(new Date(expectedWindowMs));
    expect(call.update).toEqual({ count: { increment: 1 } });
  });

  it("rolls into a fresh bucket when the clock crosses a window boundary", async () => {
    const t1 = new Date("2026-08-13T09:59:59.000Z");
    const t2 = new Date("2026-08-13T10:00:01.000Z");
    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });

    await consumeRateLimitBucket({ scope: "signup", dimension: "ip", value: "1.1.1.1", limit: 3, now: t1 });
    await consumeRateLimitBucket({ scope: "signup", dimension: "ip", value: "1.1.1.1", limit: 3, now: t2 });

    const keys = prisma.rateLimitBucket.upsert.mock.calls.map((c) => c[0].where.key);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("hashes emails so raw addresses never reach the database", async () => {
    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });
    await consumeRateLimitBucket({
      scope: "signup",
      dimension: "email",
      value: "student@example.com",
      limit: 3,
      now: new Date("2026-08-13T10:00:00.000Z"),
    });

    const key = prisma.rateLimitBucket.upsert.mock.calls[0]![0].where.key;
    expect(key).not.toContain("student@example.com");
    expect(key).toMatch(/^signup:email:[0-9a-f]{64}:\d+$/);
  });

  it("sweeps expired windows only on the first request of a fresh window", async () => {
    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });
    const now = new Date("2026-08-13T10:00:00.000Z");
    await consumeRateLimitBucket({ scope: "signup", dimension: "ip", value: "1.1.1.1", limit: 3, now });
    expect(prisma.rateLimitBucket.deleteMany).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 4 });
    await consumeRateLimitBucket({ scope: "signup", dimension: "ip", value: "1.1.1.1", limit: 3, now });
    expect(prisma.rateLimitBucket.deleteMany).not.toHaveBeenCalled();
  });

  it("fails open when the database is unreachable", async () => {
    prisma.rateLimitBucket.upsert.mockRejectedValue(new Error("connection refused"));
    const allowed = await consumeRateLimitBucket({
      scope: "signup",
      dimension: "ip",
      value: "203.0.113.7",
      limit: 3,
      now: new Date("2026-08-13T10:00:00.000Z"),
    });
    expect(allowed).toBe(true);
  });
});
