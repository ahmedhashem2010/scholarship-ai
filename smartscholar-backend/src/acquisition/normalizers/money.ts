import { CURRENCIES } from '../../data/reference';

const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD', 'US$': 'USD', 'USD': 'USD',
  '€': 'EUR', 'EUR': 'EUR',
  '£': 'GBP', 'GBP': 'GBP',
  '¥': 'JPY', 'JPY': 'JPY', 'CN¥': 'CNY', '¥CN': 'CNY', 'RMB': 'CNY', 'CNY': 'CNY',
  '₹': 'INR', 'INR': 'INR',
  '₩': 'KRW', 'KRW': 'KRW',
  'RM': 'MYR', 'MYR': 'MYR',
  'S$': 'SGD', 'SGD': 'SGD',
  'HK$': 'HKD', 'HKD': 'HKD',
  'CHF': 'CHF',
  '₺': 'TRY', 'TRY': 'TRY',
  'Ft': 'HUF', 'HUF': 'HUF',
  'zł': 'PLN', 'PLN': 'PLN',
  'Kč': 'CZK', 'CZK': 'CZK',
  'lei': 'RON', 'RON': 'RON',
  '₴': 'UAH', 'UAH': 'UAH',
  'A$': 'AUD', 'AU$': 'AUD', 'AUD': 'AUD',
  'CA$': 'CAD', 'C$': 'CAD', 'CAD': 'CAD',
  'NZ$': 'NZD', 'NZD': 'NZD',
  'EGP': 'EGP', 'JOD': 'JOD', 'MAD': 'MAD', 'TND': 'TND', 'SAR': 'SAR', 'AED': 'AED',
  'RUB': 'RUB', 'ZAR': 'ZAR',
};

export interface ParsedMoney {
  amount: number;
  currency: string;
  period?: 'monthly' | 'yearly' | 'once' | 'semester' | 'unknown';
  approx?: boolean;
}

/** Parse a money phrase like "€ 992 monthly" or "USD 1,200 per month". */
export function parseMoney(text: string): ParsedMoney | null {
  if (!text) return null;
  const s = text.trim();
  if (!/[\d]/.test(s)) return null;

  let currency = '';
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (s.includes(sym)) {
      currency = code;
      break;
    }
  }
  // search full currency names
  if (!currency) {
    for (const [code, name] of CURRENCIES.map((c) => [c[0], c[1]])) {
      if (new RegExp(`\\b${name}\\b`, 'i').test(s)) {
        currency = code;
        break;
      }
    }
  }

  const numbers = s.match(/\d[\d,\.]*/g);
  if (!numbers) return null;
  // prefer the largest plausible number (avoids picking up years/percent)
  let best: number | null = null;
  for (const n of numbers) {
    const v = Number(n.replace(/,/g, ''));
    if (!Number.isFinite(v)) continue;
    if (best === null || v > best) best = v;
  }
  if (best === null) return null;
  // ignore amounts that look like a year or a percentage
  if (best >= 1970 && best <= 2100 && numbers.length === 1 && !currency) return null;

  let period: ParsedMoney['period'] = 'unknown';
  if (/per month|monthly|a month|each month|every month/i.test(s)) period = 'monthly';
  else if (/per year|yearly|annual(ly)?|a year|each year|per annum|p\.?a\.?/i.test(s)) period = 'yearly';
  else if (/one[- ]time|once-off|one-off|one time|one-time|one-off/i.test(s)) period = 'once';
  else if (/per semester|semester/i.test(s)) period = 'semester';

  const approx = /~|approx|around|about|circa|about/i.test(s);

  return {
    amount: best,
    currency: currency || 'USD',
    period,
    approx,
  };
}

/** Normalize a currency code to ISO (uppercase, trimmed). */
export function normalizeCurrency(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (code.length !== 3) return null;
  return CURRENCIES.some((c) => c[0] === code) ? code : null;
}

export const ISO_CURRENCIES = new Set(CURRENCIES.map((c) => c[0]));
