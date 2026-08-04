import { ProviderAdapter, DiscoveredPage, ExtractedScholarship, ExtractOptions } from '../../acquisition/types';
import { makeBase } from '../util';

export const FULBRIGHT_FSP_URL = 'https://foreign.fulbrightonline.org/about/foreign-student-program';
export const FULBRIGHT_FLTA_URL = 'https://foreign.fulbrightonline.org/about/flta-program';
export const FULBRIGHT_VISITING_SCHOLAR_URL =
  'https://fulbrightscholars.org/non-us-scholars/fulbright-visiting-scholar-program';

export interface FulbrightProgram {
  key: string;
  title: string;
  sourceUrl: string;
  degreeLevels: string[];
  duration: string;
  durationText?: string;
  eligibleCountryCodes?: string[];
  countryName?: string;
  countryNote?: string;
  studyFields?: string[];
  languageCodes?: string[];
  isTeaching?: boolean;
}

const FSP_COUNTRY_SLUGS: Array<{ code: string; slug: string; name: string; office: string; note: string }> = [
  {
    code: 'EG',
    slug: 'egypt',
    name: 'Egypt',
    office: 'the Binational Fulbright Commission in Egypt (AMIDEAST Egypt)',
    note: 'Administered in Egypt by AMIDEAST, which screens candidates before they are considered for the national competition. Among the largest Fulbright programmes worldwide.',
  },
  {
    code: 'JO',
    slug: 'jordan',
    name: 'Jordan',
    office: 'the Binational Fulbright Commission in Amman',
    note: 'Administered by the Binational Fulbright Commission in Jordan.',
  },
  {
    code: 'LB',
    slug: 'lebanon',
    name: 'Lebanon',
    office: 'the Fulbright Commission in Lebanon (U.S. Embassy Beirut)',
    note: 'Administered by the Fulbright Commission in Lebanon.',
  },
  {
    code: 'MA',
    slug: 'morocco',
    name: 'Morocco',
    office: 'the Moroccan-American Commission for Educational and Cultural Exchange (MACECE)',
    note: 'Administered by MACECE in Rabat.',
  },
  {
    code: 'DZ',
    slug: 'algeria',
    name: 'Algeria',
    office: 'the Public Affairs Section of the U.S. Embassy in Algiers',
    note: 'Administered by the U.S. Embassy in Algiers.',
  },
  {
    code: 'TN',
    slug: 'tunisia',
    name: 'Tunisia',
    office: 'AMIDEAST Tunisia (Public Affairs Section, U.S. Embassy Tunis)',
    note: 'Administered by AMIDEAST Tunisia.',
  },
  {
    code: 'SA',
    slug: 'saudi-arabia',
    name: 'Saudi Arabia',
    office: 'the Public Affairs Sections of the U.S. Mission in Saudi Arabia',
    note: 'Administered by the U.S. Mission to Saudi Arabia.',
  },
  {
    code: 'IQ',
    slug: 'iraq',
    name: 'Iraq',
    office: 'the Public Affairs Section of the U.S. Embassy in Baghdad',
    note: 'Administered by the U.S. Embassy in Baghdad.',
  },
  {
    code: 'KW',
    slug: 'kuwait',
    name: 'Kuwait',
    office: 'the Public Affairs Section of the U.S. Embassy in Kuwait City',
    note: 'Administered by the U.S. Embassy in Kuwait.',
  },
];

