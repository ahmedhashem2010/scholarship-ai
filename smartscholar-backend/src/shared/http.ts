import { URL } from 'node:url';

export interface HttpOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRedirects?: number;
}

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SmartScholarBot/1.0 (+https://smartscholar.org)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly url?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Fetch a URL and return { status, url, headers, text }.
 * Follows redirects up to maxRedirects and enforces a timeout.
 */
export async function fetchText(url: string, opts: HttpOptions = {}): Promise<{
  status: number;
  finalUrl: string;
  contentType: string;
  text: string;
}> {
  const headers = { ...DEFAULT_HEADERS, ...opts.headers };
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const maxRedirects = opts.maxRedirects ?? 5;

  let current = url;
  let redirects = 0;
  let response: Response | undefined;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetch(current, {
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`fetch failed for ${current}: ${cause}`);
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) break;
      redirects += 1;
      if (redirects > maxRedirects) {
        throw new Error(`too many redirects for ${url}`);
      }
      current = new URL(location, current).toString();
      continue;
    }
    break;
  }

  if (!response) throw new Error(`no response for ${url}`);
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  return { status: response.status, finalUrl: response.url || current, contentType, text };
}

/** Fetch raw bytes (for PDFs). */
export async function fetchBuffer(url: string, opts: HttpOptions = {}): Promise<{
  status: number;
  contentType: string;
  buffer: Buffer;
}> {
  const headers = { ...DEFAULT_HEADERS, ...opts.headers };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT);
  try {
    const response = await fetch(url, { headers, redirect: 'follow', signal: controller.signal });
    if (!response.ok) {
      throw new HttpError(response.status, `HTTP ${response.status} for ${url}`, url);
    }
    const contentType = response.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { status: response.status, contentType, buffer };
  } finally {
    clearTimeout(timer);
  }
}
