/**
 * Type declarations for scripts/lib/scholarship-data.mjs (implementation is
 * plain ESM with no external dependencies — this file only bridges the types
 * into the TypeScript world for prisma/seed.ts).
 */

export interface FieldDef {
  type: "string" | "date" | "array" | "boolean" | "number";
  required?: boolean;
  identity?: boolean;
  allowNull?: boolean;
}

export const FIELD_DEFS: Record<string, FieldDef>;

export const KNOWN_DOCUMENT_TYPES: Set<string>;
export const COMPETITION_LEVELS: Set<string>;
export const URL_RE: RegExp;
export const DEGREE_TOKEN_RE: RegExp;

export const MOJIBAKE: RegExp;

export function looksCorrupted(value: unknown): boolean;
export function repairMojibake(str: string): string;
export function fixMojibake(record: Record<string, unknown>): Record<string, unknown>;

export function isEmpty(value: unknown, type: string): boolean;
export function valuesEqual(a: unknown, b: unknown, type: string): boolean;

export interface ParseDateResult {
  valid: boolean;
  value: Date | null;
}
export function parseDate(value: unknown): ParseDateResult;

export type ScholarshipLike = Record<string, unknown>;

export function normalizeRecord(record: ScholarshipLike): ScholarshipLike;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
export function validateRecord(
  record: ScholarshipLike,
  opts?: { isNew?: boolean }
): ValidationResult;

export interface MatchResult {
  kind: "exact" | "source-url" | "none";
  existing: ScholarshipLike | null;
}
export function findMatch(
  existingRecords: ScholarshipLike[],
  incoming: ScholarshipLike,
  opts?: { matchBySourceUrl?: boolean }
): MatchResult;

export interface MergeResult {
  update: ScholarshipLike;
  kept: Array<{ field: string; existing: unknown; incoming: unknown }>;
  changed: string[];
  isChanged: boolean;
}
export function mergeScholarship(
  existing: ScholarshipLike,
  incoming: ScholarshipLike,
  opts?: { force?: boolean }
): MergeResult;

export interface PlanItem {
  index: number;
  raw: ScholarshipLike;
  status: "new" | "update" | "unchanged" | "skipped";
  errors: string[];
  warnings: string[];
  kept: Array<{ field: string; existing: unknown; incoming: unknown }>;
  incoming?: ScholarshipLike;
  existing?: ScholarshipLike;
  createPayload?: ScholarshipLike;
  updatePayload?: ScholarshipLike;
  isRename?: boolean;
}

export interface PlanSummary {
  total: number;
  new: number;
  update: number;
  unchanged: number;
  skipped: number;
  rename: number;
  keptFields: number;
}

export interface Plan {
  summary: PlanSummary;
  items: PlanItem[];
  force: boolean;
  matchBySourceUrl: boolean;
}

export function planImport(opts: {
  existingRecords: ScholarshipLike[];
  incomingRecords: ScholarshipLike[];
  force?: boolean;
  matchBySourceUrl?: boolean;
}): Plan;

export function formatPlanSummary(plan: Plan, label?: string): string;
