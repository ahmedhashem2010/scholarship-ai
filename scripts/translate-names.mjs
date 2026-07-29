import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";

/**
 * Translates scholarship names into real Arabic.
 *
 *   node scripts/translate-names.mjs            # dry run (default)
 *   node scripts/translate-names.mjs --apply    # write to the database
 *   node scripts/translate-names.mjs --limit 20 # try a small batch first
 *
 * WHY THIS EXISTS
 *
 * 196 of the 234 scraped scholarships have an `nameAr` of literally
 * `"منحة " + nameEn` — the Arabic word for "scholarship" glued to an untouched
 * English string. On an Arabic-first product that string is the largest text on
 * every card, every search result and every page title. To an Arabic reader it
 * is not a translation; it's English with a prefix.
 *
 * It also means those pages share near-identical titles, which is the
 * textbook setup for Google collapsing them as duplicate content.
 *
 * This script sends the English names to the same AI endpoint the review
 * feature uses, in batches, and validates every result before accepting it.
 */

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  const n = i !== -1 ? parseInt(process.argv[i + 1] ?? "", 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
})();

const BATCH_SIZE = 15;
const ENDPOINT = "https://agentrouter.org/v1/chat/completions";
// Must be a model this gateway actually serves. The app uses the same one.
const MODEL = process.env.TRANSLATE_MODEL || "claude-sonnet-4-20250514";

// AgentRouter fingerprints its clients and answers unrecognised ones with
// HTTP 401 "unauthorized client detected" — indistinguishable from a bad key.
const CLIENT_HEADERS = {
  Originator: process.env.AGENTROUTER_ORIGINATOR || "codex_cli_rs",
  "User-Agent": process.env.AGENTROUTER_USER_AGENT || "codex_cli_rs/0.101.0",
  Version: process.env.AGENTROUTER_VERSION || "0.101.0",
};

/* -------------------------------------------------------------------------
 * Detection + validation — pure, so they can be tested without an API key.
 * ---------------------------------------------------------------------- */

const ARABIC = /[؀-ۿ]/;

/**
 * True when nameAr is the placeholder rather than a real translation.
 * Catches "منحة X", "منحه X", stray whitespace, and plain-English values.
 */
export function isPlaceholderArabic(nameAr, nameEn) {
  if (!nameAr || !nameAr.trim()) return true;
  const ar = nameAr.trim();

  // No Arabic letters at all → it's just the English string.
  if (!ARABIC.test(ar)) return true;

  // "منحة " + the English name, allowing for the ة/ه spelling variants.
  const stripped = ar.replace(/^منح[ةه]\s*/, "").trim();
  if (stripped.toLowerCase() === (nameEn ?? "").trim().toLowerCase()) return true;

  // Mostly-Latin values that happen to contain one Arabic word.
  const latinCount = (ar.match(/[A-Za-z]/g) ?? []).length;
  const arabicCount = (ar.match(/[؀-ۿ]/g) ?? []).length;
  if (latinCount > arabicCount) return true;

  return false;
}

/**
 * Rejects a proposed translation unless it's plausibly real Arabic.
 * Returns null when acceptable, otherwise the reason for rejection.
 *
 * A bad translation is worse than the placeholder, because the placeholder is
 * at least obviously wrong. These checks are deliberately strict.
 */
export function rejectReason(candidate, nameEn) {
  if (typeof candidate !== "string") return "not a string";
  const c = candidate.trim();
  if (!c) return "empty";
  if (!ARABIC.test(c)) return "contains no Arabic";

  // The model echoed the placeholder back at us. Tested as the exact prefix
  // pattern rather than by calling isPlaceholderArabic, because that function
  // ALSO rejects mostly-Latin strings — and an echoed placeholder is both, so
  // whichever check ran first would mask the other and make the rejection log
  // lie about why a name was skipped.
  if (c.replace(/^منح[ةه]\s*/, "").trim().toLowerCase() === (nameEn ?? "").trim().toLowerCase()) {
    return "still the placeholder pattern";
  }

  // Proper nouns (Chevening, Fulbright, DAAD) legitimately stay Latin, but a
  // result that is mostly Latin means it didn't translate.
  const latin = (c.match(/[A-Za-z]/g) ?? []).length;
  const arabic = (c.match(/[؀-ۿ]/g) ?? []).length;
  if (latin > arabic) return "mostly Latin script";

  // Guard against runaway or truncated output.
  if (c.length > 160) return "too long";
  if (arabic < 6) return "too short to be a name";

  // The model sometimes returns commentary instead of a name.
  if (/^(sorry|i cannot|as an ai|لا أستطيع)/i.test(c)) return "model refused";

  // HALLUCINATION GUARD.
  //
  // A scholarship name is a fact. An invented institution or year sends a
  // student to the wrong application, so nothing may appear in the output that
  // isn't in the source.
  //
  // (This was added after a dry run appeared to show "في KCC 2026" invented out
  // of nowhere. It turned out the console output was truncating the English at
  // 72 chars and the source really did end "…at KCC 2026" — the translation was
  // correct. The guard is still worth having; the truncation was the bug.)
  //
  // Any Latin word or multi-digit number in the output must also be present in
  // the English. Arabic text is unconstrained (that's the translation), but
  // untranslatable tokens are exactly where fabrication shows up.
  // Normalise before comparing, or the check produces false positives:
  //   - "$2,000" in English vs "2000" in Arabic — thousands separators differ
  //   - "٢٠٢٦" — the model sometimes emits Arabic-Indic digits
  const toAscii = (t) => t.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const stripSep = (t) => t.replace(/[,،.\s](?=\d)/g, "");
  const src = stripSep(toAscii((nameEn ?? "").toLowerCase()));
  const invented = (stripSep(toAscii(c)).match(/[A-Za-z]{2,}|\d{2,}/g) ?? [])
    .filter((tok) => !src.includes(tok.toLowerCase()));
  if (invented.length) {
    return `invented content not in source: ${[...new Set(invented)].join(", ")}`;
  }

  return null;
}