const PROGRAMS: FulbrightProgram[] = [
  {
    key: 'fsp',
    title: 'Fulbright Foreign Student Program',
    sourceUrl: FULBRIGHT_FSP_URL,
    degreeLevels: ['MASTER', 'PHD'],
    duration:
      'Generally one to three academic years of degree study (Master\'s or Ph.D.) or one year of non-degree research in the United States.',
    durationText: 'One to three years (Master\'s, Ph.D., or non-degree research).',
    languageCodes: ['en'],
  },
  ...FSP_COUNTRY_SLUGS.map<FulbrightProgram>((c) => ({
    key: `fsp-${c.slug}`,
    title: `Fulbright Foreign Student Program — ${c.name}`,
    sourceUrl: `${FULBRIGHT_FSP_URL}?country=${c.slug}`,
    degreeLevels: ['MASTER', 'PHD'],
    duration:
      'Generally one to three academic years of degree study (Master\'s or Ph.D.) or one year of non-degree research in the United States.',
    durationText: 'One to three years (Master\'s, Ph.D., or non-degree research).',
    eligibleCountryCodes: [c.code],
    countryName: c.name,
    countryNote: `${c.note} Eligible applicants must be citizens of ${c.name} and apply through ${c.office}.`,
    languageCodes: ['en'],
  })),
  {
    key: 'flta',
    title: 'Fulbright Foreign Language Teaching Assistant (FLTA) Program',
    sourceUrl: FULBRIGHT_FLTA_URL,
    degreeLevels: ['BACHELOR'],
    duration:
      'One academic year (nine months). Teaching assistants work as native-language teachers (e.g., Arabic) at a U.S. university or college while taking up to two courses per semester.',
    durationText: 'One academic year (nine months) as a language teaching assistant.',
    eligibleCountryCodes: [
      'DZ', 'BH', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'OM', 'QA', 'SA', 'SD', 'SY', 'TN', 'AE', 'YE',
      'PS',
    ],
    studyFields: ['Arabic language and literature', 'English as a foreign language (TEFL)', 'teaching'],
    languageCodes: ['en'],
    isTeaching: true,
  },
  {
    key: 'visiting-scholar',
    title: 'Fulbright Visiting Scholar Program',
    sourceUrl: FULBRIGHT_VISITING_SCHOLAR_URL,
    degreeLevels: ['PHD'],
    duration:
      'Grants typically lasting from one semester up to one academic year, combining advanced research and university lecturing at U.S. institutions.',
    durationText: 'One semester to one year of research and lecturing.',
    languageCodes: ['en'],
  },
];

const PROGRAM_BY_KEY = new Map(PROGRAMS.map((p) => [p.key, p]));

