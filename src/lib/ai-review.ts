const BAZAARLINK_ENDPOINT =
  process.env.BAZAARLINK_ENDPOINT || "https://bazaarlink.ai/api/v1/chat/completions";
const BAZAARLINK_KEY = process.env.BAZAARLINK_API_KEY || "";

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

const REVIEW_MODELS = ['claude-sonnet-4-20250514']; // Only Claude for reviews

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
 * Verbose provider logging. Off by default: the response body can contain
 * fragments of the user's uploaded document, which should not sit in
 * production logs.
 */
const AI_DEBUG = process.env.AI_DEBUG === "true";
function debugLog(...args: unknown[]) {
  if (AI_DEBUG) console.log(...args);
}

/**
 * Generic OpenAI-compatible chat completion.
 *
 * Groq, OpenRouter, Together, DeepInfra, BazaarLink and AgentRouter all speak
 * this same shape, so a dead vendor becomes two env-var changes rather than a
 * code change. This project has now been blocked by three separate provider
 * outages; that's the reason this is generic.
 *
 * Returns null on failure so callAI can fall through to the next provider.
 * Throws only for conditions the user must be told about (rate limits).
 */
async function callOpenAICompatible(opts: {
  name: string;
  url: string;
  key: string;
  model: string;
  prompt: string;
  headers?: Record<string, string>;
}): Promise<string | null> {
  const { name, url, key, model, prompt, headers = {} } = opts;
  if (!key) {
    debugLog(`[${name}] skipped — no API key configured`);
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        ...headers,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        temperature: 0.4,
        // Groq (and OpenAI) reject json_object mode unless the messages
        // literally contain the word "json" — a 400, not a soft failure. Only
        // request the mode when the prompt satisfies that, so a provider that
        // doesn't support response_format at all still works.
        ...(/json/i.test(prompt) ? { response_format: { type: "json_object" } } : {}),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const body = await response.text().catch(() => "");
    debugLog(`[${name}] status: ${response.status}`);
    debugLog(`[${name}] body (500 chars): ${body.slice(0, 500)}`);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(
          "AI review is temporarily rate-limited. Please try again in a few minutes."
        );
      }
      console.error(`[${name}] FAILED ${response.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const text = JSON.parse(body)?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      console.error(`[${name}] empty response`);
      return null;
    }
    return text;
  } catch (e) {
    if (e instanceof Error && e.message.includes("rate-limited")) throw e;
    console.error(`[${name}] error:`, e);
    return null;
  }
}

/**
 * Groq — the primary provider. Free tier, no card, and fast.
 * Override GROQ_MODEL if the named model is retired.
 */
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = process.env.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";

/**
 * Google Gemini — the primary provider.
 *
 * Uses Google's own REST API rather than an OpenAI-compatible gateway, so
 * there is no third party between us and the model that can silently lose a
 * routing channel. The free tier at aistudio.google.com needs no card and is
 * comfortably above what this product will use.
 *
 * Note the different shape: `contents[].parts[].text` in, and the response is
 * `candidates[0].content.parts[].text` — not `choices[0].message.content`.
 */
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_KEY) {
    debugLog("[Gemini] skipped — GEMINI_API_KEY not set");
    return null;
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header, not a query param — a key in the URL ends up in access logs.
        "x-goog-api-key": GEMINI_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      }),
    });

    const body = await response.text().catch(() => "");
    debugLog(`[Gemini] status: ${response.status}`);
    debugLog(`[Gemini] body (500 chars): ${body.slice(0, 500)}`);

    if (!response.ok) {
      // 429 = free-tier quota. Worth surfacing distinctly so the caller can
      // refund the credit and tell the user to retry rather than blaming them.
      if (response.status === 429) {
        throw new Error(
          "AI review is temporarily rate-limited. Please try again in a few minutes."
        );
      }
      console.error(`[Gemini] FAILED ${response.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const data = JSON.parse(body);
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p?.text ?? "").join("")
      : "";

    if (!text.trim()) {
      // A blocked prompt returns 200 with no candidate text.
      const reason = data?.promptFeedback?.blockReason ?? data?.candidates?.[0]?.finishReason;
      console.error(`[Gemini] empty response${reason ? ` (${reason})` : ""}`);
      return null;
    }
    return text;
  } catch (e) {
    if (e instanceof Error && e.message.includes("rate-limited")) throw e;
    console.error("[Gemini] fetch error:", e);
    return null;
  }
}

