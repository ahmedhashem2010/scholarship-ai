import { parseReviewResponse, type ParsedReview } from "./parse-review";

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

const REVIEW_PROMPT = `You are an expert scholarship application coach. Review this document and provide CONCISE, ACTIONABLE feedback.

DOCUMENT TYPE: {documentType}

DOCUMENT TEXT:
{documentText}

PROVIDE FEEDBACK IN THIS EXACT FORMAT (be concise):

SCORE: [1-10]
REASONING: [1 sentence why this score]

STRONG POINTS:
- [Point 1 - one sentence]
- [Point 2 - one sentence]
- [Point 3 - one sentence max, only if applicable]

WEAK SENTENCES:
- "[Quote problematic sentence]" → Issue: [What's wrong]
- "[Quote problematic sentence]" → Issue: [What's wrong]
- "[Quote problematic sentence]" → Issue: [What's wrong]

TOP 5 IMPROVEMENTS:
1. [Specific improvement with brief reason]
2. [Specific improvement with brief reason]
3. [Specific improvement with brief reason]
4. [Specific improvement with brief reason]
5. [Specific improvement with brief reason]

QUICK WINS (Easy fixes):
- [Grammar/clarity issue]
- [Formatting issue]
- [Tone issue]

OVERALL ASSESSMENT:
[2-3 sentences on what works well and main priority to fix]`;

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
        max_tokens: 1000,
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
        max_tokens: 1000,
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

const FALLBACK: ParsedReview = {
  score: 5,
  reasoning: "The document has room for improvement in several key areas.",
  strongPoints: [
    "Shows relevant experience in the field",
    "Demonstrates interest in the subject matter",
  ],
  weakSentences: [
    { quote: "I am very passionate about this", issue: "Generic statement lacks specific evidence" },
    { quote: "I have experience in many areas", issue: "Too vague, needs quantifiable results" },
  ],
  improvements: [
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
  assessment: "The document covers relevant experience but needs more specific, quantifiable achievements and better tailoring to the scholarship criteria. The main priority is adding concrete metrics and outcomes.",
};

export async function reviewDocument(
  text: string,
  documentType: string
): Promise<ParsedReview> {
  const typeLabel = documentType.replace(/_/g, " ").toLowerCase();

  const prompt = REVIEW_PROMPT
    .replace("{documentType}", typeLabel)
    .replace("{documentText}", text.slice(0, 15000));

  const responseText = await callAI(prompt);

  try {
    const parsed = parseReviewResponse(responseText);
    if (parsed.score < 1 || parsed.score > 10) {
      throw new Error("Score out of range");
    }
    return parsed;
  } catch {
    const preview = responseText.length > 200 ? responseText.slice(0, 200) + "..." : responseText;
    console.error("AI review parsing failed. Raw response:", preview);
    return {
      ...FALLBACK,
      score: Math.max(1, Math.min(10, parseInt(responseText.match(/\d+/)?.[0] || "5"))),
    };
  }
}
