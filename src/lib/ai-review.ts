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

const REVIEW_PROMPT = `You are a scholarship reviewer evaluating HIGH SCHOOL applications (grades 9-12, ages 14-18) from MENA students.

**REFERENCE STANDARD FOR 9-10/10:**
This is what excellent looks like for a high school student:
- Yale University Fellowship acceptance (international recognition)
- Built a functional biomedical research project (Dopawave) with measurable scientific results
- Conducted research at certified university labs (Horus University, Mansoura University)
- Published/submitted research to competitive forums (UGRF)
- Multiple math olympiad participations and national awards
- Led major community initiatives (organized NASA hackathon with 100+ participants, secured sponsorships from major brands)
- Extensive volunteer leadership (led 1500+ volunteers, won awards, created measurable impact)
- Graphic design/content creation work with quantified results (42+ projects, 76+ episodes, 28% engagement increase)
- Business experience with P&L management and measurable outcomes (15% cost reduction, 97% forecasting accuracy, 89% efficiency gains)
- Strong personal statement explaining mission and impact

**YOUR JOB: Rate all other applications by comparing to this standard.**

SCORING GUIDE:

**9-10/10 (Tier 1 - Exceptional):**
Match this standard or close to it:
- International fellowship/major award + strong project OR
- Research project at university labs + multiple achievements OR
- Led major initiatives (100+ people) + competition wins + clear quantified impact

**7-8/10 (Tier 2 - Strong):**
Has 2-3 of these:
- Good technical/research project
- Led community initiatives with measurable impact
- Multiple competition wins
- Work experience with quantified results
- Clear leadership across multiple areas

**5-6/10 (Tier 3 - Average):**
Has some achievements but lacks depth:
- Generic volunteer work without numbers
- One award or project
- Good academics only
- Some experience but unclear impact

**0-4/10 (Tier 0 - Minimal):**
No significant achievements or very unclear

---

Score THREE dimensions (0-10 each):

1. **OVERALL QUALITY:** How does this compare to the reference standard?
2. **ATS COMPATIBILITY:** Keywords (leadership, innovation, research, impact, STEM), quantification, organization
3. **COMPETITIVENESS:** Would this applicant stand out in a group of similar students?

Return ONLY JSON:
{
  "overallQuality": {"score": <0-10>, "strengthsSummary": "<strengths>", "weaknessesSummary": "<weaknesses if any>"},
  "atsCompatibility": {"score": <0-10>, "missingKeywords": [], "improvements": []},
  "competitiveness": {"score": <0-10>, "uniqueStrengths": "<what stands out>", "differentiation": "<how to improve>"},
  "topImprovements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "quickWins": ["<quickwin1>", "<quickwin2>"],
  "overallAssessment": "<honest summary with encouraging tone>"
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
