/**
 * AI review client.
 *
 * SmartScholar no longer calls AgentRouter directly. Every review is delegated
 * server-side to the isolated review service on Railway (AI_REVIEW_SERVICE_URL),
 * the only component that holds the AgentRouter API key and talks to the
 * gateway. AgentRouter remains the ONLY AI provider:
 *
 *   POST {AI_REVIEW_SERVICE_URL}/review
 *   body: { documentType, text }
 *   200  -> the existing ReviewScore JSON
 *   error-> { error: <code>, message: <client-safe> } with a mapped HTTP status
 *           (400 invalid request, 401/403 config/auth, 413 payload too large,
 *            429 rate limit, 502 malformed upstream, 503 unavailable /
 *            timeout / WAF block)
 *
 * The AgentRouter API key is NOT part of this codebase or of SmartScholar's
 * environment — it lives only in Railway.
 */

/** Base URL of the isolated AI review service (e.g. https://my-service.up.railway.app). */
export function getReviewServiceUrl(): string {
  return process.env.AI_REVIEW_SERVICE_URL || "";
}

/** Metadata only — records which model the review service used. Never sent anywhere. */
export const AGENTROUTER_MODEL =
  process.env.AGENTROUTER_MODEL || "claude-opus-4-8";

/** AI review service not configured (AI_REVIEW_SERVICE_URL missing / auth issue). */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

/** Review service reachable but busy / rate-limited. */
export class AiCapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiCapacityError";
  }
}

/**
 * Stable internal classification for "the review service's upstream gateway
 * answered with an Aliyun/Alibaba WAF challenge". Carried on the error so
 * internal code can branch on it. Never sent to the client.
 */
export const AGENTROUTER_WAF_BLOCK = "AGENTROUTER_WAF_BLOCK";

/** The review service's upstream (AgentRouter) is blocked by the Aliyun WAF. */
export class AiWafBlockError extends Error {
  readonly code = AGENTROUTER_WAF_BLOCK;
  constructor(message: string) {
    super(message);
    this.name = "AiWafBlockError";
  }
}

/**
 * Verdict on whether a document appears to need a signature and whether the
 * text shows evidence of one. Produced by the review service and normalized
 * there; SmartScholar treats it as optional because deployed versions that
 * predate the field omit it (absence means "no verdict", never a failure).
 */
export interface SignatureCheck {
  /** Whether this document appears to be the kind that needs a signature at all. */
  required: boolean;
  /** SIGNED/NOT_SIGNED only meaningful when `required` is true. */
  status: "SIGNED" | "NOT_SIGNED" | "UNCERTAIN" | "NOT_APPLICABLE";
  note: string;
}

const SIGNATURE_STATUSES = new Set<SignatureCheck["status"]>([
  "SIGNED",
  "NOT_SIGNED",
  "UNCERTAIN",
  "NOT_APPLICABLE",
]);

/**
 * Defensive parse of the review service's `signatureCheck` field. Returns the
 * object only when well-formed; null when the service omitted the field or
 * sent something malformed — the review still succeeds, there's just no
 * signature verdict to persist or show.
 */
export function normalizeSignatureCheck(value: unknown): SignatureCheck | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { required?: unknown; status?: unknown; note?: unknown };
  if (typeof v.status !== "string" || !SIGNATURE_STATUSES.has(v.status as SignatureCheck["status"])) {
    return null;
  }
  return {
    required: typeof v.required === "boolean" ? v.required : v.status !== "NOT_APPLICABLE",
    status: v.status as SignatureCheck["status"],
    note: typeof v.note === "string" ? v.note : "",
  };
}

export interface ReviewScore {
  overallQuality: {
    score: number;
    strengthsSummary: string;
    weaknessesSummary: string;
  };
  atsCompatibility: {
    score: number;
    missingKeywords: string[];
    improvements: string[];
  };
  competitiveness: {
    score: number;
    uniqueStrengths: string;
    differentiation: string;
  };
  topImprovements: string[];
  quickWins: string[];
  overallAssessment: string;
  signatureCheck?: SignatureCheck;
}

export function calculateAverageScore(review: ReviewScore): number {
  const avg = Math.round(
    (review.overallQuality.score +
     review.atsCompatibility.score +
     review.competitiveness.score) / 3
  );
  return avg;
}

/** Max chars of an error message we'll surface to the client. */
const MAX_CLIENT_ERROR = 300;
function truncateForClient(message: string): string {
  const single = message.replace(/\s+/g, " ").trim();
  return single.length > MAX_CLIENT_ERROR ? single.slice(0, MAX_CLIENT_ERROR) + "…" : single;
}

/**
 * Verbose request logging. Off by default: request bodies are the user's
 * document text and must not sit in production logs.
 */
const AI_DEBUG = process.env.AI_DEBUG === "true";
function debugLog(...args: unknown[]) {
  if (AI_DEBUG) console.log(...args);
}

/**
 * Structured, production-safe pipeline metadata. Numbers, model names and
 * fingerprints only — never user ids, document contents or response bodies.
 */
function infoLog(...args: unknown[]) {
  console.info("[ai-review]", ...args);
}

