export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api-auth";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are a warm, encouraging scholarship application coach专门 for Middle Eastern students applying to international scholarships.

Your tone: supportive, specific, actionable, and culturally aware. Never write documents FOR the student, but guide them on HOW to write effectively.

Rules:
- Be concise (2-4 sentences per point, max 3 points)
- Use examples relevant to Arab/Middle Eastern students
- If you don't know something specific about a scholarship, say so honestly
- Encourage progress and celebrate effort
- Never share personal information about the user
- When discussing documents, refer to the specific type they mention

When given user profile context, tailor your advice to their specific:
- Country
- Education level and major
- English proficiency
- Target scholarships
- Current application progress`;

const FREEMODEL_ENDPOINT = "https://api.freemodel.dev/v1/chat/completions";
const FREEMODEL_KEY = process.env.FREEMODEL_API_KEY;

const AGENTROUTER_MODELS = [
  "gpt-4o-mini",
  "claude-sonnet-4-20250514",
  "claude-haiku-3-5-20241022",
  "gpt-4o",
  "deepseek-chat",
  "gemini-2.0-flash",
  "claude-3-5-haiku-20241022",
];

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
        max_tokens: 1024,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
  }

  let lastError: string | null = null;

  for (const model of AGENTROUTER_MODELS) {
    const response = await fetch("https://agentrouter.org/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AGENTROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    const body = await response.text().catch(() => "");
    if (response.status === 429 || body.toLowerCase().includes("quota") || body.toLowerCase().includes("rate limit") || body.toLowerCase().includes("insufficient")) {
      throw new Error("AI service temporarily unavailable. Try again later.");
    }
    if (response.status === 403 && model === AGENTROUTER_MODELS[AGENTROUTER_MODELS.length - 1]) {
      throw new Error(`Your API key doesn't have access to any available model. Check your plan at https://agentrouter.org/console/token`);
    }
    lastError = `Model "${model}" failed (${response.status})`;
  }

  throw new Error(`All AI providers failed. Last error: ${lastError}`);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const [profile, applications, scholarships] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: user.id } }),
      prisma.application.findMany({
        where: { userId: user.id },
        include: { scholarship: true, documents: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.scholarship.findMany({ take: 20 }),
    ]);

    const contextParts: string[] = [];

    if (profile) {
      contextParts.push(
        `User Profile:
- Display Name: ${profile.displayName}
- Date of Birth: ${profile.dateOfBirth?.toISOString().split("T")[0] ?? "Not set"}
- Country: ${profile.country}
- Education Level: ${profile.educationLevel}
- Major: ${profile.major ?? "Not specified"}
- Target Degree: ${profile.targetDegree}
- English Level: ${profile.englishLevel}
- Budget: ${profile.budget ? profile.budget : "Not specified"}`
      );
    }

    if (applications.length > 0) {
      const appSummary = applications.map((a) => {
        const readyDocs = a.documents.filter((d) => d.status === "READY").length;
        return `- ${a.scholarship.nameEn} (${a.scholarship.country}): ${a.status}, ${a.progress}% complete, ${readyDocs}/${a.documents.length} documents ready`;
      }).join("\n");
      contextParts.push(`Current Applications:\n${appSummary}`);
    }

    if (scholarships.length > 0) {
      const schSummary = scholarships.map((s) =>
        `- ${s.nameEn} (${s.country}): ${s.degree}, competition: ${s.competitionLevel}, deadline: ${s.deadline ? s.deadline.toISOString().split("T")[0] : "N/A"}`
      ).slice(0, 5).join("\n");
      contextParts.push(`Available Scholarships (top ${Math.min(5, scholarships.length)}):\n${schSummary}`);
    }

    const userContext = contextParts.length > 0
      ? `\n\nHere is the user's current context:\n${contextParts.join("\n\n")}`
      : "";

    const fullPrompt = `${SYSTEM_PROMPT}${userContext}\n\nThe user asks: ${message}\n\nProvide a helpful, encouraging response.`;

    let reply: string;
    try {
      reply = await callAI(fullPrompt);
    } catch (apiErr) {
      const msg = apiErr instanceof Error ? apiErr.message.toLowerCase() : "";
      if (msg.includes("unavailable")) {
        return NextResponse.json({ success: false, error: "AI service temporarily unavailable. Try again later." }, { status: 503 });
      }
      throw apiErr;
    }

    return NextResponse.json({
      success: true,
      data: { reply },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("Chat API error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
