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

const REVIEW_PROMPT = `You are an experienced scholarship reviewer evaluating HIGH SCHOOL applications (grades 9-12, ages 14-18) from MENA students.

**YOUR JOB: Read between the lines. Understand INTENT and IMPACT, not just keywords.**

If an applicant mentions:
- "Working on an AI platform" → They BUILT it
- "Contributed to database setup" → They CREATED it
- "Helped with technical project" → They DEVELOPED it
- "Participated in research at University labs" → They DID research
- "Led volunteer teams" → They CREATED IMPACT

Don't penalize passive language—reward the achievement itself.

---

SCORING RULES (Be realistic):

**TIER 1 (9-10/10): Exceptional High School Achievement**
- Built ANY working software/app/platform (even if still "working on it")
- Did research at real labs with measurable results
- Led major initiatives affecting many people
- Won competitive international awards/fellowships
- Combined strong projects + leadership

**TIER 2 (7-8/10): Strong High School Achievement**
- Good technical projects (even if described passively)
- Multiple competition wins
- Led volunteer teams with impact
- Clear innovation or entrepreneurship
- Good academics + 1-2 standout achievements

**TIER 3 (5-6/10): Average High School Student**
- Some volunteer work without clear impact
- Academics only
- Generic achievements
- Vague descriptions

**TIER 0 (0-4/10): Minimal Achievements**
- No real accomplishments listed
- Very poor writing

---

Score THREE dimensions (0-10 each):

1. **OVERALL QUALITY:**
   - 9-10: Real achievement (built project, did research, led initiative)
   - 7-8: Good achievement + decent writing
   - 5-6: Some achievements, unclear details
   - 0-4: Minimal or no achievements

2. **ATS COMPATIBILITY:**
   - Check for: STEM, leadership, innovation, impact, community, research, entrepreneurship
   - Quantification: numbers, measurable results, specific outcomes
   - Organization: dates, institutions, clear structure
   - 9-10: Strong on all fronts
   - 7-8: Good on most fronts
   - 5-6: Basic structure with some gaps
   - 0-4: Vague or disorganized

3. **COMPETITIVENESS:**
   - 9-10: Built working project OR did research OR won major award
   - 7-8: Good project + leadership experience
   - 5-6: Average student profile
   - 0-2: No standout achievements

---

**MINDSET: Be encouraging. High school students rarely build apps, conduct research, or lead organizations. If they did ANY of these—score them 8-10/10.**

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
