const FREEMODEL_ENDPOINT = "https://api.freemodel.dev/v1/chat/completions";
const FREEMODEL_KEY = process.env.FREEMODEL_API_KEY;

const REVIEW_MODELS = [
  "gpt-4o-mini",
  "claude-sonnet-4-20250514",
  "claude-haiku-3-5-20241022",
  "gpt-4o",
  "deepseek-chat",
  "gemini-2.0-flash",
  "claude-3-5-haiku-20241022",
];

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

const REVIEW_PROMPT = `You are evaluating scholarship applications from HIGH SCHOOL students (Grade 9-12, ages 14-18) in the MENA region.

**CRITICAL: Be realistic about high school achievements. Technical projects, leadership roles, and volunteer work are VALUABLE.**

Score on THREE dimensions (0-10 each):

1. **OVERALL QUALITY (0-10):**
   - 9-10: Exceptional. Built real projects (apps, code, platforms) OR strong leadership + measurable impact
   - 7-8: Strong. Good projects, clear goals, relevant experience, well-written
   - 5-6: Decent. Some achievements, basic writing, needs more detail
   - 3-4: Weak. Limited achievements, unclear writing
   - 0-2: Very weak. No achievements listed

2. **ATS COMPATIBILITY (0-10):**
   - Check for: leadership, STEM, innovation, community service, projects, impact
   - Check for: specific numbers (students helped, code lines, team size, etc.)
   - 9-10: All keywords present, quantified, well-organized
   - 7-8: Most keywords, good structure
   - 5-6: Basic structure, missing some details
   - 0-4: Disorganized or vague

3. **COMPETITIVENESS (0-10):**
   - 9-10: Built technical project (AI, app, platform) OR exceptional leadership
   - 7-8: Good project + leadership experience
   - 5-6: Average student profile
   - 0-4: No standout achievements

Return ONLY valid JSON (no markdown):
{
  "overallQuality": {"score": <0-10>, "strengthsSummary": "<strengths>", "weaknessesSummary": "<weaknesses>"},
  "atsCompatibility": {"score": <0-10>, "missingKeywords": [], "improvements": []},
  "competitiveness": {"score": <0-10>, "uniqueStrengths": "<what stands out>", "differentiation": "<how to improve>"},
  "topImprovements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "quickWins": ["<quickwin1>", "<quickwin2>"],
  "overallAssessment": "<summary>"
}`;

async function callAI(prompt: string): Promise<string> {
  if (FREEMODEL_KEY) {
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

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
  }

  let lastError: string | null = null;

  for (const model of REVIEW_MODELS) {
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

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    const body = await response.text().catch(() => "");
    const msg = body.toLowerCase();
    if (response.status === 429 || msg.includes("quota") || msg.includes("rate limit") || msg.includes("insufficient")) {
      throw new Error("AI review service is temporarily unavailable due to high demand. Please try again in a few minutes.");
    }
    if (response.status === 403 && model === REVIEW_MODELS[REVIEW_MODELS.length - 1]) {
      throw new Error(`AgentRouter authentication failed (HTTP ${response.status}). Please verify your API key at https://agentrouter.org/console/token and ensure it has credits. Response: ${body.slice(0, 150)}`);
    }
    lastError = `Model "${model}" failed (${response.status})`;
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

  const responseText = await callAI(prompt);

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
