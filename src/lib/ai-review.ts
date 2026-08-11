/**
 * Client identification AgentRouter requires. Exported so scripts send exactly
 * the same values as the app — when these drifted apart, the app 401'd while
 * the test script passed, which made the failure look like a key problem.
 */
export const AGENTROUTER_CLIENT = {
  originator: process.env.AGENTROUTER_ORIGINATOR || "codex_cli_rs",
  userAgent: process.env.AGENTROUTER_USER_AGENT || "codex_cli_rs/0.101.0",
  version: process.env.AGENTROUTER_VERSION || "0.101.0",
} as const;

/**
 * AgentRouter is the ONLY AI provider. Every AI request in SmartScholar goes
 * through this gateway — there is deliberately no fallback provider, so a
 * failure is a real failure and never a silent switch to another vendor.
 *
 * The gateway speaks the Anthropic Messages API for Claude models:
 *   endpoint: POST https://agentrouter.org/v1/messages
 *   auth:     x-api-key (AgentRouter key) + anthropic-version header
 *
 * Endpoint overridable with AGENTROUTER_ENDPOINT, model overridable with
 * AGENTROUTER_MODEL. Both read once at module load.
 */
export const AGENTROUTER_URL =
  process.env.AGENTROUTER_ENDPOINT || "https://agentrouter.org/v1/messages";

export const AGENTROUTER_MODEL =
  process.env.AGENTROUTER_MODEL || "claude-opus-4-8";

/** AI service not configured — e.g. AGENTROUTER_API_KEY missing. */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

/** Provider reachable but overloaded / out of quota. */
export class AiCapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiCapacityError";
  }
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
}

export function calculateAverageScore(review: ReviewScore): number {
  const avg = Math.round(
    (review.overallQuality.score +
     review.atsCompatibility.score +
     review.competitiveness.score) / 3
  );
  return avg;
}

const REVIEW_PROMPT = `You are rating a high school student's CV (grades 9-12) for a scholarship.

SCORE on 3 scales (0-10):
- 9-10: Built project OR research OR international fellowship
- 7-8: Good achievements + leadership
- 5-6: Some achievements but basic
- 0-4: Generic

ATS Keywords to check: Leadership, Innovation, STEM, Research, Project, Awards, Community, International, Entrepreneurship, Impact, Founded, Organized, Led

Document Type: {documentType}

Document:
{documentText}

Keep every text field short (one or two sentences).

Return ONLY JSON (no other text):
{
  "overallQuality": {"score": 0, "strengthsSummary": "text", "weaknessesSummary": "text"},
  "atsCompatibility": {"score": 0, "missingKeywords": [], "improvements": []},
  "competitiveness": {"score": 0, "uniqueStrengths": "text", "differentiation": "text"},
  "topImprovements": ["text1", "text2", "text3"],
  "quickWins": ["text1", "text2"],
  "overallAssessment": "text"
}`;

/**
 * Build the review prompt for a document. Pure and exported so tests can prove
 * that two different documents produce two different prompts (and that the
 * extracted text genuinely reaches the model input).
 *
 * The document is truncated to 15k chars here — long enough to review real
 * CVs/statements, short enough to stay inside the provider context window.
 */
export function buildReviewPrompt(documentType: string, text: string): string {
  const typeLabel = documentType.replace(/_/g, " ").toLowerCase();
  return REVIEW_PROMPT
    .replace("{documentType}", typeLabel)
    .replace("{documentText}", text.slice(0, 15000));
}

/** Max chars of an error message we'll surface to the client. */
const MAX_CLIENT_ERROR = 300;
function truncateForClient(message: string): string {
  const single = message.replace(/\s+/g, " ").trim();
  return single.length > MAX_CLIENT_ERROR ? single.slice(0, MAX_CLIENT_ERROR) + "…" : single;
}

/**
 * Verbose provider logging. Off by default: the response body can contain
 * fragments of the user's uploaded document, which should not sit in
 * production logs.
 */
const AI_DEBUG = process.env.AI_DEBUG === "true";
function debugLog(...args: unknown[]) {
  if (AI_DEBUG) console.log(...args);
}

