import { COUNTRIES } from '../../data/reference';
import { normalizeKey } from '../../shared/text';

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c[0], c]));
const COUNTRY_BY_CODE3 = new Map(COUNTRIES.map((c) => [c[2], c]));
const COUNTRY_BY_NAME = new Map(
  COUNTRIES.map((c) => [normalizeKey(c[1]), c]),
);
// add common aliases
COUNTRY_BY_NAME.set(normalizeKey('United States of America'), COUNTRY_BY_CODE.get('US')!);
COUNTRY_BY_NAME.set(normalizeKey('USA'), COUNTRY_BY_CODE.get('US')!);
COUNTRY_BY_NAME.set(normalizeKey('U.S.A.'), COUNTRY_BY_CODE.get('US')!);
COUNTRY_BY_NAME.set(normalizeKey('UK'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('United Kingdom (UK)'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('Britain'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('Great Britain'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('England'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('Scotland'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('Wales'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('Northern Ireland'), COUNTRY_BY_CODE.get('GB')!);
COUNTRY_BY_NAME.set(normalizeKey('Czech Republic'), COUNTRY_BY_CODE.get('CZ')!);
COUNTRY_BY_NAME.set(normalizeKey('The Netherlands'), COUNTRY_BY_CODE.get('NL')!);
COUNTRY_BY_NAME.set(normalizeKey('Holland'), COUNTRY_BY_CODE.get('NL')!);
COUNTRY_BY_NAME.set(normalizeKey('Russian Federation'), COUNTRY_BY_CODE.get('RU')!);
COUNTRY_BY_NAME.set(normalizeKey('Korea (Republic of)'), COUNTRY_BY_CODE.get('KR')!);
COUNTRY_BY_NAME.set(normalizeKey('Korea, Republic of'), COUNTRY_BY_CODE.get('KR')!);
COUNTRY_BY_NAME.set(normalizeKey('South Korea'), COUNTRY_BY_CODE.get('KR')!);
COUNTRY_BY_NAME.set(normalizeKey('Democratic People\'s Republic of Korea'), COUNTRY_BY_CODE.get('KP')!);
COUNTRY_BY_NAME.set(normalizeKey('Iran (Islamic Republic of)'), COUNTRY_BY_CODE.get('IR')!);
COUNTRY_BY_NAME.set(normalizeKey('Iran, Islamic Republic of'), COUNTRY_BY_CODE.get('IR')!);
COUNTRY_BY_NAME.set(normalizeKey('Côte d\'Ivoire'), COUNTRY_BY_CODE.get('CI')!);
COUNTRY_BY_NAME.set(normalizeKey('Ivory Coast'), COUNTRY_BY_CODE.get('CI')!);
COUNTRY_BY_NAME.set(normalizeKey('Syrian Arab Republic'), COUNTRY_BY_CODE.get('SY')!);
COUNTRY_BY_NAME.set(normalizeKey('Lao People\'s Democratic Republic'), COUNTRY_BY_CODE.get('LA')!);
COUNTRY_BY_NAME.set(normalizeKey('Viet Nam'), COUNTRY_BY_CODE.get('VN')!);
COUNTRY_BY_NAME.set(normalizeKey('United Republic of Tanzania'), COUNTRY_BY_CODE.get('TZ')!);
COUNTRY_BY_NAME.set(normalizeKey('Republic of Moldova'), COUNTRY_BY_CODE.get('MD')!);
COUNTRY_BY_NAME.set(normalizeKey('Venezuela (Bolivarian Republic of)'), COUNTRY_BY_CODE.get('VE')!);
COUNTRY_BY_NAME.set(normalizeKey('Bolivia (Plurinational State of)'), COUNTRY_BY_CODE.get('BO')!);
COUNTRY_BY_NAME.set(normalizeKey('Türkiye'), COUNTRY_BY_CODE.get('TR')!);
COUNTRY_BY_NAME.set(normalizeKey('Palestine'), COUNTRY_BY_CODE.get('PS')!);
COUNTRY_BY_NAME.set(normalizeKey('West Bank and Gaza'), COUNTRY_BY_CODE.get('PS')!);
COUNTRY_BY_NAME.set(normalizeKey('eSwatini'), COUNTRY_BY_CODE.get('SZ')!);

/** Resolve a country reference to ISO 3166-1 alpha-2 code, or null. */
export function resolveCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (COUNTRY_BY_CODE.has(s.toUpperCase())) return s.toUpperCase();
  if (COUNTRY_BY_CODE3.has(s.toUpperCase())) return COUNTRY_BY_CODE3.get(s.toUpperCase())![0];
  const key = normalizeKey(s);
  const byName = COUNTRY_BY_NAME.get(key);
  if (byName) return byName[0];
  // partial/fuzzy: last-word match to avoid "countries: Afghanistan, Albania"
  const words = key.split(' ');
  if (words.length > 2) {
    const last = words.slice(-2).join(' ');
    const byPartial = COUNTRY_BY_NAME.get(last);
    if (byPartial) return byPartial[0];
  }
  return null;
}

/** Resolve a list of country references, dropping unknown values. */
export function resolveCountries(raw: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const r of raw) {
    const code = resolveCountry(r);
    if (code && !out.includes(code)) out.push(code);
  }
  return out;
}

export function countryName(code: string): string | null {
  return COUNTRY_BY_CODE.get(code.toUpperCase())?.[1] ?? null;
}