export const fulbrightAdapter: ProviderAdapter = {
  id: 'fulbright',
  name: 'Fulbright Program (U.S. Department of State)',
  website: 'https://foreign.fulbrightonline.org/',
  defaultMax: PROGRAMS.length,

  async discover(): Promise<DiscoveredPage[]> {
    return PROGRAMS.map((p) => ({
      url: p.sourceUrl,
      sourceUrl: p.sourceUrl,
      title: p.title,
      metadata: { key: p.key },
    }));
  },

  async extract(url: string, _html: string, opts: ExtractOptions = {}): Promise<ExtractedScholarship> {
    const key = (typeof opts.metadata?.key === 'string' && opts.metadata.key) || 'fsp';
    const program = PROGRAM_BY_KEY.get(key) ?? PROGRAMS[0];

    const base = makeBase(url);
    const isCountryVariant = program.key.startsWith('fsp-') && program.key !== 'fsp';
    const isFlta = program.key === 'flta';
    const isVisiting = program.key === 'visiting-scholar';

    const titleSuffix = isCountryVariant ? ' (administered via the in-country Fulbright office)' : '';
    const description = isVisiting
      ? `The Fulbright Visiting Scholar Program brings non-U.S. faculty members, researchers and professionals to the United States for advanced research and university lecturing. Roughly 900 scholars receive Fulbright Scholar grants worldwide each year. Duration: ${program.duration}`
      : isFlta
        ? `The Fulbright Foreign Language Teaching Assistant (FLTA) Program is a fully funded exchange that places early-career foreign-language teachers (including Arabic) as teaching assistants at U.S. universities and colleges for one academic year. FLTAs teach their native language roughly 20 hours per week while enrolling in up to two courses per semester. ${program.countryNote ?? 'Eligibility is country-based; Arabic-speaking countries are a core target of this programme.'} Duration: ${program.duration}`
        : `The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to pursue Master\'s or Ph.D. degree study (or a year of non-degree research) at U.S. universities. Around 4,000 foreign students receive Fulbright grants each year. The application and selection process is administered by binational Fulbright Commissions/Foundations or U.S. embassies. ${program.countryNote ?? 'Eligibility varies by country — applicants whose country is not listed by their in-country Fulbright office are not eligible to apply.'} Duration: ${program.duration}`;

    return {
      ...base,
      title: program.title + titleSuffix,
      provider: 'Fulbright (U.S. Department of State)',
      degreeLevels: program.degreeLevels,
      studyFields: program.studyFields ?? [],
      countryCode: isCountryVariant ? program.eligibleCountryCodes?.[0] : undefined,
      durationText: program.durationText ?? undefined,
      description,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        travelCovered: true,
        healthInsurance: true,
        notes: isFlta
          ? 'Fully funded: monthly stipend, round-trip airfare, health benefit plan and visa support. Tuition is waived for the host-institution courses taken by FLTAs.'
          : 'Fully funded: full tuition, round-trip international airfare, monthly living stipend, a health benefit plan (J-visa), and access to Fulbright enrichment activities.',
      },
      deadlines: {
        closing: {
          raw: isFlta
            ? 'Application deadlines vary by country (typically spring in the year before the award). Check the deadline set by the Fulbright office in your home country.'
            : 'Application deadlines vary by country and are set by each binational Fulbright Commission or U.S. embassy (commonly between April and October for awards starting the following academic year).',
          isFallback: true,
        },
      },
      eligibility: {
        eligibleCountryCodes: program.eligibleCountryCodes ?? [],
        nationalityRestriction: isCountryVariant
          ? `Open only to citizens of ${program.countryName ?? 'the listed country'} — apply through the in-country Fulbright office.`
          : 'Open to citizens of participating countries (160+ countries). Applicants whose country is not listed by the in-country Fulbright office are not eligible.',
        degreeRequirement: 'Bachelor\'s degree (or equivalent to a U.S. bachelor\'s degree) by the time the grant begins.',
        languageRequirement: isVisiting
          ? 'Proficiency in English sufficient for research and lecturing at a U.S. institution (institution-specific).'
          : 'English proficiency equivalent to a TOEFL iBT score of about 79–80 or IELTS 6.5, or documented proficiency. Some institutions may require the GRE.',
        notes: 'There is no fixed global age or GPA cut-off for the Foreign Student Program; eligibility and selection are managed by each in-country Fulbright office. U.S. citizens and permanent residents are not eligible.',
      },
      requirements: isFlta
        ? [
            { type: 'other', description: 'Applicants must have a bachelor\'s degree by the start of the grant.', isMandatory: true },
            { type: 'other', description: 'Applicants must be early-career teachers or professionals working in education, with limited or no prior experience in the United States.', isMandatory: true },
          ]
        : [],
      testRequirements: isVisiting
        ? []
        : [
            { type: 'TOEFL', minimumScore: '79', isMandatory: false, notes: 'TOEFL iBT ≈ 79 required by most participating universities.' },
            { type: 'IELTS', minimumScore: '6.5', isMandatory: false, notes: 'IELTS ≈ 6.5 or documented English proficiency.' },
          ],
      documentRequirements: [
        { type: 'transcript', isRequired: true },
        { type: 'recommendation letter', isRequired: true },
        { type: 'statement of purpose', isRequired: true },
        ...(isVisiting
          ? [{ type: 'cv', isRequired: true }]
          : [
              { type: 'passport', isRequired: true },
              { type: 'ielts', isRequired: false },
            ]),
      ],
      benefits: [
        { type: 'tuition', description: isVisiting ? 'Grant support for research and lecturing (institutional arrangements vary)' : 'Full tuition' },
        { type: 'travel', description: 'Round-trip international airfare' },
        { type: 'monthly stipend', description: isFlta ? 'Monthly living stipend' : 'Monthly living stipend covering housing, food and incidental costs' },
        { type: 'health insurance', description: 'J-visa health benefit plan' },
      ],
      application: {
        url: program.sourceUrl,
        process: isVisiting
          ? 'Apply through your home country\'s Fulbright Commission or the public affairs section of the U.S. embassy. For information on how to apply, including deadlines, contact your country\'s Fulbright office.'
          : isFlta
            ? 'Apply online through the Fulbright FLTA application system managed by your in-country Fulbright office (Fulbright Commission or U.S. embassy), then complete the IIE application.'
            : `Apply through ${program.countryNote ? 'the in-country Fulbright office as noted above' : 'the Fulbright Commission/Foundation or U.S. embassy in your home country'}, then complete the IIE Foreign Fulbright application online.`,
      },
      contact: { url: program.sourceUrl },
      languageCodes: program.languageCodes ?? ['en'],
      confidence: 0.85,
      parserVersion: 'fulbright-v1',
    };
  },
};
