import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  reviewDocument,
  buildReviewPrompt,
  calculateAverageScore,
  fingerprint,
  AiConfigError,
  AiCapacityError,
  AGENTROUTER_URL,
  AGENTROUTER_MODEL,
  type ReviewScore,
} from "@/lib/ai-review";

/* ------------------------------------------------------------------ */
/* AI review tests for the AgentRouter-only architecture.             */
/*                                                                     */
/* AgentRouter is the ONLY AI provider. There is deliberately no       */
/* fallback chain, so these tests prove:                               */
/*   1. Success paths hit AgentRouter and only AgentRouter.            */
/*   2. The API key comes from the environment, never hardcoded.       */
/*   3. A missing AGENTROUTER_API_KEY is a clear config error.         */
/*   4. AgentRouter API errors are surfaced as errors.                 */
/*   5. Malformed / empty / non-JSON responses are handled.            */
/*   6. Different documents produce different AI request inputs.       */
/*   7. No fallback provider is ever invoked.                          */
/*   8. No fake or default review is returned after a failure.         */
/* ------------------------------------------------------------------ */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const validReview: ReviewScore = {
  overallQuality: {
    score: 8,
    strengthsSummary: "Strong project history",
    weaknessesSummary: "Needs more leadership examples",
  },
  atsCompatibility: {
    score: 7,
    missingKeywords: ["International"],
    improvements: ["Mention the fellowship"],
  },
  competitiveness: {
    score: 6,
    uniqueStrengths: "Built a research project",
    differentiation: "First in class project",
  },
  topImprovements: ["Add awards", "Quantify impact", "Add volunteering"],
  quickWins: ["Fix formatting", "Add GPA"],
  overallAssessment: "Solid application with room to grow",
};

const originalFetch = globalThis.fetch;
const originalKeys = {
  AGENTROUTER: process.env.AGENTROUTER_API_KEY,
  GROQ: process.env.GROQ_API_KEY,
  GEMINI: process.env.GEMINI_API_KEY,
};

type Route = { url: string; status?: number; body?: string; contentType?: string };

function mockFetch(routes: Route[]): { url: string; init: RequestInit }[] {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : String(input);
    calls.push({ url, init: init ?? {} });
    const route = routes.find((r) => url.includes(r.url));
    return Promise.resolve(
      new Response(route?.body ?? "{}", {
        status: route?.status ?? 200,
        headers: { "content-type": route?.contentType ?? "application/json" },
      })
    );
  }) as typeof fetch;
  return calls;
}

function agentJson(text: string): Route {
  return {
    url: AGENTROUTER_URL,
    body: JSON.stringify({ choices: [{ message: { content: text } }] }),
  };
}

function bodyOf(call: { init: RequestInit }): {
  model: string;
  messages: { role: string; content: string }[];
} {
  return JSON.parse(String(call.init.body));
}

beforeEach(() => {
  process.env.AGENTROUTER_API_KEY = "test-agentrouter-key";
  // Deliberately configure the old providers too: the tests below prove the
  // app never contacts them even when their keys are present.
  process.env.GROQ_API_KEY = "test-groq-key";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  delete process.env.AI_DEBUG;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.AGENTROUTER_API_KEY = originalKeys.AGENTROUTER;
  process.env.GROQ_API_KEY = originalKeys.GROQ;
  process.env.GEMINI_API_KEY = originalKeys.GEMINI;
});

describe("buildReviewPrompt", () => {
  it("includes the document type and the extracted text", () => {
    const prompt = buildReviewPrompt("CV", "My leadership and STEM project history.");
    expect(prompt).toContain("cv");
    expect(prompt).toContain("My leadership and STEM project history.");
  });

  it("two different documents produce two different prompts", () => {
    const a = buildReviewPrompt("CV", "Founded a robotics club");
    const b = buildReviewPrompt("CV", "Won an olympiad medal");
    expect(a).not.toBe(b);
  });

  it("truncates very long documents instead of exceeding context", () => {
    const long = "x".repeat(60_000);
    const prompt = buildReviewPrompt("Statement", long);
    expect(prompt.length).toBeLessThan(16_000);
  });
});

describe("fingerprint", () => {
  it("differs for different inputs and is stable for the same input", () => {
    expect(fingerprint("Founded a robotics club")).not.toBe(
      fingerprint("Won an olympiad medal")
    );
    expect(fingerprint("same text")).toBe(fingerprint("same text"));
  });
});

describe("calculateAverageScore", () => {
  it("averages the three sub-scores", () => {
    expect(calculateAverageScore(validReview)).toBe(7);
  });
});

