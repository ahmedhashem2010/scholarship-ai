/** Run an async fn with retries and exponential backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number; maxDelayMs?: number; label?: string } = {},
): Promise<T> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 8000;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      const delay = Math.min(max, base * 2 ** (attempt - 1));
      if (opts.label) {
        console.warn(`[acquire] retry ${attempt}/${retries} for ${opts.label} in ${delay}ms: ${err instanceof Error ? err.message : err}`);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
