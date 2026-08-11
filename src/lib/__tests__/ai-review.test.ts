import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  reviewDocument,
  calculateAverageScore,
  fingerprint,
  getReviewServiceUrl,
  AiConfigError,
  AiCapacityError,
  AiWafBlockError,
  AGENTROUTER_WAF_BLOCK,
  type ReviewScore,
} from "@/lib/ai-review";

/* ------------------------------------------------------------------ */
/* AI review tests for the review-service architecture.                */
/*                                                                     */
/* SmartScholar never calls AgentRouter directly anymore — every       */
/* review goes to the isolated service on Railway (AI_REVIEW_SERVICE_  */
/* URL), which is the only component that holds the AgentRouter key.   */
/* There is deliberately no fallback chain, so these tests prove:      */
/*   1. Success paths call the review service and only the service.    */
/*   2. The request body is { documentType, text } — no model, no key. */
/*   3. A missing AI_REVIEW_SERVICE_URL is a clear config error.       */
/*   4. HTTP statuses are mapped to the route's error contract.        */
/*   5. Malformed / empty / non-JSON responses are handled.            */
/*   6. Different documents produce different request bodies.          */
/*   7. No fake or default review is returned after a failure.         */
/* ------------------------------------------------------------------ */

const REVIEW_URL = "https://my-review-service.up.railway.app/review";

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
const originalReviewUrl = process.env.AI_REVIEW_SERVICE_URL;

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

/** A valid review body served by the review service. */
function reviewJson(text: string): Route {
  return { url: REVIEW_URL, body: JSON.stringify(text) };
}

/** A valid ReviewScore served as the response body. */
function reviewScore(text: string): Route {
  return { ...reviewJson(text), body: JSON.stringify(validReview) };
}

function bodyOf(call: { init: RequestInit }): { documentType: string; text: string } {
  return JSON.parse(String(call.init.body));
}

beforeEach(() => {
  process.env.AI_REVIEW_SERVICE_URL = "https://my-review-service.up.railway.app";
  delete process.env.AI_DEBUG;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalReviewUrl === undefined) {
    delete process.env.AI_REVIEW_SERVICE_URL;
  } else {
    process.env.AI_REVIEW_SERVICE_URL = originalReviewUrl;
  }
});

