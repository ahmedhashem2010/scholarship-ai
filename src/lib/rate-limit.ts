import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Server-side fixed-window rate limiting backed by PostgreSQL.
 *
 * WHY NOT IN-MEMORY: Vercel runs many instances and each cold start is a fresh
 * memory space, so a Map<key, timestamp> can be bypassed by hitting another
 * instance and evaporates entirely on scale-to-zero. The old resend-verification
 * cooldown was exactly that — explicitly "not security". A row in the shared
 * Postgres is the same data every instance sees, so the limit holds.
 *
 * BUCKET MODEL: each (scope, dimension, value, window) is its own row whose key
 * is the PK, and "reserve a slot" is a single atomic `upsert` with
 * `count: { increment: 1 }`. Two concurrent requests can't both slip past the
 * cap, because Postgres serializes the upsert. Old windows are swept
 * opportunistically on the first request of a fresh window.
 *
 * FAIL-OPEN: if the database is unreachable the check allows the request
 * through and logs. A rate-limiter outage must never block signups or resends
 * (availability beats strictness for an abuse-throttle; the enumeration fix in
 * the signup route already removes the information leak that made probing
 * valuable).
 */

export const WINDOW_SECONDS = 60 * 60; // 1 hour fixed window
const TTL_SECONDS = 24 * 60 * 60; // delete buckets older than 24h

export const SIGNUP_IP_LIMIT = 5; // signups per hour per IP
export const SIGNUP_EMAIL_LIMIT = 3; // signups per hour per email
export const RESEND_IP_LIMIT = 3; // resends per hour per IP
export const RESEND_EMAIL_LIMIT = 3; // resends per hour per email

/** Best-effort client IP from the headers Vercel sets. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]!.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export interface RateLimitOptions {
  scope: "signup" | "resend";
  dimension: "ip" | "email";
  /** Raw IP address or email address. Only a hash ever reaches the database. */
  value: string;
  /** Maximum allowed requests in the window. */
  limit: number;
  /** Injectable clock for tests. */
  now?: Date;
}

/**
 * Atomically reserves one slot in the current window.
 *
 * @returns true if the request is allowed (this attempt did not push the count
 * past `limit`), false when the limit is already exhausted.
 */
export async function consumeRateLimitBucket(opts: RateLimitOptions): Promise<boolean> {
  const now = opts.now ?? new Date();
  const windowMs = WINDOW_SECONDS * 1000;
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const key = `${opts.scope}:${opts.dimension}:${sha256(opts.value)}:${windowStartMs}`;

  try {
    const row = await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, windowStart: new Date(windowStartMs), count: 1 },
      update: { count: { increment: 1 } },
    });

    // First request of a fresh window: sweep expired windows so the table can't
    // grow without bound. Fire-and-forget — never block the request on cleanup.
    if (row.count === 1) {
      const cutoff = new Date(now.getTime() - TTL_SECONDS * 1000);
      prisma.rateLimitBucket
        .deleteMany({ where: { windowStart: { lt: cutoff } } })
        .catch((err) => console.error("[rate-limit] expired-bucket cleanup failed", err));
    }

    return row.count <= opts.limit;
  } catch (err) {
    console.error(
      `[rate-limit] ${opts.scope}/${opts.dimension} check failed — failing open`,
      err
    );
    return true;
  }
}
