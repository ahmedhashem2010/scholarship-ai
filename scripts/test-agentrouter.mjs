const API_KEY = process.env.AGENTROUTER_API_KEY || "sk-IhDurXGRcXmtwNQ416fvQUWAXewIIkKk9b6MafxsCcIVXX86";

const endpoints = [
  { url: "https://agentrouter.org/v1/chat/completions", name: "agentrouter.org" },
  { url: "https://api.agentrouter.ai/v1/messages", name: "api.agentrouter.ai (messages)" },
  { url: "https://api.agentrouter.ai/v1/chat/completions", name: "api.agentrouter.ai (chat)" },
];

const models = [
  "gpt-4o-mini",
  "claude-sonnet-4-20250514",
  "claude-3-5-haiku-20241022",
];

async function testEndpoint(url, name, model) {
  try {
    const body = url.includes("/messages")
      ? { model, max_tokens: 100, messages: [{ role: "user", content: "Say hello" }] }
      : { model, max_tokens: 100, messages: [{ role: "user", content: "Say hello" }] };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        Originator: "codex_cli_rs",
        "User-Agent": "codex_cli_rs/0.101.0",
        Version: "0.101.0",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    return {
      endpoint: name,
      model,
      status: response.status,
      ok: response.ok,
      body: typeof parsed === "object" ? JSON.stringify(parsed).slice(0, 300) : String(parsed).slice(0, 300),
    };
  } catch (err) {
    return { endpoint: name, model, status: "ERROR", ok: false, body: err.message };
  }
}

async function main() {
  console.log("=== AgentRouter API Diagnostic ===\n");

  for (const ep of endpoints) {
    for (const model of models) {
      const result = await testEndpoint(ep.url, ep.name, model);
      console.log(`[${result.ok ? "OK" : "FAIL"}] ${result.endpoint} | model: ${result.model}`);
      console.log(`     Status: ${result.status}`);
      console.log(`     Body: ${result.body}`);
      console.log();
    }
  }
}

main().catch(console.error);