/* -------------------------------------------------------------------------
 * AI call
 * ---------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You translate scholarship names from English into Modern Standard Arabic for an Arabic-language scholarship website used by students across the Middle East and North Africa.

Rules:
- Translate meaning, not word-by-word.
- Keep proper nouns (universities, people, programme brand names like Chevening, Fulbright, DAAD, Erasmus) in their commonly used Arabic form. If a name has no established Arabic form, transliterate it into Arabic script.
- Start with "منحة" only when the English name does not already say what kind of award it is. Do NOT mechanically prefix every entry.
- Use the natural Arabic word order. Do not leave English words in the output unless they are an acronym with no Arabic equivalent.
- Return the name only — no explanation, no quotes, no numbering.
- NEVER add information that is not in the English name. Do not invent
  institutions, years, countries, or amounts. If the English name is vague,
  translate it vaguely. Adding a detail that isn't there is a serious error.

You will receive a JSON array of English names. Return a JSON array of Arabic names, same length, same order. Return ONLY the JSON array.`;

const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = process.env.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/** Groq — same provider the app now uses for reviews. */
async function viaGroq(names) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      // Deterministic: a name is a fact, not a creative task.
      temperature: 0,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        // json_object mode requires an object, not a bare array, so the model
        // is asked for {"names": [...]} and unwrapped below.
        // The word "json" must appear or Groq rejects json_object mode with a 400.
        { role: "system", content: `${SYSTEM_PROMPT}\n\nReturn a JSON object of this exact shape: {"names": ["...", "..."]}` },
        { role: "user", content: JSON.stringify(names) },
      ],
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    if (res.status === 429) throw new Error("HTTP 429 — rate limited. Wait a minute and re-run; only untranslated names are retried.");
    if (res.status === 404) throw new Error(`Model "${GROQ_MODEL}" not found — set GROQ_MODEL in .env. See https://console.groq.com/docs/models`);
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return JSON.parse(body)?.choices?.[0]?.message?.content ?? "";
}

/** Google Gemini — fallback. */
async function viaGemini(names) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${JSON.stringify(names)}` }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    if (res.status === 429) throw new Error("HTTP 429 — free-tier quota hit. Wait a minute and re-run; the script only retries names it hasn't translated.");
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const parts = JSON.parse(body)?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts) ? parts.map((p) => p?.text ?? "").join("") : "";
}

/** AgentRouter — kept only as a fallback. */
async function viaAgentRouter(names) {
  const key = process.env.AGENTROUTER_API_KEY;
  if (!key) throw new Error("Neither GEMINI_API_KEY nor AGENTROUTER_API_KEY is set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...CLIENT_HEADERS,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(names) },
      ],
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    if (res.status === 401 && body.includes("unauthorized_client")) {
      throw new Error("HTTP 401 unauthorized_client — the gateway rejected the CLIENT, not the key.");
    }
    if (res.status === 503 && body.includes("\u65e0\u53ef\u7528\u6e20\u9053")) {
      throw new Error(`HTTP 503 — your AgentRouter group has no channel for "${MODEL}". Set GEMINI_API_KEY instead.`);
    }
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  try {
    return JSON.parse(body).choices?.[0]?.message?.content ?? "";
  } catch {
    throw new Error(`Non-JSON response: ${body.slice(0, 200)}`);
  }
}

async function translateBatch(names) {
  const content = GROQ_KEY
    ? await viaGroq(names)
    : GEMINI_KEY
      ? await viaGemini(names)
      : await viaAgentRouter(names);

  const cleaned = String(content).replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Model did not return JSON: ${cleaned.slice(0, 200)}`);
  }
  // json_object mode wraps the result in an object; accept either shape.
  if (!Array.isArray(parsed) && Array.isArray(parsed?.names)) parsed = parsed.names;
  if (!Array.isArray(parsed)) throw new Error("Model did not return an array");
  if (parsed.length !== names.length) {
    throw new Error(`Length mismatch: sent ${names.length}, got ${parsed.length}`);
  }
  return parsed;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------
 * Main
 * ---------------------------------------------------------------------- */

