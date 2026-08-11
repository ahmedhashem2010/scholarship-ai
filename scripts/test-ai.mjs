import "./_env.mjs";

/**
 * Checks whether the AI review service on Railway is actually reachable.
 *
 *   node scripts/test-ai.mjs
 *
 * SmartScholar never calls AgentRouter directly — it POSTs { documentType,
 * text } to AI_REVIEW_SERVICE_URL and expects a ReviewScore JSON back. That
 * service (on Railway) is the only component that holds the AgentRouter key,
 * so this script tells you whether document reviews can run at all.
 *
 * Reads nothing from the database and writes nothing anywhere.
 */

const URL = process.env.AI_REVIEW_SERVICE_URL || "";

function ok(m) { console.log(`  \x1b[32m✓\x1b[0m ${m}`); }
function bad(m) { console.log(`  \x1b[31m✗\x1b[0m ${m}`); }
function info(m) { console.log(`    ${m}`); }

function validScore(s) {
  return (
    s &&
    typeof s === "object" &&
    typeof s.overallQuality?.score === "number" &&
    typeof s.atsCompatibility?.score === "number" &&
    typeof s.competitiveness?.score === "number"
  );
}

async function main() {
  console.log("AI review service (Railway — the only AI path)");
  if (!URL) {
    bad("AI_REVIEW_SERVICE_URL not set in .env");
    info("Add the Railway service URL to .env:");
    info("  AI_REVIEW_SERVICE_URL=https://your-service.up.railway.app");
    process.exitCode = 1;
    return;
  }
  info(`endpoint: ${URL}/review`);

  try {
    const res = await fetch(`${URL}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: "CV",
        text: "Say OK in one word.",
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const body = await res.text();

    if (!res.ok) {
      bad(`HTTP ${res.status}`);
      try {
        const parsed = JSON.parse(body);
        info(parsed.message || JSON.stringify(parsed).slice(0, 300));
      } catch {
        info(body.replace(/\s+/g, " ").slice(0, 300));
      }
      if (res.status === 401 || res.status === 403) {
        info("The review service rejects SmartScholar — check its auth config in Railway.");
      } else if (res.status === 503) {
        info("The review service or its AgentRouter upstream is unavailable right now.");
      }
      process.exitCode = 1;
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      bad(`200 OK but body is not JSON (content-type: ${res.headers.get("content-type") || ""})`);
      process.exitCode = 1;
      return;
    }
    if (!validScore(parsed)) {
      bad("200 OK but response is not a valid ReviewScore (missing 1-10 sub-scores)");
      process.exitCode = 1;
      return;
    }
    ok("working");
    info(
      `overall=${parsed.overallQuality.score} ats=${parsed.atsCompatibility.score} ` +
        `competitive=${parsed.competitiveness.score}`
    );
  } catch (e) {
    bad(`network error: ${e.message}`);
    process.exitCode = 1;
  }
}

main();
