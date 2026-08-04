/** Recursively prune undefined / empty-string / empty-array keys. */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    const arr = value
      .map((v) => compact(v))
      .filter((v) => v !== undefined && v !== null && !(typeof v === 'string' && v.length === 0));
    return (arr as unknown) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const pruned = compact(v);
      if (pruned === undefined) continue;
      if (Array.isArray(pruned) && pruned.length === 0) continue;
      if (typeof pruned === 'string' && pruned.length === 0) continue;
      out[k] = pruned;
    }
    return out as T;
  }
  if (value === undefined || value === null || (typeof value === 'string' && (value as string).trim().length === 0)) {
    return undefined as T;
  }
  return value;
}

/** Round-trip JSON to strip functions/symbols; throws on circular refs. */
export function toJsonSafe(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

export function parseJsonObject<T = Record<string, unknown>>(text: string): T | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}
