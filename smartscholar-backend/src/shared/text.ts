/** HTML-tag / entity stripping with newline preservation. */
export function stripHtml(html: string): string {
  if (!html) return '';
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#\d+;/g, (m) => {
      const c = parseInt(m.slice(2, -1), 10);
      return Number.isFinite(c) && c > 0 && c < 65536 ? String.fromCharCode(c) : '';
    });
  return text;
}

/** Collapse whitespace, trim. */
export function clean(text: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/** Collapse blank lines, trim each line. */
export function cleanLines(text: string): string {
  if (!text) return '';
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n');
}

/** Normalize for fuzzy matching: lower, strip diacritics, collapse spaces. */
export function normalizeKey(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/** First sentence (up to max chars). */
export function firstSentence(text: string, max = 400): string {
  const cleaned = clean(text);
  if (!cleaned) return '';
  const match = cleaned.match(/^(.+?[.!?])(\s|$)/);
  const candidate = match ? match[1] : cleaned;
  return truncate(candidate, max);
}

/** Split text into paragraphs on known separators. */
export function toParagraphs(text: string): string[] {
  return cleanLines(text)
    .split(/\n{1,}/)
    .map((p) => clean(p))
    .filter(Boolean);
}
