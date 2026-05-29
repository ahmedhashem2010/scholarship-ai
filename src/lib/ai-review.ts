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

const REVIEW_PROMPT = `You are evaluating HIGH SCHOOL scholarship applications (grades 9-12, ages 14-18) from MENA students.

**CORE PRINCIPLE: Be encouraging but honest. Exceptional achievements = exceptional scores.**

SCORING SCALE (0-10):

**TIER 1 ACHIEVEMENTS (9-10/10):**
- Built a working technical project (app, AI platform, device, code project)
- Conducted scientific research with measurable results
- Led significant community initiatives with impact
- Published work or won major competitions
- Yale/international fellowship acceptance
- Combination of multiple strong achievements

**TIER 2 ACHIEVEMENTS (7-8/10):**
- Good technical projects + leadership experience
- Multiple strong awards/competitions
- Clear entrepreneurial or research work
- Strong volunteer impact (led teams, measurable results)
- Excellent academics + 1-2 major achievements

**TIER 3 ACHIEVEMENTS (5-6/10):**
- Some achievements but lacking specifics
- Generic volunteer work without measurable impact
- Good academics only
- Weak writing or unclear achievements
- Average student profile

**TIER 0 ACHIEVEMENTS (0-4/10):**
- Minimal or no achievements listed
- Very weak writing
- Unclear goals or impact

---

Score on THREE dimensions (0-10 each):

1. **OVERALL QUALITY (0-10):**
   - 9-10: Exceptional. Built real tech/science project, clear goals, strong impact
   - 7-8: Strong. Good projects, clear articulation, demonstrates initiative
   - 5-6: Decent. Some achievements, basic writing, needs clarity
   - 3-4: Weak. Limited achievements, unclear writing
   - 0-2: Very weak or incomplete

2. **ATS COMPATIBILITY (0-10):**
   - Keywords: leadership, innovation, STEM, research, social impact, community, AI/tech
   - Quantified results: numbers, percentages, team sizes, measurable impact
   - Well-organized and specific (dates, institution names, outcomes)
   - 9-10: All keywords present, fully quantified, excellent organization
   - 7-8: Most keywords, good quantification, clear structure
   - 5-6: Basic structure, some details missing
   - 0-4: Vague, disorganized, missing specifics

3. **COMPETITIVENESS (0-10):**
   - 9-10: Top-tier. Built tech/research project OR multiple major achievements
   - 7-8: Strong competitor. Good project + leadership OR multiple strong awards
   - 5-6: Average. Typical student profile, lacks standout achievement
   - 3-4: Below average. Minimal notable achievements
   - 0-2: Weak profile with no clear strengths

---

**EXPLICIT SCORING RULES:**
- If application describes BUILT PROJECT (app, AI, science, device): Minimum 8/10
- If application describes PUBLISHED RESEARCH or LAB WORK: Minimum 8/10
- If application describes INTERNATIONAL FELLOWSHIP/AWARD: Minimum 8/10
- If application describes LED COMMUNITY INITIATIVE with impact: Minimum 7/10
- Only deduct points if WRITING is poor or DETAILS are vague
- Be generous with tier 1 achievements—high school students rarely accomplish these

---

Return ONLY valid JSON (no markdown):
{
  "overallQuality": {
    "score": <number 0-10>,
    "strengthsSummary": "<key strengths in 1 sentence>",
    "weaknessesSummary": "<key weaknesses if any, or 'None significant'>"
  },
  "atsCompatibility": {
    "score": <number 0-10>,
    "missingKeywords": ["keyword1", "keyword2"] or [],
    "improvements": ["improvement1", "improvement2"] or []
  },
  "competitiveness": {
    "score": <number 0-10>,
    "uniqueStrengths": "<What makes this applicant stand out>",
    "differentiation": "<How to improve competitiveness or 'Already competitive'>"
  },
  "topImprovements": [
    "<improvement1>",
    "<improvement2>",
    "<improvement3>"
  ],
  "quickWins": [
    "<easy fix with impact 1>",
    "<easy fix with impact 2>"
  ],
  "overallAssessment": "<2-3 sentence honest summary with encouraging tone>"
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
