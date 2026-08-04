import { ProviderAdapter, DiscoveredPage, ExtractedScholarship, ExtractOptions } from '../../acquisition/types';
import { makeBase } from '../util';

export const SH_SITE_URL = 'https://stipendiumhungaricum.hu/';
export const SH_APPLY_URL = 'https://apply.stipendiumhungaricum.hu/';
export const SH_APPLY_INFO_URL = 'https://stipendiumhungaricum.hu/apply/';
export const SH_CONTACT_URL = 'https://stipendiumhungaricum.hu/contact/';

/** Official published Stipendium Hungaricum benefits (2026/2027 call). */
export const SH_BA_MA_STIPEND_HUF = 43700;
export const SH_PHD_STIPEND_HUF = 140000;
export const SH_HOUSING_CONTRIBUTION_HUF = 40000;

interface ShProgram {
  key: string;
  title: string;
  sourceUrl: string;
  degreeLevels: string[];
  duration: string;
  durationText: string;
  monthlyStipend: number;
  isDoctoral?: boolean;
  eligibleCountryCodes?: string[];
  countryNote?: string;
}

/** War-affected countries covered by the Students at Risk Subprogramme. */
const SAR_COUNTRY_CODES = ['AF', 'ET', 'SD', 'SS', 'SY', 'UA', 'YE'];

const PROGRAMS: ShProgram[] = [
  {
    key: 'degree-programmes',
    title: 'Stipendium Hungaricum Scholarship Programme (Bachelor\'s, Master\'s & One-Tier Master\'s)',
    sourceUrl: SH_APPLY_INFO_URL,
    degreeLevels: ['BACHELOR', 'MASTER'],
    duration:
      '2–4 years for a bachelor\'s degree, 1–2 years for a master\'s degree and 1–2 years for a one-tier master\'s degree. A one-year non-degree Hungarian language preparatory course is also available.',
    durationText: '2–4 years (bachelor); 1–2 years (master/one-tier); optional 1-year language prep.',
    monthlyStipend: SH_BA_MA_STIPEND_HUF,
  },
  {
    key: 'doctoral',
    title: 'Stipendium Hungaricum Doctoral Programme',
    sourceUrl: SH_APPLY_INFO_URL,
    degreeLevels: ['PHD'],
    duration:
      '3–4 years of doctoral (PhD/DLA) study at a Hungarian higher education institution.',
    durationText: '3–4 years (PhD/DLA).',
    monthlyStipend: SH_PHD_STIPEND_HUF,
    isDoctoral: true,
  },
  {
    key: 'students-at-risk',
    title: 'Stipendium Hungaricum Students at Risk Subprogramme',
    sourceUrl: SH_APPLY_URL,
    degreeLevels: ['BACHELOR', 'MASTER', 'PHD'],
    duration:
      '2–4 years for a bachelor\'s degree, 1–2 years for a master\'s degree or 3–4 years for a doctoral programme, with the same benefits as the main scholarship.',
    durationText: 'Bachelor\'s 2–4 years; master\'s 1–2 years; doctoral 3–4 years.',
    monthlyStipend: SH_BA_MA_STIPEND_HUF,
    eligibleCountryCodes: SAR_COUNTRY_CODES,
  },
];

const PROGRAM_BY_KEY = new Map(PROGRAMS.map((p) => [p.key, p]));