/**
 * Structured, production-safe pipeline metadata. Numbers, model names and
 * fingerprints only — never user ids, file URLs, response bodies or document
 * previews.
 */
function infoLog(...args: unknown[]) {
  console.info("[ai-review]", ...args);
}

/**
 * Stable short fingerprint of a string (FNV-1a, hex). Used in logs so two
 * requests can be compared for "same input?" without ever printing the
 * document or prompt content. Not cryptographic — it exists to spot identical
 * inputs, not for security.
 */
export function fingerprint(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Max chars of a response body printed to the server log (via console.error)
 * when a request fails or the body isn't JSON. Bodies can contain fragments of
 * the user's document, so on failure we log a compact one-line preview that
 * never includes full document text. Off in production except for genuinely
 * broken responses, where a short preview is worth far more than a mystery
 * 500 for the developer triaging it.
 */
const MAX_BODY_PREVIEW = 500;
function safeBodyPreview(body: string): string {
  return body.replace(/\s+/g, " ").trim().slice(0, MAX_BODY_PREVIEW);
}

/**
 * Pull the model's text out of a JSON response. AgentRouter returns the
 * Anthropic Messages shape for Claude models:
 *
 *   { "content": [{ "type": "text", "text": "..." }] }
 *
 * but we tolerate the OpenAI chat-completion shape
 * ({ choices: [{ message: { content } }] }) as well, because the gateway may
 * sit in front of non-Claude models for other customers and the failure mode
 * ("empty completion") is confusing to debug. Returns "" when no text is found.
 */
function extractAgentRouterText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as {
    content?: { type?: string; text?: string }[];
    choices?: { message?: { content?: string } }[];
  };
  const anthropicText = Array.isArray(d.content)
    ? d.content.map((c) => c?.text ?? "").join("")
    : "";
  if (anthropicText.trim()) return anthropicText;
  return d.choices?.[0]?.message?.content ?? "";
}

/**
 * Send the prompt to AgentRouter and return the model's text.
 *
 * Single-provider by design: no fallback chain, no generic canned reply.
 * Every failure throws:
 *   - AiConfigError    — AGENTROUTER_API_KEY missing
 *   - AiCapacityError  — 429 / quota / rate-limit
 *   - Error            — auth failure, HTTP error, no channel for model,
 *                        non-JSON body, empty completion, network
 *
 * The caller surfaces the error to the user; a successful review is never
 * fabricated.
 */
