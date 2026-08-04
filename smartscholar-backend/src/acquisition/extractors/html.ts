import * as cheerio from 'cheerio';
import { clean, stripHtml } from '../../shared/text';
import { parseJsonObject } from '../../shared/json';

export interface HtmlDocument {
  url: string;
  title: string;
  description: string;
  lang: string | null;
  jsonLd: Array<Record<string, unknown>>;
  text: string;
  /** flattened <main>/article body text with line breaks */
  bodyText: string;
  tables: Array<Array<Array<string>>>;
  meta: Record<string, string>;
}

/** Extract the visible main-content text, skipping nav/header/footer/scripts. */
function extractBodyText($: cheerio.CheerioAPI): string {
  let container = $('main, article, [role="main"], #content, .content, .page-content').first();
  let text = $();
  if (container.length === 0) {
    // fall back to body minus boilerplate
    $('nav, header, footer, script, style, noscript, aside, form, .breadcrumb, .breadcrumbs').remove();
    container = $('body');
  }
  text = container.clone();
  // remove boilerplate inside the chosen container too
  $(text).find('nav, header, footer, script, style, noscript, aside, form, button, .breadcrumb, .breadcrumbs').remove();
  return stripHtml($(text).html() ?? '');
}

function extractTables($: cheerio.CheerioAPI): Array<Array<Array<string>>> {
  const tables: Array<Array<Array<string>>> = [];
  $('table').each((_i, table) => {
    const rows: Array<Array<string>> = [];
    $(table)
      .find('tr')
      .each((_j, tr) => {
        const cells: string[] = [];
        $(tr)
          .find('th, td')
          .each((_k, td) => {
            cells.push(clean($(td).text()));
          });
        if (cells.some((c) => c.length > 0)) rows.push(cells);
      });
    if (rows.length > 0) tables.push(rows);
  });
  return tables;
}

/** Extract JSON-LD script blocks. */
function extractJsonLd($: cheerio.CheerioAPI): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).text();
    const parsed = parseJsonObject(raw);
    if (parsed) out.push(parsed as Record<string, unknown>);
  });
  return out;
}

export function parseHtml(html: string, url: string): HtmlDocument {
  const $ = cheerio.load(html);
  const title = clean($('title').first().text()) || '';
  const description = clean(
    $('meta[name="description"]').attr('content')
      ?? $('meta[property="og:description"]').attr('content')
      ?? '',
  );
  const lang = $('html').attr('lang') ?? null;
  const meta: Record<string, string> = {};
  $('meta').each((_i, el) => {
    const name = $(el).attr('name') ?? $(el).attr('property') ?? $(el).attr('itemprop');
    const content = $(el).attr('content');
    if (name && content) meta[name] = clean(content);
  });
  const jsonLd = extractJsonLd($);
  const bodyText = cleanLinesLocal(extractBodyText($));
  const text = cleanLinesLocal(stripHtml(html));
  const tables = extractTables($);
  return { url, title, description, lang, jsonLd, text, bodyText, tables, meta };
}

function cleanLinesLocal(text: string): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n');
}