describe("getReviewServiceUrl", () => {
  it("reads the base URL from the environment", () => {
    expect(getReviewServiceUrl()).toBe("https://my-review-service.up.railway.app");
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

describe("reviewDocument — review service success path", () => {
  it("returns the parsed review, calling only the review service", async () => {
    const calls = mockFetch([reviewScore(JSON.stringify(validReview))]);

    const result = await reviewDocument("Sample CV text", "CV");

    expect(result).toEqual(validReview);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain(REVIEW_URL);
  });

  it("sends { documentType, text } and nothing else — no model, no key", async () => {
    const calls = mockFetch([reviewScore(JSON.stringify(validReview))]);

    await reviewDocument("My unique personal statement text", "Statement");

    const call = calls[0]!;
    const body = bodyOf(call);
    expect(body.documentType).toBe("Statement");
    expect(body.text).toContain("My unique personal statement text");
    expect(Object.keys(body).sort()).toEqual(["documentType", "text"]);
    const headers = call.init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toContain("application/json");
    expect(headers["x-api-key"]).toBeUndefined();
    expect(headers.Authorization).toBeUndefined();
    expect(String(call.init.body)).not.toContain("sk-");
  });

  it("sends two different documents as two different request bodies", async () => {
    const calls = mockFetch([reviewScore(JSON.stringify(validReview))]);

    await reviewDocument("Document A content", "CV");
    await reviewDocument("Document B content", "CV");

    expect(calls).toHaveLength(2);
    const first = bodyOf(calls[0]!);
    const second = bodyOf(calls[1]!);
    expect(first.text).not.toBe(second.text);
    expect(first.text).toContain("Document A content");
    expect(second.text).toContain("Document B content");
  });
});

describe("reviewDocument — configuration", () => {
  it("missing AI_REVIEW_SERVICE_URL produces a clear config error before any request", async () => {
    const calls = mockFetch([reviewScore(JSON.stringify(validReview))]);
    delete process.env.AI_REVIEW_SERVICE_URL;

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      AiConfigError
    );
    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      "AI_REVIEW_SERVICE_URL"
    );
    expect(calls).toHaveLength(0);
  });

  it("an empty AI_REVIEW_SERVICE_URL is treated as not configured", async () => {
    const calls = mockFetch([reviewScore(JSON.stringify(validReview))]);
    process.env.AI_REVIEW_SERVICE_URL = "";

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      AiConfigError
    );
    expect(calls).toHaveLength(0);
  });
});

describe("reviewDocument — review service failures are surfaced, never faked", () => {
  it("rejects empty text before contacting the service", async () => {
    const calls = mockFetch([reviewScore(JSON.stringify(validReview))]);
    await expect(reviewDocument("   ", "CV")).rejects.toThrow(
      "contains no extractable text"
    );
    expect(calls).toHaveLength(0);
  });

  it("surfaces a 401 as a config error using the service message", async () => {
    mockFetch([
      { url: REVIEW_URL, status: 401, body: JSON.stringify({ error: "CONFIG", message: "invalid api key" }) },
    ]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      AiConfigError
    );
    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      "invalid api key"
    );
  });

  it("surfaces a 403 as a config error", async () => {
    mockFetch([{ url: REVIEW_URL, status: 403, body: "{}" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      AiConfigError
    );
  });

  it("surfaces a 429 as a capacity error", async () => {
    mockFetch([
      {
        url: REVIEW_URL,
        status: 429,
        body: JSON.stringify({ error: "RATE_LIMIT", message: "rate limit reached" }),
      },
    ]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      AiCapacityError
    );
    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      "rate limit reached"
    );
  });

  it("surfaces a generic HTTP error with the service message", async () => {
    mockFetch([
      {
        url: REVIEW_URL,
        status: 500,
        body: JSON.stringify({ error: "UPSTREAM_ERROR", message: "agentrouter down" }),
      },
    ]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /agentrouter down/
    );
  });

  it("surfaces a non-JSON error body with the HTTP status", async () => {
    mockFetch([{ url: REVIEW_URL, status: 500, body: "Internal Server Error" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /HTTP 500/
    );
  });

  it("surfaces a non-JSON success body as an error", async () => {
    mockFetch([{ url: REVIEW_URL, status: 200, contentType: "text/html", body: "<html>" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /non-JSON response/
    );
  });

  it("surfaces an unparseable success body as an error", async () => {
    mockFetch([{ url: REVIEW_URL, status: 200, body: "this is not json" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /non-JSON response/
    );
  });

  it("rejects a JSON object missing the required score fields", async () => {
    mockFetch([{ url: REVIEW_URL, body: JSON.stringify({ overallQuality: { score: 8 } }) }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /malformed review/
    );
  });

  it("rejects a JSON object with an out-of-range score", async () => {
    mockFetch([
      {
        url: REVIEW_URL,
        body: JSON.stringify({
          overallQuality: { score: 11 },
          atsCompatibility: { score: 5 },
          competitiveness: { score: 5 },
        }),
      },
    ]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /malformed review/
    );
  });

  it("rejects a JSON array (not a review object)", async () => {
    mockFetch([{ url: REVIEW_URL, body: "[1,2,3]" }]);

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /malformed review/
    );
  });

  it("classifies an upstream WAF block as AGENTROUTER_WAF_BLOCK", async () => {
    mockFetch([
      {
        url: REVIEW_URL,
        status: 503,
        body: JSON.stringify({
          error: "UPSTREAM_WAF_BLOCK",
          message: "the upstream gateway answered with a WAF challenge",
        }),
      },
    ]);

    const err = await reviewDocument("Some CV text", "CV").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AiWafBlockError);
    expect((err as { code?: string }).code).toBe(AGENTROUTER_WAF_BLOCK);
    expect((err as { code?: string }).code).toBe("AGENTROUTER_WAF_BLOCK");
    // Client-safe: no challenge internals, no host, no credentials.
    const message = (err as Error).message;
    expect(message).not.toContain("UPSTREAM_WAF_BLOCK");
    expect(message).not.toContain("aliyun_waf_aa");
    expect(message).not.toContain("synthetic-token-a");
    expect(message).not.toContain("my-review-service.up.railway.app");
  });

  it("surfaces a network error as an error", async () => {
    globalThis.fetch = (() =>
      Promise.reject(new Error("network down"))) as typeof fetch;

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /review service is unreachable/
    );
  });

  it("surfaces a timeout as an error", async () => {
    globalThis.fetch = (() =>
      Promise.reject(
        Object.assign(new Error("signal timed out"), { name: "TimeoutError" })
      )) as typeof fetch;

    await expect(reviewDocument("Some CV text", "CV")).rejects.toThrow(
      /timed out/
    );
  });
});
