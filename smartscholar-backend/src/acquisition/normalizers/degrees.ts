import { DEGREES } from '../../data/reference';
import { normalizeKey } from '../../shared/text';

/** Canonical degree slugs in DB seed order. */
export const DEGREE_SLUGS = DEGREES.map(([name]) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
);

const DEGREE_SLUG_BY_NAME = new Map(
  DEGREES.map(([name], i) => [normalizeKey(name), DEGREE_SLUGS[i]]),
);

const ALIAS_TO_SLUG: Record<string, string> = {
  'bachelors': 'bachelors-degree',
  'bachelor': 'bachelors-degree',
  'bachelor s degree': 'bachelors-degree',
  'bachelor degree': 'bachelors-degree',
  'bsc': 'bachelors-degree',
  'ba': 'bachelors-degree',
  'undergraduate': 'bachelors-degree',
  'masters': 'masters-degree',
  'master': 'masters-degree',
  'master s degree': 'masters-degree',
  'master degree': 'masters-degree',
  'msc': 'masters-degree',
  'ma': 'masters-degree',
  'mba': 'masters-degree',
  'postgraduate': 'masters-degree',
  'grad': 'masters-degree',
  'graduate': 'masters-degree',
  'doctorate': 'doctorate-phd',
  'doctor of philosophy': 'doctorate-phd',
  'phd': 'doctorate-phd',
  'phd doctorate': 'doctorate-phd',
  'doctoral': 'doctorate-phd',
  'doctor': 'doctorate-phd',
  'high school': 'high-school',
  'secondary school': 'secondary-school',
  'secondary education': 'secondary-school',
  'highschool': 'high-school',
  'diploma': 'diploma',
  'associate': 'associate-degree',
  'associate degree': 'associate-degree',
  'certificate': 'certificate',
  'short course': 'short-course',
  'short term': 'short-course',
  'exchange': 'exchange-program',
  'exchange program': 'exchange-program',
  'student exchange': 'exchange-program',
  'language': 'language-course',
  'language course': 'language-course',
  'research': 'research',
  'research program': 'research',
  'summer school': 'summer-school',
  'summer': 'summer-school',
  'specialized training': 'diploma',
  'vocational': 'diploma',
  'technical college': 'diploma',
  'teacher training': 'research',
  'japanese studies': 'research',
};

const ALIAS_KEYS = new Map(
  Object.entries(ALIAS_TO_SLUG).map(([k, v]) => [normalizeKey(k), v]),
);

/** Map a free-text degree reference to a canonical degree slug, or null. */
export function resolveDegree(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const key = normalizeKey(s);
  const direct = DEGREE_SLUG_BY_NAME.get(key);
  if (direct) return direct;
  // "Bachelor's Degree in X" → match first part
  for (const name of DEGREE_SLUG_BY_NAME.keys()) {
    if (key.startsWith(name)) return DEGREE_SLUG_BY_NAME.get(name)!;
    if (key.endsWith(name)) return DEGREE_SLUG_BY_NAME.get(name)!;
  }
  const alias = ALIAS_KEYS.get(key);
  if (alias) return alias;
  // token scan for stronger matches
  for (const [aliasKey, slug] of ALIAS_KEYS) {
    if (key.includes(aliasKey)) return slug;
  }
  return null;
}

export function resolveDegrees(raw: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const r of raw) {
    const slug = resolveDegree(r);
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}
