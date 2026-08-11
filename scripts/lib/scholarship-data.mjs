/**
 * Shared, pure, dependency-free helpers for scholarship data imports.
 *
 * Used by:
 *   - scripts/import-scholarships.mjs   (CLI — plan + apply)
 *   - prisma/seed.ts                    (fill-empty upsert via the same merge)
 *
 * Everything here is deterministic: given the same input it produces the same
 * output, so a dry run always matches what `--apply` will write.
 *
 * Identity: `nameEn` is the stable key (the Prisma `@unique` column). The
 * import never rewrites `nameEn` of an existing record unless the incoming
 * record is matched by `sourceUrl` (a safe, single-match rename).
 */

export const FIELD_DEFS = {
  nameEn: { type: "string", required: true, identity: true },
  nameAr: { type: "string", required: true },
  country: { type: "string", required: true },
  university: { type: "string" },
  degree: { type: "string", required: true },
  deadline: { type: "date", allowNull: true },
  flagUrl: { type: "string", allowNull: true },
  eligibleCountries: { type: "array" },
  eligibleEducation: { type: "array" },
  fieldOfStudy: { type: "array" },
  minimumAge: { type: "number", allowNull: true },
  maximumAge: { type: "number", allowNull: true },
  minimumGPA: { type: "number", allowNull: true },
  englishRequirement: { type: "string", allowNull: true },
  requiresResearch: { type: "boolean" },
  requiresWorkExp: { type: "boolean" },
  applicationFee: { type: "number", allowNull: true },
  competitionLevel: { type: "string" },
  requiredDocuments: { type: "array" },
  description: { type: "string" },
  benefits: { type: "string", allowNull: true },
  requirements: { type: "string", allowNull: true },
  sourceUrl: { type: "string", allowNull: true },
  officialWebsite: { type: "string", allowNull: true },
  applicationUrl: { type: "string", allowNull: true },
  source: { type: "string" },
};

/** Text fields that carry free-form scraped content — mojibake is repaired here. */
const MOJIBAKE_TEXT_FIELDS = [
  "description",
  "benefits",
  "requirements",
  "university",
  "nameAr",
  "englishRequirement",
];

export const KNOWN_DOCUMENT_TYPES = new Set([
  "CV",
  "TRANSCRIPT",
  "RECOMMENDATION_LETTER",
  "MOTIVATION_LETTER",
  "PERSONAL_STATEMENT",
  "RESEARCH_PROPOSAL",
  "MEDICAL_CERTIFICATE",
  "PORTFOLIO",
  "LANGUAGE_TEST",
  "ENGLISH_TEST",
  "FINANCIAL_STATEMENT",
  "PASSPORT",
  "ESSAY",
]);

export const COMPETITION_LEVELS = new Set(["low", "medium", "high"]);

export const URL_RE = /^https?:\/\/[^\s]+/i;

/**
 * Recognised degree levels, mirroring `scripts/enrich-scholarships.mjs`
 * (`educationFromDegree`). A degree string that names none of these is suspect.
 */
export const DEGREE_TOKEN_RE =
  /bachelor|undergrad|licence|بكالوريوس|master|msc|\bma\b|mba|ماجستير|phd|doctora|dphil|دكتوراه|diploma|certificate|exchange|summer|short.?term|training/i;

/* ------------------------------------------------------------------------- *
 * Mojibake repair — ported from scripts/fix-encoding.mjs so the import
 * pipeline and the seed clean scraped text deterministically at ingest time.
 * ------------------------------------------------------------------------- */

/** Cheap detector: these sequences essentially never occur in clean text. */
export const MOJIBAKE =
  /â€™|â€œ|â€|â€¦|Ã©|Ã¨|Ã¡|Ã­|Ã³|Ãº|Ã±|Â£|Â€|Â©|Â®|Â°|Â\s|â€|Ã¢/;

export function looksCorrupted(v) {
  return typeof v === "string" && MOJIBAKE.test(v);
}

/**
 * Windows-1252 printable glyphs that map to 0x80–0x9F (everything else in
 * that byte range is Latin-1 compatible).
 */
const CP1252_HIGH = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84,
  "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c,
  "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93,
  "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

/**
 * Reverse a UTF-8-read-as-CP1252 round trip: take the string's characters as
 * Windows-1252 bytes and decode those bytes as UTF-8. Accepts the result only
 * if it actually removed the corruption. Returns the original string when the
 * input is real multi-byte content (e.g. Arabic) or not repairable.
 */