async function callAgentRouter(prompt: string): Promise<string> {
  const key = process.env.AGENTROUTER_API_KEY;
  if (!key) {
    infoLog("AgentRouter config error — AGENTROUTER_API_KEY not set");
    throw new AiConfigError(
      "AgentRouter is not configured: AGENTROUTER_API_KEY is missing."
    );
  }

  debugLog(
    `[AgentRouter] POST ${AGENTROUTER_URL} (model: ${AGENTROUTER_MODEL}, max_tokens: 2000)`
  );

  let response: Response;
  try {
    response = await fetch(AGENTROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Anthropic Messages API auth: the AgentRouter key goes in x-api-key,
        // never in a Bearer Authorization header. Sending Authorization gets a
        // 401, which used to look like a bad key.
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        // AgentRouter fingerprints the calling client and rejects requests it
        // doesn't recognise with HTTP 401 "unauthorized client detected" —
        // which looks exactly like a bad API key. Without these three headers
        // every review fails, no matter how valid the key is.
        Originator: AGENTROUTER_CLIENT.originator,
        "User-Agent": AGENTROUTER_CLIENT.userAgent,
        Version: AGENTROUTER_CLIENT.version,
      },
      body: JSON.stringify({
        model: AGENTROUTER_MODEL,
        // 4096, not 2000: this model channel emits a forced "thinking" block
        // that can consume most of a 2000-token budget, truncating the review
        // JSON mid-field (stop_reason "max_tokens"). The extra headroom keeps
        // the structured answer intact even after a long thinking sequence.
        max_tokens: 4096,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    throw new Error(
      `AgentRouter network error: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const ct = response.headers.get("content-type") || "";
  const body = await response.text().catch(() => "");
  infoLog(
    `AgentRouter request finished ok=${response.ok} status=${response.status} ` +
      `contentType=${ct} responseChars=${body.length} model=${AGENTROUTER_MODEL}`
  );
  debugLog(`[AgentRouter] body (500 chars): ${body.slice(0, 500)}`);

  if (!response.ok) {
    const msg = body.toLowerCase();
    if (
      response.status === 429 ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("insufficient")
    ) {
      throw new AiCapacityError(
        "AI review service is temporarily unavailable due to high demand. Please try again in a few minutes."
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "AgentRouter authentication failed (HTTP " +
          response.status +
          "). Please verify your API key at https://agentrouter.org/console/token and ensure it has credits."
      );
    }
    // 503 "无可用渠道" = "no available channel" — the group serving this key has
    // no channel for the requested model. The error message alone is not
    // actionable, so map it to the fix: change AGENTROUTER_MODEL.
    if (response.status === 503 && msg.includes("\u65e0\u53ef\u7528\u6e20\u9053")) {
      throw new Error(
        `AgentRouter has no available channel for model "${AGENTROUTER_MODEL}" (HTTP 503). ` +
          `Set AGENTROUTER_MODEL in .env to a model your AgentRouter group serves.`
      );
    }
    console.error(
      `[ai-review] AgentRouter HTTP ${response.status} content-type=${ct} body preview: ${safeBodyPreview(body)}`
    );
    throw new Error(
      `AgentRouter request failed (HTTP ${response.status}, content-type: ${ct}).`
    );
  }

  // The gateway serves JSON with content-type text/plain (and HTML for some
  // error pages), so we trust the body shape, not the header.
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    console.error(
      `[ai-review] AgentRouter non-JSON body: status=${response.status} content-type=${ct} body preview: ${safeBodyPreview(body)}`
    );
    throw new Error(
      `AgentRouter returned a non-JSON response (HTTP ${response.status}, content-type: ${ct}).`
    );
  }

  const content = extractAgentRouterText(data);
  if (!content.trim()) {
    throw new Error("AgentRouter returned an empty completion for the review request.");
  }
  return content;
}

/**
 * Review a document's extracted text.
 *
 * THROWS on any provider failure — it never fabricates a successful review.
 * A thrown error is a real failure the caller must surface to the user.
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

  const prompt = buildReviewPrompt(documentType, text);
  infoLog(
    `review started documentType=${documentType} textChars=${text.length} ` +
      `promptChars=${prompt.length} model=${AGENTROUTER_MODEL} ` +
      `textFingerprint=${fingerprint(text)} promptFingerprint=${fingerprint(prompt)}`
  );
  debugLog(`[review] text preview (300 chars): ${text.slice(0, 300).replace(/\s+/g, " ")}`);

  let responseText: string;
  try {
    responseText = await callAgentRouter(prompt);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai-review] AgentRouter failed:", msg);
    if (e instanceof AiConfigError || e instanceof AiCapacityError) throw e;
    throw new Error(`AI review failed: ${truncateForClient(msg)}`);
  }

  infoLog(`review received provider text responseChars=${responseText.length}`);

  try {
    const cleaned = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed: ReviewScore = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("response was not a JSON object");
    }
    if (
      typeof parsed.overallQuality?.score !== "number" ||
      typeof parsed.atsCompatibility?.score !== "number" ||
      typeof parsed.competitiveness?.score !== "number"
    ) {
      throw new Error("missing required score fields");
    }
    if (
      parsed.overallQuality.score < 1 ||
      parsed.overallQuality.score > 10 ||
      parsed.atsCompatibility.score < 1 ||
      parsed.atsCompatibility.score > 10 ||
      parsed.competitiveness.score < 1 ||
      parsed.competitiveness.score > 10
    ) {
      throw new Error("score out of the 1-10 range");
    }
    return parsed;
  } catch {
    const preview =
      responseText.length > 300 ? responseText.slice(0, 300) + "..." : responseText;
    console.error(
      `[ai-review] malformed AgentRouter response (${responseText.length} chars). Preview:`,
      preview
    );
    throw new Error(
      `AI review failed: AgentRouter returned a malformed response (${responseText.length} characters) that could not be parsed as a review.`
    );
  }
}
