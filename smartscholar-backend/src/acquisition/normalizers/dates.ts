const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export interface ParsedDate {
  date: string; // YYYY-MM-DD
  confidence: 'full' | 'year-month' | 'year';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(year: number, month: number | null, day: number | null): ParsedDate | null {
  if (!year || year < 1970 || year > 2100) return null;
  if (month === null) return { date: `${year}-01-01`, confidence: 'year' };
  if (day === null) return { date: `${year}-${pad(month)}-01`, confidence: 'year-month' };
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return { date: `${year}-${pad(month)}-${pad(day)}`, confidence: 'full' };
}

const ISO_FULL = /^(\d{4})-(\d{2})-(\d{2})/;
const YEAR_MONTH = /^(\d{4})-(\d{2})$/;
const EURO_DMY = /^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/;
const DASH_DMY = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/;
const WORD_MONTH = /([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})/; // "15 January 2026"
const WORD_MONTH_REV = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([A-Za-z]{3,9})[,]?\s+(\d{4})/; // "January 15, 2026"
const MONTH_YEAR = /^([A-Za-z]{3,9})[,]?\s+(\d{4})$/;

function expandYear(y: number): number {
  if (y >= 100) return y;
  if (y < 50) return 2000 + y;
  return 1900 + y;
}

/**
 * Parse a date string into ISO YYYY-MM-DD. Returns null when the value is not
 * a recognizable date ("rolling", "varies", "open year-round", "TBC", etc.).
 */
export function parseDate(raw: string | undefined | null): ParsedDate | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s || s.length < 6) return null;
  if (/^\d{4}$/.test(s)) return toIso(Number(s), null, null);
  if (/^(rolling|varies|open|year-round|year round|continuous|tbc|to be confirmed|on-going|ongoing|all year|throughout the year|not specified|depends)/i.test(s)) {
    return null;
  }

  const iso = s.match(ISO_FULL);
  if (iso) return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const ym = s.match(YEAR_MONTH);
  if (ym) return toIso(Number(ym[1]), Number(ym[2]), null);

  const slash = s.match(EURO_DMY);
  if (slash) {
    let a = Number(slash[1]);
    let b = Number(slash[2]);
    const y = expandYear(Number(slash[3]));
    // assume DD/MM unless first part is >12
    let day = a;
    let month = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    } else if (b > 12 && a <= 12) {
      day = b;
      month = a;
    }
    return toIso(y, month, day);
  }

  const dash = s.match(DASH_DMY);
  if (dash && !ISO_FULL.test(s)) {
    const a = Number(dash[1]);
    const b = Number(dash[2]);
    const y = expandYear(Number(dash[3]));
    let day = a;
    let month = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    } else if (b > 12 && a <= 12) {
      day = b;
      month = a;
    }
    return toIso(y, month, day);
  }

  const wm = s.match(WORD_MONTH);
  if (wm) {
    const month = MONTHS[wm[1].toLowerCase().slice(0, 3)];
    if (month) return toIso(Number(wm[3]), month, Number(wm[2]));
  }

  const wm2 = s.match(WORD_MONTH_REV);
  if (wm2) {
    const month = MONTHS[wm2[2].toLowerCase().slice(0, 3)];
    if (month) return toIso(Number(wm2[3]), month, Number(wm2[1]));
  }

  const my = s.match(MONTH_YEAR);
  if (my) {
    const month = MONTHS[my[1].toLowerCase().slice(0, 3)];
    if (month) return toIso(Number(my[2]), month, null);
  }

  return null;
}

/** Extract a 4-digit year if present. */
export function findYear(text: string): number | null {
  const m = text.match(/\b(20\d{2}|19\d{2})\b/);
  return m ? Number(m[1]) : null;
}