describe("reviewDocument — AgentRouter success path", () => {
  it("returns the parsed review, calling AgentRouter and only AgentRouter", async () => {
    const calls = mockFetch([agentJson(JSON.stringify(validReview))]);

    const result = await reviewDocument("Sample CV text", "CV");

    expect(result).toEqual(validReview);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain(AGENTROUTER_URL);
    // Old providers must never be contacted, even though their keys are set.
    expect(calls.some((c) => c.url.includes(GROQ_URL))).toBe(false);
    expect(calls.some((c) => c.url.includes(GEMINI_URL))).toBe(false);
  });

  it("sends the extracted document text as the real AI input", async () => {
    const calls = mockFetch([agentJson(JSON.stringify(validReview))]);

    await reviewDocument("My unique personal statement text", "Statement");

    const body = bodyOf(calls[0]!);
    expect(body.messages[0]!.content).toContain("My unique personal statement text");
    expect(body.model).toBe(AGENTROUTER_MODEL);
  });

  it("reads the API key from the environment, never hardcodes it", async () => {
    const calls = mockFetch([agentJson(JSON.stringify(validReview))]);

    await reviewDocument("Sample CV text", "CV");

    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-agentrouter-key");
    expect(String(calls[0]!.init.body)).not.toContain("test-agentrouter-key");
    expect(String(calls[0]!.init.body)).not.toContain("sk-");
  });

  it("sends two different documents as two different AI inputs", async () => {
    const calls = mockFetch([agentJson(JSON.stringify(validReview))]);

    await reviewDocument("Document A content", "CV");
    await reviewDocument("Document B content", "CV");

    expect(calls).toHaveLength(2);
    const first = bodyOf(calls[0]!);
    const second = bodyOf(calls[1]!);
    expect(first.messages[0]!.content).not.toBe(second.messages[0]!.content);
    expect(first.messages[0]!.content).toContain("Document A content");
    expect(second.messages[0]!.content).toContain("Document B content");
  });
});

describe("reviewDocument — configuration", () => {
  it("missing AGENTROUTER_API_KEY produces a clear config error before any request", async () => {
    const calls = mockFetch([agentJson(JSON.stringify(validReview))]);
    delete process.env.AGENTROUTER_API_KEY;

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      AiConfigError
    );
    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      "AGENTROUTER_API_KEY"
    );
    expect(calls).toHaveLength(0);
  });
});

describe("reviewDocument — AgentRouter failures are surfaced, never faked", () => {
  it("rejects empty text before contacting any provider", async () => {
    const calls = mockFetch([agentJson(JSON.stringify(validReview))]);
    await expect(reviewDocument("   ", "CV")).rejects.toThrow(
      "contains no extractable text"
    );
    expect(calls).toHaveLength(0);
  });

  it("surfaces an HTTP 500 as an error instead of returning a fake review", async () => {
    const calls = mockFetch([
      { url: AGENTROUTER_URL, status: 500, body: "agentrouter down" },
    ]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /request failed \(HTTP 500/
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain(AGENTROUTER_URL);
  });

  it("surfaces an authentication failure as an error", async () => {
    mockFetch([{ url: AGENTROUTER_URL, status: 401, body: "{}" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /authentication failed/
    );
  });

  it("surfaces a 429 as a capacity error", async () => {
    mockFetch([{ url: AGENTROUTER_URL, status: 429, body: "{}" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      AiCapacityError
    );
    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /temporarily unavailable/
    );
  });

  it("surfaces a non-JSON content type as an error", async () => {
    mockFetch([
      { url: AGENTROUTER_URL, status: 200, contentType: "text/html", body: "<html>" },
    ]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /non-JSON response/
    );
  });

  it("surfaces an unparseable response body as an error", async () => {
    mockFetch([{ url: AGENTROUTER_URL, status: 200, body: "this is not json" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /unparseable response body/
    );
  });

  it("surfaces an empty completion as an error", async () => {
    mockFetch([agentJson("")]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /empty completion/
    );
  });

  it("surfaces a malformed JSON review payload as an error rather than substituting a review", async () => {
    mockFetch([agentJson("this is not json")]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      "malformed response"
    );
  });

  it("rejects a JSON object missing the required score fields", async () => {
    mockFetch([agentJson(JSON.stringify({ overallQuality: { score: 8 } }))]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      "malformed response"
    );
  });

  it("surfaces a network error as an error", async () => {
    globalThis.fetch = (() =>
      Promise.reject(new Error("network down"))) as typeof fetch;

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /AgentRouter network error/
    );
  });
});
