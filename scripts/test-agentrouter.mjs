import "./_env.mjs";

/**
 * AgentRouter API diagnostic — probes the configured AgentRouter gateway with
 * the Anthropic Messages protocol. The SmartScholar app no longer calls
 * AgentRouter directly: the Railway review service owns the AgentRouter key
 * and is the only caller. Run this script from the Railway service's
 * environment (not SmartScholar's) to debug its upstream.
 *
 *   node scripts/test-agentrouter.mjs
 *
 * Claude models are served over POST /v1/messages with an `x-api-key` header
 * and an `anthropic-version` header — never a Bearer `Authorization` header,
 * which AgentRouter answers with HTTP 401.
 *
 * Tries a small set of model IDs so you can see which ones your AgentRouter
 * account group actually serves, and reports the live status for each.
 *
 * Reads nothing from the database and writes nothing anywhere.
 */

const KEY = process.env.AGENTROUTER_API_KEY || "";
const DEFAULT_MODEL = process.env.AGENTROUTER_MODEL || "claude-opus-4-8";
const URL = process.env.AGENTROUTER_ENDPOINT || "https://agentrouter.org/v1/messages";

// AgentRouter fingerprints its clients and answers unrecognised ones with
// HTTP 401 "unauthorized client detected" — indistinguishable from a bad key.
const CLIENT_HEADERS = {
  Originator: process.env.AGENTROUTER_ORIGINATOR || "codex_cli_rs",
  "User-Agent": process.env.AGENTROUTER_USER_AGENT || "codex_cli_rs/0.101.0",
  Version: process.env.AGENTROUTER_VERSION || "0.101.0",
};

// The configured model first, then common Claude IDs the group might serve.
const models = [
  DEFAULT_MODEL,
  "claude-opus-4-8",
  "claude-sonnet-4-20250514",
  "claude-3-5-haiku-20241022",
].filter((m, i, arr) => arr.indexOf(m) === i);

function ok(m) { console.log(`  \x1b[32m✓\x1b[0m ${m}`); }
function bad(m) { console.log(`  \x1b[31m✗\x1b[0m ${m}`); }
function info(m) { console.log(`    ${m}`); }

// Parse by body shape, not content-type — the gateway serves its JSON as
// text/plain. Handle the Anthropic Messages shape and the OpenAI-compatible
// one so a changed upstream can't hide behind a 200.
function responseText(parsed) {
  return (
    (parsed?.content?.map((c) => c?.text ?? "").join("") ?? "") ||
    (parsed?.choices?.[0]?.message?.content ?? "")
  );
}

// The 503 body comes back with HTML tags mixed in; strip to a single line.
function oneLine(s) {
  return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

async function testModel(model) {
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        ...CLIENT_HEADERS,
      },
      body: JSON.stringify({
        model,
        max_tokens: 50,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });

    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    if (!response.ok) {
      let hint = "";
      if (response.status === 401 || response.status === 403) {
        hint = "key rejected or client not recognised";
      } else if (response.status === 429) {
        hint = "rate limited — the key works; wait and re-run";
      } else if (typeof parsed === "object" && String(text).includes("unauthorized_client")) {
        hint = "client rejected (not the key)";
      } else if (typeof parsed === "object" && String(text).includes("\u65e0\u53ef\u7528\u6e20\u9053")) {
        hint = "no channel for this model in your AgentRouter group";
      } else {
        hint = typeof parsed === "object" ? JSON.stringify(parsed).slice(0, 200) : oneLine(text);
      }
      return { model, status: response.status, ok: false, hint };
    }

    const out = responseText(parsed);
    if (!out.trim()) return { model, status: response.status, ok: false, hint: "200 OK but empty response" };
    return { model, status: response.status, ok: true, hint: out.trim().slice(0, 120) };
  } catch (err) {
    return { model, status: "ERROR", ok: false, hint: err.message };
  }
}

async function main() {
  console.log("AgentRouter diagnostic (Anthropic Messages protocol)\n");

  if (!KEY) {
    bad("AGENTROUTER_API_KEY not set in .env");
    info("Get a key at https://agentrouter.org and add to .env:");
    info("  AGENTROUTER_API_KEY=sk-...");
    process.exitCode = 1;
    return;
  }

  info(`endpoint: ${URL}`);
  info(`models to try: ${models.join(", ")}\n`);

  for (const model of models) {
    const result = await testModel(model);
    if (result.ok) ok(`${model} — HTTP ${result.status} — "${result.hint}"`);
    else bad(`${model} — ${result.status} — ${result.hint}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
