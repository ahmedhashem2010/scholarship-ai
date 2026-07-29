import "./_env.mjs";

/**
 * Checks whether an AI provider is actually reachable.
 *
 *   node scripts/test-ai.mjs
 *
 * Run this FIRST, before translate-names or a real document review. Both of
 * those cost you time (and a credit) to discover the same failure.
 *
 * Reads nothing from the database and writes nothing anywhere.
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const AGENTROUTER_KEY = process.env.AGENTROUTER_API_KEY || "";
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = process.env.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";

function ok(m) { console.log(`  \x1b[32m✓\x1b[0m ${m}`); }
function bad(m) { console.log(`  \x1b[31m✗\x1b[0m ${m}`); }
function info(m) { console.log(`    ${m}`); }

async function testGroq() {
  console.log("\nGroq (primary)");
  if (!GROQ_KEY) {
    bad("GROQ_API_KEY not set in .env");
    info("Free key, no credit card: https://console.groq.com/keys");
    info("Then add to .env:  GROQ_API_KEY=gsk_...");
    return false;
  }
  info(`model: ${GROQ_MODEL}`);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 200,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          // Must contain the literal word "json" or Groq 400s on json_object mode.
          content: 'Translate to Arabic. Reply with ONLY a JSON object {"names":["..."]} for: ["Chevening Scholarship"]',
        }],
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      bad(`HTTP ${res.status}`);
      if (res.status === 401) info("Key rejected — check it was copied whole (starts gsk_).");
      else if (res.status === 404) {
        info(`Model "${GROQ_MODEL}" not found — it may have been retired.`);
        info("See https://console.groq.com/docs/models, then set GROQ_MODEL in .env");
      } else if (res.status === 429) info("Rate limited — the key works; wait a moment.");
      info(body.slice(0, 300));
      return res.status === 429;
    }
    const text = JSON.parse(body)?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) { bad("200 OK but empty response"); return false; }
    ok("working");
    info(`sample output: ${text.trim().slice(0, 120)}`);
    return true;
  } catch (e) {
    bad(`network error: ${e.message}`);
    return false;
  }
}

async function testGemini() {
  console.log("\nGoogle Gemini (fallback)");
  if (!GEMINI_KEY) {
    bad("GEMINI_API_KEY not set in .env");
    info("Get a free key (no card needed): https://aistudio.google.com/apikey");
    info('Then add to .env:  GEMINI_API_KEY=your_key_here');
    return false;
  }
  info(`model: ${GEMINI_MODEL}`);
  if (!GEMINI_KEY.startsWith("AIza")) {
    info(`\x1b[33mnote:\x1b[0m key starts "${GEMINI_KEY.slice(0, 3)}…" — Generative Language`);
    info('      API keys normally start "AIza". This may be a different credential type.');
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Translate to Arabic. Reply with ONLY a JSON array of one string: ["Chevening Scholarship"]' }],
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 200, responseMimeType: "application/json" },
        }),
      }
    );

    const body = await res.text();
    if (!res.ok) {
      bad(`HTTP ${res.status}`);
      if (res.status === 400 && body.includes("API_KEY_INVALID")) {
        info("The key is malformed or revoked — generate a new one.");
      } else if (res.status === 403) {
        info("Key rejected. Check the Generative Language API is enabled for the project.");
      } else if (res.status === 404) {
        info(`Model "${GEMINI_MODEL}" not found. Try GEMINI_MODEL=gemini-2.0-flash`);
      } else if (res.status === 429) {
        // A 429 on a FIRST request is not "you used up your quota" — it means
        // the quota is zero. Google says which limit was hit in the body, so
        // print it rather than guessing.
        let detail = null;
        try {
          const err = JSON.parse(body)?.error;
          detail = err?.message ?? null;
          const violations = err?.details?.flatMap((d) => d?.violations ?? []) ?? [];
          for (const v of violations) {
            info(`quota: ${v.quotaMetric ?? v.quotaId ?? "?"} limit=${v.quotaValue ?? "?"}`);
          }
        } catch { /* fall through to raw body */ }

        if (detail) info(detail);
        info("");
        info("A 429 on the very first call means this key has NO quota, not that");
        info("you've exhausted it. Usual causes:");
        info("  1. It isn't a Generative Language API key. Real ones start with");
        info('     "AIza". Create one at https://aistudio.google.com/apikey via');
        info('     the "Create API key" button — not the Cloud console.');
        info("  2. The Generative Language API isn't enabled on the project.");
        info("  3. Free tier unavailable in your region, or billing is required.");
        return false;
      }
      info(body.slice(0, 400));
      return false;
    }

    const parts = JSON.parse(body)?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p?.text ?? "").join("") : "";
    if (!text.trim()) {
      bad("200 OK but empty response (prompt may have been blocked)");
      return false;
    }
    ok("working");
    info(`sample output: ${text.trim().slice(0, 120)}`);
    return true;
  } catch (e) {
    bad(`network error: ${e.message}`);
    return false;
  }
}

async function testAgentRouter() {
  console.log("\nAgentRouter (fallback)");
  if (!AGENTROUTER_KEY) {
    info("AGENTROUTER_API_KEY not set — skipping");
    return false;
  }
  try {
    const res = await fetch("https://agentrouter.org/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AGENTROUTER_KEY}`,
        Originator: process.env.AGENTROUTER_ORIGINATOR || "codex_cli_rs",
        "User-Agent": process.env.AGENTROUTER_USER_AGENT || "codex_cli_rs/0.101.0",
        Version: process.env.AGENTROUTER_VERSION || "0.101.0",
      },
      body: JSON.stringify({
        model: process.env.TRANSLATE_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 50,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      bad(`HTTP ${res.status}`);
      if (body.includes("unauthorized_client")) {
        info("Client rejected (not the key). The app now sends the required headers.");
      } else if (body.includes("无可用渠道")) {
        info("Your account group has no provider channel for this model.");
        info("This is an AgentRouter account issue — Gemini above is the way around it.");
      } else {
        info(body.slice(0, 200));
      }
      return false;
    }
    ok("working");
    return true;
  } catch (e) {
    bad(`network error: ${e.message}`);
    return false;
  }
}

const results = [await testGroq(), await testGemini(), await testAgentRouter()];

console.log("\n────────────────────────────────────────────");
if (results.some(Boolean)) {
  console.log("At least one provider works — AI reviews and translation will run.\n");
} else {
  console.log("No working AI provider.");
  console.log("Document review is your paid feature, so this blocks launch.");
  console.log("Fastest fix: free Groq key (no card) at https://console.groq.com/keys\n");
  process.exitCode = 1;
}
