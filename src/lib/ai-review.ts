const FREEMODEL_ENDPOINT = "https://api.freemodel.dev/v1/chat/completions";
const FREEMODEL_KEY = process.env.FREEMODEL_API_KEY;

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

async function callAI(prompt: string): Promise<string> {
  // Try FREEMODEL first (if key is configured)
  if (FREEMODEL_KEY) {
    try {
      const response = await fetch(FREEMODEL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FREEMODEL_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 2000,
          temperature: 0.4,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const ct = response.headers.get("content-type") || "";
      if (response.ok && ct.includes("application/json")) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "";
      }
      if (!ct.includes("application/json")) {
        const text = await response.text().catch(() => "");
        console.error(`FREEMODEL returned non-JSON (${response.status}, ${ct}): ${text.slice(0, 200)}`);
      }
    } catch (e) {
      console.error("FREEMODEL fetch error:", e);
    }
  }

  let lastError: string | null = null;

  for (const model of REVIEW_MODELS) {
    try {
      const response = await fetch("https://agentrouter.org/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AGENTROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          temperature: 0.4,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const ct = response.headers.get("content-type") || "";
      if (response.ok && ct.includes("application/json")) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "";
      }

      const body = await response.text().catch(() => "");
      const msg = body.toLowerCase();
      console.error(`AgentRouter model "${model}" returned (${response.status}, ${ct}): ${body.slice(0, 200)}`);

      if (response.status === 429 || msg.includes("quota") || msg.includes("rate limit") || msg.includes("insufficient")) {
        throw new Error("AI review service is temporarily unavailable due to high demand. Please try again in a few minutes.");
      }
      if (response.status === 403 && model === REVIEW_MODELS[REVIEW_MODELS.length - 1]) {
        throw new Error(`AgentRouter authentication failed (HTTP ${response.status}). Please verify your API key at https://agentrouter.org/console/token and ensure it has credits. Response: ${body.slice(0, 150)}`);
      }
      lastError = `Model "${model}" failed (${response.status})`;
    } catch (e) {
      if (e instanceof Error && (e.message.includes("quota") || e.message.includes("rate limit") || e.message.includes("insufficient") || e.message.includes("authentication failed"))) {
        throw e;
      }
      console.error(`AgentRouter model "${model}" error:`, e);
      lastError = `Model "${model}" threw: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  throw new Error(`All review models failed. Last error: ${lastError}`);
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
