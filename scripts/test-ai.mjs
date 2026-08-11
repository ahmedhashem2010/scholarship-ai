import "./_env.mjs";

/**
 * Checks whether the AgentRouter AI provider is actually reachable.
 *
 *   node scripts/test-ai.mjs
 *
 * AgentRouter is the ONLY AI provider in SmartScholar — there is no fallback
 * chain, so this script tells you whether document reviews can run at all.
 *
 * Reads nothing from the database and writes nothing anywhere.
 */

const KEY = process.env.AGENTROUTER_API_KEY || "";
const MODEL = process.env.AGENTROUTER_MODEL || "claude-sonnet-4-20250514";
const URL = process.env.AGENTROUTER_ENDPOINT || "https://agentrouter.org/v1/chat/completions";

// AgentRouter fingerprints its clients and answers unrecognised ones with
// HTTP 401 "unauthorized client detected" — indistinguishable from a bad key.
const CLIENT_HEADERS = {
  Originator: process.env.AGENTROUTER_ORIGINATOR || "codex_cli_rs",
  "User-Agent": process.env.AGENTROUTER_USER_AGENT || "codex_cli_rs/0.101.0",
  Version: process.env.AGENTROUTER_VERSION || "0.101.0",
};

function ok(m) { console.log(`  \x1b[32m✓\x1b[0m ${m}`); }
function bad(m) { console.log(`  \x1b[31m✗\x1b[0m ${m}`); }
function info(m) { console.log(`    ${m}`); }

async function main() {
  console.log("AgentRouter (the only AI provider)");
  if (!KEY) {
    bad("AGENTROUTER_API_KEY not set in .env");
    info("Get a key at https://agentrouter.org and add to .env:");
    info("  AGENTROUTER_API_KEY=sk-...");
    process.exitCode = 1;
    return;
  }
  info(`model: ${MODEL}`);

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
        ...CLIENT_HEADERS,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 50,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      bad(`HTTP ${res.status}`);
      if (res.status === 401 || res.status === 403) {
        info("Key rejected or client not recognised. Copy the full key from");
        info("https://agentrouter.org/console/token and make sure it has credits.");
      } else if (res.status === 429) {
        info("Rate limited — the key works; wait a moment and re-run.");
      } else if (body.includes("unauthorized_client")) {
        info("Client rejected (not the key). The app sends the required headers.");
      } else if (body.includes("\u65e0\u53ef\u7528\u6e20\u9053")) {
        info("Your AgentRouter account group has no channel for this model.");
        info(`Try setting AGENTROUTER_MODEL in .env to a model your group serves.`);
      } else {
        info(body.slice(0, 300));
      }
      process.exitCode = 1;
      return;
    }
    const text = JSON.parse(body)?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      bad("200 OK but empty response");
      process.exitCode = 1;
      return;
    }
    ok("working");
    info(`sample output: ${text.trim().slice(0, 120)}`);
  } catch (e) {
    bad(`network error: ${e.message}`);
    process.exitCode = 1;
  }
}

main();
