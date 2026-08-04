import { LANGUAGES } from '../../data/reference';
import { normalizeKey } from '../../shared/text';

const LANG_BY_CODE = new Map(LANGUAGES.map((l) => [l[0], l]));
const LANG_BY_NAME = new Map(LANGUAGES.map((l) => [normalizeKey(l[1]), l[0]]));

const ALIAS_TO_CODE: Record<string, string> = {
  'english': 'en',
  'arabic': 'ar',
  'french': 'fr',
  'german': 'de',
  'spanish': 'es',
  'portuguese': 'pt',
  'italian': 'it',
  'russian': 'ru',
  'chinese': 'zh',
  'mandarin': 'zh',
  'japanese': 'ja',
  'korean': 'ko',
  'turkish': 'tr',
  'urdu': 'ur',
  'hindi': 'hi',
  'dutch': 'nl',
  'swedish': 'sv',
  'norwegian': 'no',
  'danish': 'da',
  'finnish': 'fi',
  'polish': 'pl',
  'greek': 'el',
  'hebrew': 'he',
  'persian': 'fa',
  'farsi': 'fa',
  'malay': 'ms',
  'bahasa malaysia': 'ms',
  'bahasa indonesia': 'id',
  'indonesian': 'id',
  'thai': 'th',
  'vietnamese': 'vi',
  'swahili': 'sw',
  'czech': 'cs',
  'ukrainian': 'uk',
};

/** Resolve a language reference to ISO 639-1 code, or null. */
export function resolveLanguage(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (LANG_BY_CODE.has(lower)) return lower;
  // strip region suffix e.g. en-GB
  const base = lower.split('-')[0];
  if (LANG_BY_CODE.has(base)) return base;
  const key = normalizeKey(s);
  const byName = LANG_BY_NAME.get(key);
  if (byName) return byName;
  if (ALIAS_TO_CODE[key]) return ALIAS_TO_CODE[key];
  return null;
}

export function resolveLanguages(raw: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const r of raw) {
    const code = resolveLanguage(r);
    if (code && !out.includes(code)) out.push(code);
  }
  return out;
}
