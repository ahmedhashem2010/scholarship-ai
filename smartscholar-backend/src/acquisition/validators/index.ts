import { NormalizedScholarship } from '../types';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** Returns null if it's not a scholarship-ish title (news, events, etc.). */
export function isScholarshipTitle(title: string): boolean {
  const s = title.toLowerCase();
  if (s.length < 8) return false;
  const strong = /(scholarship|grant|fellowship|bourse|stipend|bursary|funding|award|fullbright|mext|daad|erasmus|chevening|student exchange|master.?s programme|joint master)/;
  if (strong.test(s)) return true;
  const weak = /(program|programme|course|candidates|applicants|apply|application)/;
  return weak.test(s) && /(master|phd|doctorate|bachelor|undergraduate|graduate|study|university)/.test(s);
}

/** Filter obviously non-scholarship pages discovered by crawlers. */
export function isExcludedUrl(url: string, title?: string): boolean {
  const u = url.toLowerCase();
  if (/\.(pdf|zip|docx?|xlsx?|png|jpg|jpeg|gif|webp|mp4)(\?|$)/.test(u)) return true;
  const bad = ['/news/', '/events/', '/about', '/contact', '/login', '/register', '/privacy', '/terms', '/careers', '/jobs', '/press/', '/media/', '/faq', '/help'];
  if (bad.some((b) => u.includes(b))) return true;
  if (title) {
    const t = title.toLowerCase();
    const newsy = /\b(news|event|webinar|press release|blog|video|podcast|faq|contact|about|careers|team)\b/;
    if (newsy.test(t) && !isScholarshipTitle(t)) return true;
  }
  return false;
}

/** Field-level validation of a normalized scholarship before DB write. */
export function validateNormalized(s: NormalizedScholarship): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!s.title || s.title.trim().length < 8) errors.push('title too short');
  if (!/^https?:\/\//.test(s.sourceUrl)) errors.push('sourceUrl is not a URL');
  if (!/^https?:\/\//.test(s.originalUrl)) errors.push('originalUrl is not a URL');
  if (!s.slug || !/^[a-z0-9-]+$/.test(s.slug)) errors.push('slug invalid');
  if (!s.countryCode && !s.university) warnings.push('no host country or university');

  for (const d of s.degreeLevels) {
    if (!d) errors.push('empty degree level');
  }
  if (s.closingDate && !/^\d{4}-\d{2}-\d{2}$/.test(s.closingDate)) {
    errors.push('closingDate is not ISO date');
  }
  if (s.minimumAge != null && (s.minimumAge < 0 || s.minimumAge > 100)) warnings.push('minimumAge out of range');
  if (s.maximumAge != null && (s.maximumAge < 0 || s.maximumAge > 100)) warnings.push('maximumAge out of range');

  if (s.monthlyStipendAmount != null && !s.monthlyStipendCurrency) {
    errors.push('monthlyStipend amount without currency');
  }
  if (s.oneTimeGrantAmount != null && !s.oneTimeGrantCurrency) {
    errors.push('oneTimeGrant amount without currency');
  }

  return { ok: errors.length === 0, errors, warnings };
}