export function repairMojibake(str) {
  if (typeof str !== "string" || !str) return str;
  try {
    const bytes = [];
    for (const ch of str) {
      const code = ch.codePointAt(0);
      if (CP1252_HIGH[ch] !== undefined) bytes.push(CP1252_HIGH[ch]);
      else if (code <= 0xff) bytes.push(code);
      else return str;
    }
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      new Uint8Array(bytes)
    );
    return MOJIBAKE.test(decoded) ? str : decoded;
  } catch {
    return str;
  }
}

/** Apply mojibake repair to the free-text fields of a record (never nameEn). */
export function fixMojibake(record) {
  const out = { ...record };
  for (const f of MOJIBAKE_TEXT_FIELDS) {
    if (typeof out[f] === "string" && out[f]) out[f] = repairMojibake(out[f]);
  }
  return out;
}

/* ------------------------------------------------------------------------- *
 * Value helpers
 * ------------------------------------------------------------------------- */

export function isEmpty(value, type) {
  if (value === undefined || value === null) return true;
  if (type === "string") return String(value).trim() === "";
  if (type === "array") return Array.isArray(value) && value.length === 0;
  if (type === "number") return false; // null handled above
  return false;
}

/** Order-insensitive equality (arrays are treated as sets semantically). */
export function valuesEqual(a, b, type) {
  if (type === "date") {
    const da = a instanceof Date ? a.toISOString() : String(a);
    const db = b instanceof Date ? b.toISOString() : String(b);
    return da === db;
  }
  if (type === "array") {
    const sa = [...a].sort().map((x) => String(x));
    const sb = [...b].sort().map((x) => String(x));
    return JSON.stringify(sa) === JSON.stringify(sb);
  }
  if (type === "string") return String(a).trim() === String(b).trim();
  return a === b;
}

export function parseDate(value) {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: null };
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return { valid: false, value: null };
  return { valid: true, value: d };
}

/* ------------------------------------------------------------------------- *
 * Normalisation — raw JSON → Prisma-shaped record
 * ------------------------------------------------------------------------- */

export function normalizeRecord(record) {
  const raw = record ?? {};
  const out = {};

  for (const [field, def] of Object.entries(FIELD_DEFS)) {
    const v = raw[field];
    if (v === undefined || v === null || v === "") continue;

    if (def.type === "string") {
      out[field] = String(v).trim();
    } else if (def.type === "date") {
      const parsed = parseDate(v);
      if (parsed.valid) out[field] = parsed.value;
    } else if (def.type === "array") {
      const items = Array.isArray(v)
        ? v
        : String(v)
            .split(/[\n,]+/)
            .map((x) => x.trim());
      out[field] = items.filter((x) => typeof x === "string" && x !== "");
    } else if (def.type === "boolean") {
      if (typeof v === "boolean") out[field] = v;
      else out[field] = v === "true" || v === 1 || v === "1";
    } else if (def.type === "number") {
      const n = Number(v);
      if (!Number.isNaN(n)) out[field] = n;
    }
  }

  const cleaned = fixMojibake(out);
  if (cleaned.competitionLevel === undefined) cleaned.competitionLevel = "medium";
  if (cleaned.source === undefined) cleaned.source = "SCRAPED";
  if (cleaned.eligibleCountries === undefined) cleaned.eligibleCountries = [];
  if (cleaned.eligibleEducation === undefined) cleaned.eligibleEducation = [];
  if (cleaned.fieldOfStudy === undefined) cleaned.fieldOfStudy = [];
  if (cleaned.requiredDocuments === undefined) cleaned.requiredDocuments = [];
  return cleaned;
}

/* ------------------------------------------------------------------------- *
 * Validation
 * ------------------------------------------------------------------------- */

