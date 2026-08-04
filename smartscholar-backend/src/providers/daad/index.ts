import { ProviderAdapter, DiscoveredPage, ExtractedScholarship, ExtractOptions } from '../../acquisition/types';
import { makeBase } from '../util';

export const DAAD_OVERVIEW_URL = 'https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/';
export const DAAD_EPOS_URL =
  'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=50076777';
export const DAAD_HILDE_DOMIN_URL =
  'https://www.daad.de/en/studying-in-germany/scholarships/daad-funding-programmes/hilde-domin-programme/';

/** Official DAAD monthly rates (2024/2025 onwards). */
export const DAAD_GRADUATE_MONTHLY_EUR = 992;
export const DAAD_DOCTORAL_MONTHLY_EUR = 1300;

interface DaadProgram {
  key: string;
  title: string;
  sourceUrl: string;
  degreeLevels: string[];
  duration: string;
  durationText: string;
  monthlyStipend: number;
  focus?: string;
  studyFields?: string[];
}

const PROGRAMS: DaadProgram[] = [
  {
    key: 'study-scholarships-masters',
    title: 'DAAD Study Scholarships – Master\'s for All Disciplines',
    sourceUrl: DAAD_OVERVIEW_URL,
    degreeLevels: ['MASTER'],
    duration:
      'Usually 12–24 months for a master\'s degree at a German university, following the standard duration of the chosen programme.',
    durationText: '1–2 years (master\'s degree).',
    monthlyStipend: DAAD_GRADUATE_MONTHLY_EUR,
    focus:
      'Graduates from developing countries who wish to complete a postgraduate degree (master\'s) in Germany. Selection is based on academic qualification and a convincing study plan.',
  },
  {
    key: 'epos',
    title: 'DAAD EPOS – Development-Related Postgraduate Courses',
    sourceUrl: DAAD_EPOS_URL,
    degreeLevels: ['MASTER', 'PHD'],
    duration:
      'Master\'s courses usually run 12–24 months; doctoral studies up to 36–48 months, following the standard duration of the course.',
    durationText: '1–2 years (master\'s); up to 4 years (doctoral).',
    monthlyStipend: DAAD_GRADUATE_MONTHLY_EUR,
    focus:
      'Development-related postgraduate courses (EPOS) for graduates and doctoral candidates from developing countries, covering fields linked to sustainable development.',
    studyFields: [
      'economics and business administration',
      'agricultural and forest sciences',
      'engineering',
      'mathematics and natural sciences',
      'environmental and natural sciences',
      'medicine and public health',
      'social sciences and law',
      'regional and urban planning',
    ],
  },
  {
    key: 'research-grants-doctoral',
    title: 'DAAD Research Grants – Doctoral Programmes in Germany',
    sourceUrl: DAAD_OVERVIEW_URL,
    degreeLevels: ['PHD'],
    duration:
      'Usually up to 4 years for a full doctoral programme, or 6–24 months for a short-term research grant.',
    durationText: 'Up to 4 years (full doctoral programme).',
    monthlyStipend: DAAD_DOCTORAL_MONTHLY_EUR,
    focus:
      'Research grants for highly qualified graduates who want to earn a doctorate in Germany, plus short-term grants for ongoing research projects.',
  },
  {
    key: 'hilde-domin',
    title: 'Hilde Domin Programme for Scholars at Risk',
    sourceUrl: DAAD_HILDE_DOMIN_URL,
    degreeLevels: ['MASTER', 'PHD'],
    duration:
      'Up to 36 months: a master\'s or doctoral degree, or a research stay (postdocs), at a German university.',
    durationText: 'Up to 36 months (degree or research stay).',
    monthlyStipend: DAAD_GRADUATE_MONTHLY_EUR,
    focus:
      'Scholars and graduates who are at risk of being denied educational or other rights in their country of origin (e.g. war-affected or crisis countries), nominated by German partner institutions.',
  },
];

const PROGRAM_BY_KEY = new Map(PROGRAMS.map((p) => [p.key, p]));