/**
 * Stable short fingerprint of a string (FNV-1a, hex). Used in logs so two
 * requests can be compared for "same input?" without ever printing the
 * document content. Not cryptographic — it exists to spot identical inputs.
 */
export function fingerprint(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Upstream timeout for the review-service request. */
function reviewServiceTimeoutMs(): number {
  const raw = Number(process.env.AI_REVIEW_TIMEOUT_MS || 60_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 60_000;
}

/**
 * Parse the review-service error body ({ error, message }) and classify it
 * into the error contract SmartScholar's route already understands:
 *   - 401/403            -> AiConfigError   (service not configured / auth)
 *   - 429                -> AiCapacityError (rate limit)
 *   - UPSTREAM_WAF_BLOCK -> AiWafBlockError (gateway WAF block, not retryable)
 *   - everything else    -> plain Error with the client-safe service message
 * The API key never appears in any of these messages.
 */
function mapReviewServiceError(status: number, body: string): Error {
  let parsed: { error?: string; message?: string } = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = {};
  }
  const code = parsed.error || "";
  const message = parsed.message || `AI review service returned HTTP ${status}.`;

  if (status === 401 || status === 403) {
    return new AiConfigError(message);
  }
  if (status === 429) {
    return new AiCapacityError(message);
  }
  if (code === "UPSTREAM_WAF_BLOCK") {
    console.error(
      "[ai-review] review service reported an Aliyun WAF block from its upstream gateway"
    );
    return new AiWafBlockError(message);
  }
  return new Error(message);
}

/**
 * Validate the ReviewScore returned by the review service, with the same
 * strictness as before (object with numeric 1-10 sub-scores).
 */
function validateReviewScore(data: unknown): ReviewScore {
  if (!data || typeof data !== "object") {
    throw new Error("AI review service returned a malformed review.");
  }
  const d = data as {
    overallQuality?: { score?: unknown };
    atsCompatibility?: { score?: unknown };
    competitiveness?: { score?: unknown };
  };
  const scores = [
    d.overallQuality?.score,
    d.atsCompatibility?.score,
    d.competitiveness?.score,
  ];
  if (scores.some((s) => typeof s !== "number")) {
    throw new Error("AI review service returned a malformed review.");
  }
  if (scores.some((s) => (s as number) < 1 || (s as number) > 10)) {
    throw new Error("AI review service returned a malformed review.");
  }
  return data as ReviewScore;
}

/**
 * POST {documentType, text} to the review service and return the parsed
 * ReviewScore. Single-provider by design: no fallback chain, no canned reply.
 * Throws AiConfigError / AiCapacityError / AiWafBlockError / Error as mapped
 * above. A successful review is never fabricated.
 */
async function callReviewService(text: string, documentType: string): Promise<ReviewScore> {
  const url = getReviewServiceUrl();
  if (!url) {
    infoLog("AI review service not configured — AI_REVIEW_SERVICE_URL missing");
    throw new AiConfigError(
      "AI review service is not configured: AI_REVIEW_SERVICE_URL is missing from the server environment."
    );
  }

  debugLog(`[review-service] POST ${url}/review`);

  let response: Response;
  try {
    response = await fetch(`${url}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentType, text }),
      signal: AbortSignal.timeout(reviewServiceTimeoutMs()),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      infoLog(`review service timeout after ${reviewServiceTimeoutMs()}ms`);
      throw new Error("AI review service timed out. Please try again.");
    }
    infoLog("review service network error:", e instanceof Error ? e.message : String(e));
    throw new Error("AI review service is unreachable. Please try again.");
  }

  const ct = response.headers.get("content-type") || "";
  const body = await response.text().catch(() => "");
  infoLog(
    `review service response status=${response.status} contentType=${ct} responseChars=${body.length}`
  );

  if (!response.ok) {
    throw mapReviewServiceError(response.status, body);
  }

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    console.error(
      "[ai-review] review service non-JSON response:",
      `status=${response.status} content-type=${ct} responseChars=${body.length}`
    );
    throw new Error("AI review service returned a non-JSON response.");
  }

  return validateReviewScore(data);
}

/**
 * Review a document's extracted text via the Railway AI review service.
 *
 * THROWS on any failure — it never fabricates a successful review. A thrown
 * error is a real failure the caller must surface to the user.
 */
export async function reviewDocument(
  text: string,
  documentType: string
): Promise<ReviewScore> {
  if (!text || text.trim().length === 0) {
    const err = new Error("The document contains no extractable text to review.");
    infoLog(`rejected empty text for documentType=${documentType}`);
    throw err;
  }

  infoLog(
    `review started documentType=${documentType} textChars=${text.length} ` +
      `model=${AGENTROUTER_MODEL} textFingerprint=${fingerprint(text)}`
  );
  debugLog(`[review] text preview (300 chars): ${text.slice(0, 300).replace(/\s+/g, " ")}`);

  let review: ReviewScore;
  try {
    review = await callReviewService(text, documentType);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai-review] review service failed:", msg);
    if (
      e instanceof AiConfigError ||
      e instanceof AiCapacityError ||
      e instanceof AiWafBlockError
    )
      throw e;
    throw new Error(`AI review failed: ${truncateForClient(msg)}`);
  }

  infoLog(`review received responseChars=${JSON.stringify(review).length}`);
  return review;
}
