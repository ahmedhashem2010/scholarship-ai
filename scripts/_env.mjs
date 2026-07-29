import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal .env loader — zero dependencies.
 *
 * The scripts here originally did `import "dotenv/config"`, but dotenv isn't a
 * dependency of this project, so they crashed on the first line with
 * "Cannot find module 'dotenv'". Node's own `--env-file` flag needs 20.6+ and
 * an extra CLI argument that's easy to forget. This just reads the file.
 *
 * Usage: `import "./_env.mjs";` as the FIRST import in a script.
 */
function loadEnv(file = ".env") {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) {
    console.warn(`[env] No ${file} found at ${path} — relying on the shell environment.`);
    return;
  }

  const text = readFileSync(path, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();

    // Strip matching surrounding quotes, and unescape \n inside double quotes.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, "\n");
    }

    // Real environment variables win, so you can override per-run:
    //   DATABASE_URL=... node scripts/audit-scholarships.mjs
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

/** Exits with a clear message if a required variable is missing. */
export function requireEnv(...keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`\n✗ Missing required environment variable${missing.length > 1 ? "s" : ""}:`);
    for (const k of missing) console.error(`    ${k}`);
    console.error(`\n  Add them to .env in the project root, then run again.`);
    console.error(`  See .env.example for what each one is.\n`);
    process.exit(1);
  }
}
