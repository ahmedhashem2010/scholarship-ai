import * as cheerio from 'cheerio';
import { ProviderAdapter, DiscoveredPage, ExtractedScholarship, ExtractOptions } from '../../acquisition/types';
import { fetchText } from '../../shared/http';
import { withRetry } from '../../acquisition/retry';
import { logger } from '../../acquisition/logging';
import { cleanTitle, makeBase } from '../util';

const CATALOGUE_URL = 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en';
const PROJECT_HOST = 'erasmus-plus.ec.europa.eu/projects';

interface CatalogueEntry {
  title: string;
  website: string;
  projectUrl?: string;
  page: number;
}

interface CataloguePage {
  entries: CatalogueEntry[];
  /** Highest ?page=N link on page 0 (pages are 0-indexed). */
  maxPage: number;
}

async function fetchCataloguePage(page: number): Promise<CataloguePage> {
  const url = page === 0 ? CATALOGUE_URL : `${CATALOGUE_URL}?page=${page}`;
  const res = await withRetry(() => fetchText(url, { timeoutMs: 30_000 }), {
    retries: 2,
    label: `eacea catalogue p${page}`,
  });
  if (res.status !== 200) {
    logger.warn('erasmus', `catalogue page ${page} returned ${res.status}`);
    return { entries: [], maxPage: 0 };
  }
  const $ = cheerio.load(res.text);
  const entries: CatalogueEntry[] = [];
  $('article.ecl-card').each((_i, card) => {
    const $card = $(card);
    const titleLink = $card.find('.ecl-content-block__title a[data-ecl-title-link]').first();
    const title = cleanTitle(titleLink.text());
    const website = (titleLink.attr('href') ?? '').trim();
    if (!title || !website) return;
    const projectUrl = $card
      .find(`a[href*="${PROJECT_HOST}"]`)
      .attr('href')
      ?.trim();
    entries.push({ title, website, projectUrl: projectUrl || undefined, page });
  });

  let maxPage = 0;
  if (page === 0) {
    $('a[href*="?page="]').each((_i, el) => {
      const m = ($(el).attr('href') ?? '').match(/[?&]page=(\d+)/);
      if (m) maxPage = Math.max(maxPage, Number(m[1]));
    });
  }
  return { entries, maxPage };
}

async function loadAllEntries(): Promise<CatalogueEntry[]> {
  const first = await fetchCataloguePage(0);
  const entries = [...first.entries];
  if (first.maxPage <= 0) return entries;
  for (let p = 1; p <= first.maxPage; p++) {
    const next = await fetchCataloguePage(p);
    entries.push(...next.entries);
  }
  logger.info('erasmus', `catalogue: ${entries.length} EMJM programmes across ${first.maxPage + 1} pages`);
  return entries;
}

const DEFAULT_DEADLINE =
  'Applications typically close between October and January (varies by programme; see programme website)';

export const erasmusAdapter: ProviderAdapter = {
  id: 'erasmus',
  name: 'Erasmus+',
  website: 'https://erasmus-plus.ec.europa.eu/',
  defaultMax: 90,

  async discover(): Promise<DiscoveredPage[]> {
    const entries = await loadAllEntries();
    return entries.map((e) => ({
      url: e.website,
      sourceUrl: e.website,
      title: e.title,
      metadata: { title: e.title, projectUrl: e.projectUrl ?? null, page: e.page },
    }));
  },

  async extract(url: string, html: string, opts: ExtractOptions = {}): Promise<ExtractedScholarship> {
    const meta = opts.metadata ?? {};
    const metaTitle = typeof meta.title === 'string' ? meta.title.trim() : '';
    const title = metaTitle || cleanTitle(cheerio.load(html)('title').first().text());

    const base = makeBase(url);
    return {
      ...base,
      title,
      provider: 'Erasmus+',
      degreeLevels: ['MASTER'],
      studyFields: [],
      description: `Erasmus Mundus Joint Master (EMJM) — ${title}. An international master's programme delivered by a consortium of higher education institutions. EMJM scholarships cover participation costs (tuition) and contribute to travel, visa and a living allowance; they are awarded annually to the best-ranked students worldwide. Source: official Erasmus Mundus Catalogue (EACEA).`,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        travelCovered: true,
        visaSupport: true,
        notes: 'Covers participation costs (tuition); contributes to travel, visa and living allowance.',
      },
      deadlines: {
        closing: { raw: DEFAULT_DEADLINE, isFallback: true },
      },
      eligibility: {
        eligibleCountryCodes: [],
        notes: 'Open to students of any nationality; check individual programme eligibility requirements.',
      },
      documentRequirements: [
        { type: 'transcript', isRequired: true },
        { type: 'motivation letter', isRequired: true },
        { type: 'cv', isRequired: true },
        { type: 'english proficiency', isRequired: true },
      ],
      benefits: [
        { type: 'tuition', description: 'Participation costs covered' },
        { type: 'travel', description: 'Contribution to travel costs' },
        { type: 'living allowance', description: 'Contribution to living allowance' },
      ],
      application: {
        url,
        portal: url,
        process: 'Apply directly to the programme consortium via the programme website.',
      },
      contact: { url },
      languageCodes: ['en'],
      confidence: 0.75,
      parserVersion: 'erasmus-v1',
    };
  },
};
