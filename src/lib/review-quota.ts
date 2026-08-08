/**
 * Daily free AI review quota.
 *
 * SmartScholar is free for students: every account gets a limited number of AI
 * document reviews per calendar day instead of the old paid-credits model. The
 * day boundary is UTC (Vercel's runtime timezone), which keeps the quota simple
 * and unambiguous for everyone.
 */

/** How many AI document reviews a user gets per calendar day. */
export const DAILY_REVIEW_LIMIT = 2;

/**
 * Calendar-day key for a date, in UTC. Stored as a plain string (YYYY-MM-DD)
 * in ReviewDailyUsage.day and used in the unique constraint, so a day can never
 * be double-counted.
 */
export function currentDayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