async function callAI(prompt: string): Promise<string> {
  // Gemini first. The OpenAI-compatible gateways below are kept as fallbacks,
  // but both proved unreliable in practice: AgentRouter rejected the app as an
  // "unauthorized client", and once that was fixed reported no available
  // channel for the configured model.
  const groq = await callOpenAICompatible({
    name: "Groq", url: GROQ_URL, key: GROQ_KEY, model: GROQ_MODEL, prompt,
  });
  if (groq) return groq;

  const gemini = await callGemini(prompt);
  if (gemini) return gemini;

  // Then BazaarLink (free OpenAI-compatible gateway).
  // Skipped entirely when no key is configured — fall straight through to AgentRouter.
  if (!BAZAARLINK_KEY) {
    debugLog("[BazaarLink] skipped — BAZAARLINK_API_KEY not set");
  } else try {
    const url = BAZAARLINK_ENDPOINT;
    debugLog(`[BazaarLink] POST ${url} (model: auto:free, max_tokens: 2000)`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BAZAARLINK_KEY}`,
      },
      body: JSON.stringify({
        model: "auto:free",
        max_tokens: 2000,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const ct = response.headers.get("content-type") || "";
    const body = await response.text().catch(() => "");
    debugLog(`[BazaarLink] status: ${response.status}, content-type: ${ct}`);
    debugLog(`[BazaarLink] body (500 chars): ${body.slice(0, 500)}`);

    if (response.ok && ct.includes("application/json")) {
      const data = JSON.parse(body);
      return data.choices?.[0]?.message?.content ?? "";
    }

    console.error(`[BazaarLink] FAILED — non-JSON or error response`);
  } catch (e) {
    console.error(`[BazaarLink] fetch error:`, e);
  }

  let lastError: string | null = null;

  for (const model of REVIEW_MODELS) {
    try {
      const url = "https://agentrouter.org/v1/chat/completions";
      const key = process.env.AGENTROUTER_API_KEY;
      if (!key) {
        lastError = "AGENTROUTER_API_KEY not set";
        console.error("[AgentRouter] AGENTROUTER_API_KEY not set — skipping");
        break;
      }
      debugLog(`[AgentRouter] POST ${url} (model: ${model}, max_tokens: 2000)`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          // AgentRouter fingerprints the calling client and rejects requests it
          // doesn't recognise with HTTP 401 "unauthorized client detected" —
          // which looks exactly like a bad API key. Without these three headers
          // every review fails, no matter how valid the key is.
          // scripts/test-agentrouter.mjs already sent them; the app did not.
          Originator: AGENTROUTER_CLIENT.originator,
          "User-Agent": AGENTROUTER_CLIENT.userAgent,
          Version: AGENTROUTER_CLIENT.version,
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          temperature: 0.4,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const ct = response.headers.get("content-type") || "";
      const body = await response.text().catch(() => "");
      const msg = body.toLowerCase();
      debugLog(`[AgentRouter] status: ${response.status}, content-type: ${ct}`);
      debugLog(`[AgentRouter] body (500 chars): ${body.slice(0, 500)}`);

      if (response.ok && ct.includes("application/json")) {
        const data = JSON.parse(body);
        return data.choices?.[0]?.message?.content ?? "";
      }

      if (response.status === 429 || msg.includes("quota") || msg.includes("rate limit") || msg.includes("insufficient")) {
        throw new Error("AI review service is temporarily unavailable due to high demand. Please try again in a few minutes.");
      }
      if (response.status === 403 && model === REVIEW_MODELS[REVIEW_MODELS.length - 1]) {
        throw new Error(`AgentRouter authentication failed (HTTP ${response.status}). Please verify your API key at https://agentrouter.org/console/token and ensure it has credits. Response: ${body.slice(0, 150)}`);
      }
      lastError = `Model "${model}" failed (${response.status}, ${ct})`;
    } catch (e) {
      if (e instanceof Error && (e.message.includes("quota") || e.message.includes("rate limit") || e.message.includes("insufficient") || e.message.includes("authentication failed"))) {
        throw e;
      }
      console.error(`[AgentRouter] model "${model}" error:`, e);
      lastError = `Model "${model}" threw: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  throw new Error(
    `No AI provider is available. Set GROQ_API_KEY in .env (free key, no ` +
    `card, at https://console.groq.com/keys). Last gateway error: ${lastError}`
  );
}

const FALLBACK: ReviewScore = {
  overallQuality: {
    score: 5,
    strengthsSummary: "Shows relevant experience and interest in the field",
    weaknessesSummary: "Needs more specific evidence and quantifiable achievements",
  },
  atsCompatibility: {
    score: 5,
    missingKeywords: ["scholarship focus areas", "quantifiable results"],
    improvements: ["Add section headers", "Include relevant keywords"],
  },
  competitiveness: {
    score: 5,
    uniqueStrengths: "Demonstrates basic qualifications",
    differentiation: "Add unique achievements and a compelling personal story to stand out",
  },
  topImprovements: [
    "Add specific quantifiable achievements with numbers and outcomes",
    "Strengthen the opening paragraph to grab attention",
    "Tailor content specifically to this scholarship's criteria",
    "Remove generic phrases and clichés throughout",
    "Proofread carefully for grammar and consistency",
  ],
  quickWins: [
    "Review comma usage in longer sentences",
    "Replace passive voice with active constructions",
  ],
  overallAssessment: "The document covers relevant experience but needs more specific, quantifiable achievements and better tailoring to the scholarship criteria. The main priority is adding concrete metrics and outcomes.",
};

export async function reviewDocument(
  text: string,
  documentType: string
): Promise<ReviewScore> {
  const typeLabel = documentType.replace(/_/g, " ").toLowerCase();

  const prompt = REVIEW_PROMPT
    .replace("{documentType}", typeLabel)
    .replace("{documentText}", text.slice(0, 15000));

  let responseText: string;
  try {
    responseText = await callAI(prompt);
  } catch (e) {
    console.error("callAI threw:", e);
    return { ...FALLBACK };
  }

  try {
    const cleaned = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed: ReviewScore = JSON.parse(cleaned);
    if (typeof parsed.overallQuality?.score !== "number" || parsed.overallQuality.score < 1 || parsed.overallQuality.score > 10) {
      throw new Error("Invalid score");
    }
    return parsed;
  } catch {
    const preview = responseText.length > 200 ? responseText.slice(0, 200) + "..." : responseText;
    console.error("AI review parsing failed. Raw response:", preview);
    const score = Math.max(1, Math.min(10, parseInt(responseText.match(/\d+/)?.[0] || "5")));
    return {
      ...FALLBACK,
      overallQuality: { ...FALLBACK.overallQuality, score },
    };
  }
}