export function validateRecord(record, { isNew = false } = {}) {
  const errors = [];
  const warnings = [];
  const raw = record ?? {};

  const nameEn = typeof raw.nameEn === "string" ? raw.nameEn.trim() : "";
  if (!nameEn) {
    errors.push("Missing nameEn");
  } else if (nameEn.length > 300) {
    errors.push(`nameEn too long (${nameEn.length} chars, max 300)`);
  }

  if (raw.nameAr !== undefined && raw.nameAr !== null && raw.nameAr !== "") {
    const ar = String(raw.nameAr).trim();
    if (ar.length > 500) warnings.push("nameAr suspiciously long");
    if (ar.startsWith("منحة ") && ar.length < 60 && ar.includes(nameEn)) {
      warnings.push("nameAr looks like an auto-generated placeholder");
    }
  } else if (isNew) {
    errors.push("Missing nameAr (required for new scholarships)");
  }

  for (const f of ["country", "degree"]) {
    const v = raw[f];
    if (v === undefined || v === null || String(v).trim() === "") {
      if (isNew) errors.push(`Missing ${f} (required for new scholarships)`);
    }
  }

  if (typeof raw.degree === "string" && raw.degree.trim()) {
    if (!DEGREE_TOKEN_RE.test(raw.degree)) {
      warnings.push(
        `degree "${raw.degree}" names no recognised level (bachelor/master/phd/...)`
      );
    }
  }

  if (raw.sourceUrl !== undefined && raw.sourceUrl !== null && raw.sourceUrl !== "") {
    if (!URL_RE.test(String(raw.sourceUrl).trim())) {
      errors.push(`Invalid sourceUrl "${raw.sourceUrl}"`);
    }
  }

  const dateCheck = parseDate(raw.deadline);
  if (!dateCheck.valid) {
    errors.push(`Invalid deadline "${raw.deadline}"`);
  } else if (dateCheck.value) {
    const y = dateCheck.value.getFullYear();
    if (y < 1990 || y > 2035) {
      warnings.push(`Deadline year ${y} looks out of range for a live scholarship`);
    }
  }

  for (const f of ["eligibleCountries", "eligibleEducation", "fieldOfStudy", "requiredDocuments"]) {
    const v = raw[f];
    if (v === undefined || v === null || v === "") continue;
    if (!Array.isArray(v) && typeof v !== "string") {
      errors.push(`"${f}" must be an array`);
      continue;
    }
    const items = Array.isArray(v) ? v : String(v).split(",");
    if (items.some((x) => typeof x === "string" && x.trim() === "")) {
      errors.push(`"${f}" contains empty values`);
    }
  }

  for (const n of ["minimumAge", "maximumAge", "minimumGPA", "applicationFee"]) {
    const v = raw[n];
    if (v === undefined || v === null || v === "") continue;
    const num = Number(v);
    if (Number.isNaN(num)) errors.push(`"${n}" is not a number ("${v}")`);
    else if (n === "minimumGPA" && (num < 0 || num > 4.0)) warnings.push(`minimumGPA ${num} outside 0–4`);
  }

  if (
    raw.minimumAge !== undefined && raw.minimumAge !== null &&
    raw.maximumAge !== undefined && raw.maximumAge !== null &&
    Number(raw.minimumAge) > Number(raw.maximumAge)
  ) {
    warnings.push(`minimumAge ${raw.minimumAge} > maximumAge ${raw.maximumAge}`);
  }

  if (raw.requiredDocuments !== undefined && Array.isArray(raw.requiredDocuments)) {
    for (const d of raw.requiredDocuments) {
      if (typeof d === "string" && !KNOWN_DOCUMENT_TYPES.has(d.trim().toUpperCase())) {
        warnings.push(`Unknown required document type "${d}"`);
      }
    }
  }

  if (
    raw.competitionLevel !== undefined && raw.competitionLevel !== null &&
    raw.competitionLevel !== ""
  ) {
    const cl = String(raw.competitionLevel).trim().toLowerCase();
    if (!COMPETITION_LEVELS.has(cl)) {
      warnings.push(`competitionLevel "${raw.competitionLevel}" not in low/medium/high`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------------- *
 * Matching + merge (fill-empty)
 * ------------------------------------------------------------------------- */

/**
 * Find the existing record an incoming record refers to.
 *   - "exact": same nameEn
 *   - "source-url": same sourceUrl (single match, different nameEn) → rename
 *   - "none": genuinely new scholarship
 */
export function findMatch(existingRecords, incoming, { matchBySourceUrl = true } = {}) {
  const nameEn = typeof incoming.nameEn === "string" ? incoming.nameEn.trim() : "";
  const exact = existingRecords.find((r) => r.nameEn === nameEn);
  if (exact) return { kind: "exact", existing: exact };

  if (matchBySourceUrl && incoming.sourceUrl) {
    const url = incoming.sourceUrl.trim();
    const byUrl = existingRecords.filter((r) => r.sourceUrl === url);
    if (byUrl.length === 1) return { kind: "source-url", existing: byUrl[0] };
  }
  return { kind: "none", existing: null };
}

/**
 * Fill-empty merge. Never erases a populated existing field; when both sides
 * are non-empty and differ, the existing value is kept (and reported in
 * `kept`) unless `force` is true.
 */
export function mergeScholarship(existing, incoming, { force = false } = {}) {
  const update = {};
  const kept = [];
  const changed = [];

  for (const [field, def] of Object.entries(FIELD_DEFS)) {
    if (def.identity) continue;
    const inVal = incoming[field];
    const exVal = existing[field];
    if (isEmpty(inVal, def.type)) continue;
    if (isEmpty(exVal, def.type)) {
      update[field] = inVal;
      changed.push(field);
      continue;
    }
    if (valuesEqual(exVal, inVal, def.type)) continue;
    if (force) {
      update[field] = inVal;
      changed.push(field);
    } else {
      kept.push({ field, existing: exVal, incoming: inVal });
    }
  }

  return { update, kept, changed, isChanged: Object.keys(update).length > 0 };
}

/* ------------------------------------------------------------------------- *
 * Import planning
 * ------------------------------------------------------------------------- */

export function planImport({
  existingRecords,
  incomingRecords,
  force = false,
  matchBySourceUrl = true,
} = {}) {
  const items = [];
  const seen = new Map();

  for (let i = 0; i < (incomingRecords || []).length; i++) {
    const raw = incomingRecords[i] ?? {};
    const entry = {
      index: i,
      raw,
      status: "skipped",
      errors: [],
      warnings: [],
      kept: [],
    };

    const nameEn = typeof raw.nameEn === "string" ? raw.nameEn.trim() : "";
    if (!nameEn) {
      entry.errors.push("Missing nameEn");
      items.push(entry);
      continue;
    }
    const key = nameEn.toLowerCase();
    const dupAt = seen.get(key);
    if (dupAt !== undefined) {
      entry.errors.push(`Duplicate nameEn in file (same as record #${dupAt + 1})`);
      items.push(entry);
      continue;
    }
    seen.set(key, i);

    const checked = validateRecord(raw, { isNew: true });
    if (!checked.ok) {
      entry.errors = checked.errors;
      entry.warnings = checked.warnings;
      items.push(entry);
      continue;
    }

    const incoming = normalizeRecord(raw);
    entry.incoming = incoming;
    entry.warnings = checked.warnings;

    const match = findMatch(existingRecords, incoming, { matchBySourceUrl });
    if (match.kind === "none") {
      entry.status = "new";
      entry.createPayload = incoming;
    } else {
      entry.existing = match.existing;
      const merge = mergeScholarship(match.existing, incoming, { force });
      entry.kept = merge.kept;
      if (match.kind === "source-url" && match.existing.nameEn !== incoming.nameEn) {
        merge.update.nameEn = incoming.nameEn;
        entry.isRename = true;
      }
      if (merge.isChanged || Object.keys(merge.update).length > 0) {
        entry.status = "update";
        entry.updatePayload = merge.update;
      } else {
        entry.status = "unchanged";
      }
    }
    items.push(entry);
  }

  const summary = {
    total: items.length,
    new: items.filter((i) => i.status === "new").length,
    update: items.filter((i) => i.status === "update").length,
    unchanged: items.filter((i) => i.status === "unchanged").length,
    skipped: items.filter((i) => i.status === "skipped").length,
    rename: items.filter((i) => i.isRename).length,
    keptFields: items.reduce((n, i) => n + i.kept.length, 0),
  };

  return { summary, items, force, matchBySourceUrl };
}

/* ------------------------------------------------------------------------- *
 * Reporting (shared by CLI output)
 * ------------------------------------------------------------------------- */

const BAR = (n, total, width = 22) => {
  const filled = total ? Math.round((n / total) * width) : 0;
  return "█".repeat(filled).padEnd(width, "░");
};

export function formatPlanSummary(plan, label = "INCOMING") {
  const s = plan.summary;
  const lines = [];
  lines.push(`\n${label}: ${s.total} record${s.total === 1 ? "" : "s"}`);
  lines.push(`  new      ${String(s.new).padStart(4)}  ${BAR(s.new, s.total)}`);
  lines.push(`  update   ${String(s.update).padStart(4)}  ${BAR(s.update, s.total)}`);
  lines.push(`  unchanged${String(s.unchanged).padStart(4)}  ${BAR(s.unchanged, s.total)}`);
  lines.push(`  skipped  ${String(s.skipped).padStart(4)}  ${BAR(s.skipped, s.total)}`);
  if (s.rename) lines.push(`  rename   ${String(s.rename).padStart(4)}  (matched by sourceUrl, nameEn updated)`);
  if (s.keptFields) {
    lines.push(`\n  ${s.keptFields} populated field${s.keptFields === 1 ? "" : "s"} conflict${s.keptFields === 1 ? "" : "s"} KEPT existing value${plan.force ? " (overridden)" : " — use --force to overwrite"}`);
  }
  return lines.join("\n");
}
