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

**IMPORTANT: Grade on high school standards, not university standards.**

Score on THREE dimensions (0-10 each):

1. **OVERALL QUALITY (0-10):** For a high school applicant
   - 9-10: Exceptional. Clear goals, compelling story, significant project/achievement
   - 7-8: Strong. Good articulation, relevant experience, demonstrates initiative
   - 5-6: Average. Basic information, some good points, needs more specificity
   - 3-4: Below average. Unclear, lacks detail, weak evidence
   - 0-2: Poor. Incoherent or incomplete

2. **ATS COMPATIBILITY (0-10):** For high school applications
   - Check: Scholarship keywords (leadership, innovation, STEM, social impact, community)
   - Check: Quantified results where possible (students helped, projects built, teams led)
   - Check: Clear dates, organization names, specific outcomes
   - 9-10: Optimized. All keywords, quantified, well-organized
   - 7-8: Good. Most keywords present, good structure
   - 5-6: Adequate. Basic structure, some improvements needed
   - 0-4: Poor. Disorganized, vague, missing details

3. **COMPETITIVENESS (0-10):** High school applicants in MENA
   - 9-10: Top applicant. Technical project (app/AI/coding) OR exceptional leadership + impact
   - 7-8: Competitive. Good achievements, clear value proposition, stands out
   - 5-6: Average. Typical high school profile, needs differentiation
   - 3-4: Below average. Lacks standout projects or leadership
   - 0-2: Weak. Generic profile

Respond ONLY as valid JSON (no markdown, no explanations):
{
  "overallQuality": {
    "score": <number 0-10>,
    "strengthsSummary": "<1-2 key strengths>",
    "weaknessesSummary": "<1-2 key weaknesses>"
  },
  "atsCompatibility": {
    "score": <number 0-10>,
    "missingKeywords": ["keyword1", "keyword2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "competitiveness": {
    "score": <number 0-10>,
    "uniqueStrengths": "<What makes this applicant stand out>",
    "differentiation": "<How to compete better>"
  },
  "topImprovements": [
    "<Specific improvement 1>",
    "<Specific improvement 2>",
    "<Specific improvement 3>"
  ],
  "quickWins": [
    "<Easy fix with high impact 1>",
    "<Easy fix with high impact 2>"
  ],
  "overallAssessment": "<2-3 sentence summary with concrete advice>"
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
