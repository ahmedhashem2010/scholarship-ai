import { FIELDS } from '../../data/reference';
import { normalizeKey } from '../../shared/text';

/** Canonical study-field slugs in DB order. */
export const FIELD_SLUGS = FIELDS.map(([slug]) => slug);

const FIELD_SLUG_BY_NAME = new Map(
  FIELDS.map(([slug, name]) => [normalizeKey(name), slug]),
);

const FIELD_SLUG_BY_KEY = new Map(FIELDS.map(([slug]) => [slug, slug]));

const ALIAS_TO_SLUG: Record<string, string> = {
  'cs': 'computer-science',
  'computer science': 'computer-science',
  'computing': 'computer-science',
  'informatics': 'computer-science',
  'software': 'software-engineering',
  'software development': 'software-engineering',
  'data': 'data-science',
  'machine learning': 'artificial-intelligence',
  'ai': 'artificial-intelligence',
  'deep learning': 'artificial-intelligence',
  'it': 'information-technology',
  'information systems': 'information-technology',
  'technology': 'information-technology',
  'security': 'cybersecurity',
  'computer security': 'cybersecurity',
  'network security': 'cybersecurity',
  'engineering': 'engineering',
  'engineering and technology': 'engineering',
  'mechanical': 'mechanical-engineering',
  'electrical': 'electrical-engineering',
  'electronic engineering': 'electrical-engineering',
  'civil': 'civil-engineering',
  'business': 'business-administration',
  'business administration': 'business-administration',
  'management': 'business-administration',
  'economics': 'economics',
  'finance': 'finance',
  'accounting': 'accounting',
  'medicine': 'medicine',
  'medical': 'medicine',
  'pharmacy': 'pharmacy',
  'dentistry': 'dentistry',
  'nursing': 'nursing',
  'law': 'law',
  'legal': 'law',
  'architecture': 'architecture',
  'education': 'education',
  'teaching': 'education',
  'psychology': 'psychology',
  'international relations': 'international-relations',
  'ir': 'international-relations',
  'politics': 'international-relations',
  'political science': 'international-relations',
  'diplomacy': 'international-relations',
  'media': 'media-communications',
  'communication': 'media-communications',
  'communications': 'media-communications',
  'journalism': 'media-communications',
  'art': 'arts-design',
  'design': 'arts-design',
  'arts': 'arts-design',
  'mathematics': 'mathematics',
  'math': 'mathematics',
  'physics': 'physics',
  'chemistry': 'chemistry',
  'biology': 'biology',
  'life sciences': 'biology',
  'biosciences': 'biology',
  'environmental': 'environmental-science',
  'environmental science': 'environmental-science',
  'environmental studies': 'environmental-science',
  'agriculture': 'agriculture',
  'agronomy': 'agriculture',
  'public health': 'public-health',
  'health': 'public-health',
  'health sciences': 'public-health',
  'linguistics': 'linguistics',
  'languages': 'linguistics',
  'literature': 'linguistics',
  'humanities': 'linguistics',
  'social sciences': 'international-relations',
};

const ALIAS_KEYS = new Map(
  Object.entries(ALIAS_TO_SLUG).map(([k, v]) => [normalizeKey(k), v]),
);

/** Map free-text field reference to a canonical study-field slug, or null. */
export function resolveField(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const key = normalizeKey(s);
  if (FIELD_SLUG_BY_KEY.has(key)) return key;
  const byName = FIELD_SLUG_BY_NAME.get(key);
  if (byName) return byName;
  const alias = ALIAS_KEYS.get(key);
  if (alias) return alias;
  for (const [name, slug] of FIELD_SLUG_BY_NAME) {
    if (key.includes(name)) return slug;
  }
  for (const [aliasKey, slug] of ALIAS_KEYS) {
    if (key.includes(aliasKey)) return slug;
  }
  return null;
}

export function resolveFields(raw: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const r of raw) {
    const slug = resolveField(r);
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

export function fieldName(slug: string): string | null {
  return FIELDS.find(([s]) => s === slug)?.[1] ?? null;
}
