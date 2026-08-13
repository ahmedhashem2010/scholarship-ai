/**
 * Shared helpers for the scholarship comparison flow.
 *
 * The selection UI builds a `ids` query param and the compare page + the
 * scholarships API both parse it. Keeping the encode/parse logic here means
 * the two sides can never drift apart, and IDs containing URL-special
 * characters survive the round-trip through the URL.
 */

/** Maximum number of scholarships the comparison flow supports. */
export const COMPARE_MAX_SELECTIONS = 4;

/**
 * Builds the value of the `ids` query param from a list of scholarship IDs.
 * Each ID is percent-encoded individually so the list survives the URL.
 */
export function encodeCompareIds(ids: string[]): string {
  return ids.map((id) => encodeURIComponent(id)).join(",");
}

/**
 * Parses the `ids` query param back into a list of scholarship IDs.
 *
 * Null/empty input, blank segments and segments that fail to decode are
 * dropped rather than throwing, so malformed URLs fail gracefully.
 */
export function parseCompareIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return null;
      }
    })
    .filter((id): id is string => id !== null);
}