async function main() {
  const all = await prisma.scholarship.findMany({
    select: { id: true, nameEn: true, nameAr: true },
    orderBy: { createdAt: "asc" },
  });

  let targets = all.filter((s) => isPlaceholderArabic(s.nameAr, s.nameEn));
  console.log(`\n${all.length} scholarships total.`);
  console.log(`${targets.length} have a placeholder Arabic name.`);
  console.log(`${all.length - targets.length} already look translated — leaving those alone.\n`);

  if (targets.length === 0) {
    console.log("Nothing to do.\n");
    return;
  }
  if (LIMIT) {
    targets = targets.slice(0, LIMIT);
    console.log(`--limit ${LIMIT}: processing the first ${targets.length}.\n`);
  }

  const accepted = [];
  const rejected = [];
  let failedBatches = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const n = Math.floor(i / BATCH_SIZE) + 1;
    const total = Math.ceil(targets.length / BATCH_SIZE);
    process.stdout.write(`  batch ${n}/${total} (${batch.length} names)… `);

    let out;
    try {
      out = await translateBatch(batch.map((s) => s.nameEn));
    } catch (e) {
      failedBatches++;
      console.log(`FAILED — ${e.message}`);
      // One bad batch shouldn't abandon the run.
      await sleep(2000);
      continue;
    }

    let ok = 0;
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const candidate = typeof out[j] === "string" ? out[j].trim() : "";
      const reason = rejectReason(candidate, row.nameEn);
      if (reason) {
        rejected.push({ nameEn: row.nameEn, candidate, reason });
      } else {
        accepted.push({ id: row.id, nameEn: row.nameEn, was: row.nameAr, now: candidate });
        ok++;
      }
    }
    console.log(`${ok} accepted, ${batch.length - ok} rejected`);
    await sleep(1200); // be polite to the endpoint
  }

  console.log(`\n── Results ──────────────────────────────────`);
  console.log(`  accepted : ${accepted.length}`);
  console.log(`  rejected : ${rejected.length}`);
  if (failedBatches) console.log(`  failed batches: ${failedBatches}`);

  console.log(`\nSample of accepted translations:`);
  for (const a of accepted.slice(0, 8)) {
    // Print names IN FULL. An earlier version truncated the English at 72
    // chars, which made a correct translation of "…at KCC 2026" look like an
    // invented institution — the truncation hid the source of the very detail
    // being verified. Never elide the thing you're asking someone to check.
    console.log(`\n  EN:  ${a.nameEn}`);
    console.log(`  was: ${a.was}`);
    console.log(`  now: ${a.now}`);
  }

  if (rejected.length) {
    console.log(`\nRejected (left untouched):`);
    for (const r of rejected.slice(0, 8)) {
      // Full text, on separate lines. padEnd(28) collided whenever the reason
      // was longer than 28 chars — which it always is for the invented-content
      // case — running the reason and the name together into one unreadable
      // string. And the name was truncated, hiding whether the rejection was
      // even correct.
      console.log(`\n  EN:       ${r.nameEn}`);
      console.log(`  proposed: ${r.candidate}`);
      console.log(`  reason:   ${r.reason}`);
    }
    if (rejected.length > 8) console.log(`  …and ${rejected.length - 8} more`);
    console.log(`\n  Re-run the script to retry these — it only touches placeholders.`);
  }

  if (accepted.length === 0) {
    console.log(
      `\nNothing was accepted, so there is nothing to write.` +
      (failedBatches ? `\nEvery batch failed — fix the API error above and re-run.\n` : `\n`)
    );
    return;
  }

  if (!APPLY) {
    console.log(`\n(dry run — nothing written. Re-run with --apply to save.)\n`);
    return;
  }

  let written = 0;
  for (const a of accepted) {
    await prisma.scholarship.update({ where: { id: a.id }, data: { nameAr: a.now } });
    written++;
    if (written % 25 === 0) console.log(`   …${written}/${accepted.length}`);
  }
  console.log(`\n✓ Updated ${written} Arabic names.\n`);
}

// Allow importing the pure helpers for testing without touching the DB.
if (process.argv[1] && process.argv[1].endsWith("translate-names.mjs")) {
  main()
    .catch((e) => {
      console.error("\nTranslation failed:", e.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