export const stipendiumHungaricumAdapter: ProviderAdapter = {
  id: 'stipendium-hungaricum',
  name: 'Stipendium Hungaricum (Hungarian Government Scholarship)',
  website: SH_SITE_URL,
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
    const key = (typeof opts.metadata?.key === 'string' && opts.metadata.key) || 'degree-programmes';
    const program = PROGRAM_BY_KEY.get(key) ?? PROGRAMS[0];

    const base = makeBase(url);
    const isSar = program.key === 'students-at-risk';
    const isDoctoral = !!program.isDoctoral;

    const description = isSar
      ? `The Stipendium Hungaricum Students at Risk Subprogramme offers citizens of war-affected countries fully funded bachelor's, master's and doctoral study in Hungary, with the same benefits as the main scholarship — full tuition exemption, a monthly stipend, accommodation support and medical insurance. Applications are submitted through the sending partner in the eligible country. Duration: ${program.duration}`
      : `The Stipendium Hungaricum Scholarship is the flagship scholarship of the Hungarian Government, offering citizens of partner countries fully funded ${isDoctoral ? 'doctoral (PhD/DLA)' : 'bachelor\'s, master\'s and one-tier master\'s'} study in English (or Hungarian) at Hungarian higher education institutions. Around 7,000 new scholarships are awarded annually. Tuition is fully covered, students receive a monthly stipend, accommodation support and medical insurance, and the degree is internationally recognised. Duration: ${program.duration}`;

    return {
      ...base,
      title: program.title,
      provider: 'Stipendium Hungaricum',
      degreeLevels: program.degreeLevels,
      studyFields: [],
      countryCode: undefined,
      durationText: program.durationText,
      description,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        accommodationCovered: true,
        healthInsurance: true,
        travelCovered: false,
        monthlyStipend: { amount: program.monthlyStipend, currency: 'HUF', period: 'monthly' },
        notes: isDoctoral
          ? `Full tuition fee exemption; monthly stipend of HUF ${SH_PHD_STIPEND_HUF.toLocaleString('en-US')} for doctoral students; accommodation (dormitory place or monthly contribution of HUF ${SH_HOUSING_CONTRIBUTION_HUF.toLocaleString('en-US')}); medical insurance for the full scholarship period. International travel is not covered.`
          : `Full tuition fee exemption; monthly stipend of HUF ${SH_BA_MA_STIPEND_HUF.toLocaleString('en-US')} for bachelor's, master's and one-tier master's students; accommodation (dormitory place or monthly contribution of HUF ${SH_HOUSING_CONTRIBUTION_HUF.toLocaleString('en-US')}); medical insurance for the full scholarship period. International travel is not covered.`,
      },
      deadlines: {
        opening: {
          raw: 'The call for applications is published every year, typically in mid-November.',
          isFallback: true,
        },
        closing: {
          raw: '15 January (annual), 14:00 CET. The 2026/2027 call closed on 15 January 2026; the next call is expected to open in November 2026. Exact dates are published in the current Call for Applications.',
          isFallback: true,
        },
      },
      eligibility: {
        eligibleCountryCodes: program.eligibleCountryCodes ?? [],
        nationalityRestriction: isSar
          ? 'Open only to citizens of the war-affected countries listed by the Students at Risk Subprogramme; applications must be submitted through the sending partner in the eligible country.'
          : 'Open to citizens of partner (sending) countries. Each partner country designates a sending partner (typically a ministry or national agency) that supports and nominates applicants; the current list is published in the Call for Applications.',
        degreeRequirement: isDoctoral
          ? 'A master\'s degree (or equivalent) is required for doctoral (PhD/DLA) programmes.'
          : isSar
            ? 'The education level required by the chosen programme (secondary certificate for bachelor\'s, bachelor\'s degree for master\'s, master\'s degree for doctoral).'
            : 'Secondary school leaving certificate for bachelor\'s programmes; a bachelor\'s degree (or equivalent) for master\'s and one-tier master\'s programmes.',
        languageRequirement:
          'English-taught programmes require proof of English proficiency at the level set by the host university (IELTS, TOEFL or previous studies in English may be accepted). A one-year Hungarian language preparatory course is available for non-degree study.',
        notes:
          'There is no age limit. Selection is managed by the host universities together with Tempus Public Foundation (TKA). Applicants must complete the online application and obtain the support of their sending partner.',
      },
      requirements: [
        {
          type: 'other',
          description: isSar
            ? 'Applicants must be citizens of a war-affected country listed by the subprogramme and submit through the responsible sending partner.'
            : 'Applicants must be citizens of a partner country and obtain the support of the sending partner (e.g. national ministry or agency) in their home country.',
          isMandatory: true,
        },
        ...(isDoctoral
          ? [{ type: 'other', description: 'A master\'s degree (or equivalent) is required for doctoral programmes.', isMandatory: true }]
          : []),
      ],
      testRequirements: [],
      documentRequirements: [
        { type: 'medical certificate', isRequired: true },
        { type: 'diploma', isRequired: true },
        { type: 'transcript', isRequired: true },
        { type: 'motivation letter', isRequired: true },
        { type: 'cv', isRequired: true },
        { type: 'passport', isRequired: true },
        ...(isDoctoral
          ? [{ type: 'statement of purpose', name: 'Research proposal (doctoral)', isRequired: true }]
          : []),
        { type: 'ielts', isRequired: false },
      ],
      benefits: [
        { type: 'tuition', description: 'Full tuition fee exemption' },
        {
          type: 'monthly stipend',
          amount: { amount: program.monthlyStipend, currency: 'HUF', period: 'monthly' },
          description: isDoctoral
            ? 'Monthly stipend for doctoral (PhD/DLA) students'
            : 'Monthly stipend for bachelor\'s, master\'s and one-tier master\'s students',
        },
        { type: 'housing', description: `Dormitory placement or monthly accommodation contribution of HUF ${SH_HOUSING_CONTRIBUTION_HUF.toLocaleString('en-US')}` },
        { type: 'health insurance', description: 'Medical insurance for the full scholarship period' },
      ],
      application: {
        portal: SH_APPLY_URL,
        url: program.sourceUrl,
        process:
          'Register in the Stipendium Hungaricum online application system (apply.stipendiumhungaricum.hu), complete the application, upload the required documents and submit before the deadline. The application must be supported by the sending partner in your home country (national ministry or agency).',
      },
      contact: { email: 'stipendiumhungaricum@tpf.hu', url: SH_CONTACT_URL },
      languageCodes: ['en'],
      confidence: 0.85,
      parserVersion: 'stipendium-hungaricum-v1',
    };
  },
};
