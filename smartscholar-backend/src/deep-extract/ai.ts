/**
 * AI client for deep extraction — Groq (primary) → Gemini (fallback).
 * Mirrors the OpenAI-compatible pattern used by the app's ai-review chain so a
 * dead vendor is a config change, not a code change.
 *
 * Logging stays off by default: prompts contain fragments of official
 * scholarship pages, which is fine, but response bodies can be large.
 */

const GROQ_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL = process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface AiCallOptions {
  maxTokens?: number;
  temperature?: number;
}

/** Retry once on 429/5xx with a backoff to respect free-tier rate limits. */
async function withRateRetry(fn: () => Promise<Response>, attempts = 3): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    const response = await fn();
    if (response.status === 429 || response.status >= 500) {
      last = response;
      const wait = 20_000 * (i + 1);
      console.warn(`[deep/ai] rate-limited (${response.status}); retrying in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    return response;
  }
  return last!;
}

async function callGroq(prompt: string, opts: AiCallOptions): Promise<string | null> {
  if (!GROQ_KEY) return null;
  try {
    const response = await withRateRetry(() =>
      fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: opts.maxTokens ?? 3500,
          temperature: opts.temperature ?? 0.2,
          ...(/json/i.test(prompt) ? { response_format: { type: 'json_object' } } : {}),
          messages: [{ role: 'user', content: prompt }],
        }),
      }),
    );
    const body = await response.text().catch(() => '');
    if (!response.ok) {
      console.error(`[deep/ai] Groq FAILED ${response.status}: ${body.slice(0, 200)}`);
      return null;
    }
    const text = JSON.parse(body)?.choices?.[0]?.message?.content ?? '';
    return text.trim() || null;
  } catch (err) {
    console.error('[deep/ai] Groq error:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function callGemini(prompt: string, opts: AiCallOptions): Promise<string | null> {
  if (!GEMINI_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.2,
          maxOutputTokens: opts.maxTokens ?? 3500,
          responseMimeType: 'application/json',
        },
      }),
    });
    const body = await response.text().catch(() => '');
    if (!response.ok) {
      console.error(`[deep/ai] Gemini FAILED ${response.status}: ${body.slice(0, 200)}`);
      return null;
    }
    const data = JSON.parse(body);
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p: { text?: string }) => p?.text ?? '').join('') : '';
    return text.trim() || null;
  } catch (err) {
    console.error('[deep/ai] Gemini error:', err instanceof Error ? err.message : err);
    return null;
  }
}

export interface AiResult {
  text: string;
  provider: 'groq' | 'gemini';
}

/**
 * Call the AI chain and return the first successful provider's text.
 * Throws when no provider is available or all fail.
 */
export async function callAI(prompt: string, opts: AiCallOptions = {}): Promise<AiResult> {
  const groq = await callGroq(prompt, opts);
  if (groq) return { text: groq, provider: 'groq' };
  const gemini = await callGemini(prompt, opts);
  if (gemini) return { text: gemini, provider: 'gemini' };
  throw new Error('No AI provider available — set GROQ_API_KEY (and optionally GEMINI_API_KEY) in smartscholar-backend/.env');
}

/**
 * Parse an AI response into a JSON object, tolerating markdown fences and any
 * leading/trailing prose the model may add.
 */
export function parseJsonResponse<T>(text: string): T | null {
  if (!text) return null;
  let candidate = text.trim();
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1]!.trim();
  const open = candidate.indexOf('{');
  const close = candidate.lastIndexOf('}');
  if (open >= 0 && close > open) candidate = candidate.slice(open, close + 1);
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}
