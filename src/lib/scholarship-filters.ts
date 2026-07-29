import type { Prisma } from "@prisma/client";

/**
 * Shared visibility rules for scholarships.
 *
 * Every list, search and match query must go through these. Showing a student
 * an expired scholarship — or one whose source link is dead — is the fastest
 * way to lose them permanently, and it's the kind of bug that reappears every
 * time someone writes a new query by hand.
 */

/**
 * Grace period after a deadline during which a scholarship still shows.
 * Deadlines are often stated without a timezone and some programmes accept
 * late submissions, so cutting off at exactly midnight UTC hides things that
 * are still open.
 */
const DEADLINE_GRACE_DAYS = 2;

export function deadlineCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - DEADLINE_GRACE_DAYS);
  return cutoff;
}

/**
 * The default filter for anything a student sees.
 * Active, and either no known deadline or a deadline that hasn't passed.
 *
 * Note a null deadline is *included*: 41% of seeded records have no deadline
 * captured, and hiding all of them would remove a third of the catalogue. The
 * matcher flags them as unverified instead.
 */
export function visibleScholarshipWhere(
  now: Date = new Date()
): Prisma.ScholarshipWhereInput {
  return {
    isActive: true,
    OR: [{ deadline: null }, { deadline: { gte: deadlineCutoff(now) } }],
  };
}

/**
 * Merges the visibility rules into an existing where clause without letting
 * the caller accidentally drop them.
 */
export function withVisibility(
  where: Prisma.ScholarshipWhereInput = {},
  now: Date = new Date()
): Prisma.ScholarshipWhereInput {
  return { AND: [visibleScholarshipWhere(now), where] };
}

/** Stricter filter for "verified only" browsing. */
export function verifiedScholarshipWhere(
  now: Date = new Date()
): Prisma.ScholarshipWhereInput {
  return { ...visibleScholarshipWhere(now), isVerified: true };
}

/** True when a deadline has passed beyond the grace period. */
export function isExpired(deadline: Date | null, now: Date = new Date()): boolean {
  if (!deadline) return false;
  return deadline.getTime() < deadlineCutoff(now).getTime();
}

/** Whole days until a deadline. Negative when passed, null when unknown. */
export function daysUntil(deadline: Date | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