export const daadAdapter: ProviderAdapter = {
  id: 'daad',
  name: 'DAAD (German Academic Exchange Service)',
  website: 'https://www.daad.de/',
  defaultMax: PROGRAMS.length,
  curated: true,

  async discover(): Promise<DiscoveredPage[]> {
    return PROGRAMS.map((p) => ({
      url: p.sourceUrl,
      sourceUrl: p.sourceUrl,
      title: p.title,
      metadata: { key: p.key },
    }));
  },

  async extract(url: string, _html: string, opts: ExtractOptions = {}): Promise<ExtractedScholarship> {
    const key = (typeof opts.metadata?.key === 'string' && opts.metadata.key) || 'study-scholarships-masters';
    const program = PROGRAM_BY_KEY.get(key) ?? PROGRAMS[0];

    const base = makeBase(url);
    const isEpos = program.key === 'epos';
    const isDoctoral = program.key === 'research-grants-doctoral';
    const isHildeDomin = program.key === 'hilde-domin';
    const isStudyMasters = program.key === 'study-scholarships-masters';

    const description =
      `DAAD is the German Academic Exchange Service, funding more than 100,000 German and international students and researchers every year. ${program.focus} ` +
      `Duration: ${program.duration} The monthly scholarship payment is currently ${program.monthlyStipend} euros${
        isEpos || isHildeDomin
          ? ` for master's students and ${DAAD_DOCTORAL_MONTHLY_EUR} euros for doctoral candidates`
          : isDoctoral
            ? ''
            : ''
      }, in addition to travel, health insurance and other allowances.`;

    return {
      ...base,
      title: program.title,
      provider: 'DAAD',
      degreeLevels: program.degreeLevels,
      studyFields: program.studyFields ?? [],
      countryCode: undefined,
      durationText: program.durationText,
      description,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        healthInsurance: true,
        travelCovered: true,
        monthlyStipend: { amount: program.monthlyStipend, currency: 'EUR', period: 'monthly' },
        notes: isEpos
          ? `Monthly payment of ${DAAD_GRADUATE_MONTHLY_EUR} EUR (graduates) or ${DAAD_DOCTORAL_MONTHLY_EUR} EUR (doctoral candidates); tuition fees for the selected EPOS course are covered. Includes travel allowance, health insurance and, where applicable, family allowances.`
          : isHildeDomin
            ? `Monthly scholarship payment of ${DAAD_GRADUATE_MONTHLY_EUR} EUR (master's) or ${DAAD_DOCTORAL_MONTHLY_EUR} EUR (doctoral/postdoc); includes travel allowance and health insurance.`
            : isDoctoral
              ? `Monthly payment of ${DAAD_DOCTORAL_MONTHLY_EUR} EUR plus a research cost allowance; includes travel allowance and health insurance.`
              : `Monthly scholarship payment of ${DAAD_GRADUATE_MONTHLY_EUR} EUR; includes travel allowance and health insurance. German public universities generally charge no tuition fees.`,
      },
      deadlines: {
        closing: {
          raw: isEpos
            ? 'Application deadlines are set by each selected EPOS course and usually fall between July and October in the year before studies begin. Check the individual course announcement.'
            : isHildeDomin
              ? 'Nominations are accepted continuously via German partner institutions (typically one to two nomination rounds per year). Check the current call.'
              : isDoctoral
                ? 'Applications are accepted throughout the year for most research grant categories; deadlines vary by country of origin. Check the DAAD scholarship database for your country.'
                : 'Application period for the following academic year typically opens around June and closes in autumn (e.g. September–October). Check the current call for your country.',
          isFallback: true,
        },
      },
      eligibility: {
        eligibleCountryCodes: [],
        nationalityRestriction: isEpos
          ? 'Open to graduates from developing countries (as defined by the OECD/DAC list) with relevant professional experience.'
          : isHildeDomin
            ? 'Open to scholars from any country who are demonstrably at risk; applicants must be nominated by a German host institution.'
            : isStudyMasters
              ? 'Open to graduates from developing countries wishing to study a master\'s in Germany; graduates from industrialised countries are covered by separate DAAD schemes.'
              : 'Open to doctoral candidates from almost all countries of origin.',
        degreeRequirement: isDoctoral
          ? 'A master\'s degree (or equivalent) with above-average results is required for a doctoral programme.'
          : isHildeDomin
            ? 'A first university degree for master\'s studies, or a master\'s degree/postdoc qualification for doctoral or research stays.'
            : 'A first university degree (bachelor\'s or equivalent) with above-average results (typically a German grade of 2.5 or better).',
        languageRequirement:
          'German-taught programmes require German proficiency (usually DSH 2 / TestDaF); English-taught programmes require English proficiency (IELTS or TOEFL) as set by the host university.',
        notes:
          'Candidates are expected to submit a convincing study or research plan. Selection is competitive and is made by independent selection committees.',
      },
      requirements: [
        {
          type: 'other',
          description: isHildeDomin
            ? 'Applicants must be nominated by a German partner institution; direct applications are not possible.'
            : isEpos
              ? 'Applicants should usually have at least two years of professional experience in a field related to the selected course.'
              : 'Applicants must return to their home country after the scholarship and typically may not already hold a degree at the same level (or higher) in the subject applied for.',
          isMandatory: true,
        },
      ],
      testRequirements: [],
      documentRequirements: [
        { type: 'transcript', isRequired: true },
        { type: 'diploma', isRequired: true },
        { type: 'cv', isRequired: true },
        { type: 'motivation letter', isRequired: true },
        { type: 'letter of recommendation', isRequired: true },
        ...(isDoctoral
          ? [{ type: 'statement of purpose', name: 'Research proposal', isRequired: true }]
          : []),
        { type: 'ielts', isRequired: false },
        { type: 'toefl', isRequired: false },
      ],
      benefits: [
        { type: 'tuition', description: isEpos ? 'Tuition fees for the selected EPOS course are covered' : 'German public universities generally charge no tuition fees' },
        {
          type: 'monthly stipend',
          amount: { amount: program.monthlyStipend, currency: 'EUR', period: 'monthly' },
          description: isDoctoral
            ? `Monthly scholarship payment of ${DAAD_DOCTORAL_MONTHLY_EUR} EUR`
            : `Monthly scholarship payment of ${DAAD_GRADUATE_MONTHLY_EUR} EUR (doctoral candidates receive ${DAAD_DOCTORAL_MONTHLY_EUR} EUR)`,
        },
        { type: 'travel', description: 'Travel allowance to and from Germany' },
        { type: 'health insurance', description: 'Health insurance coverage' },
        ...(isEpos
          ? [{ type: 'other', description: 'Family allowance where applicable' }]
          : isDoctoral
            ? [{ type: 'research grant', description: 'Flat-rate research cost allowance' }]
            : []),
      ],
      application: {
        url: program.sourceUrl,
        process:
          'Apply online through the DAAD scholarship database (daad.de) for the specific programme, or for EPOS directly to the selected course coordinator. Upload the required documents (transcripts, certificates, CV, study/research plan, language certificates, references) before the deadline.',
      },
      contact: { url: 'https://www.daad.de/en/' },
      languageCodes: ['en', 'de'],
      confidence: 0.85,
      parserVersion: 'daad-v1',
    };
  },
};
