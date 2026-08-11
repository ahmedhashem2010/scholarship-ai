export interface MatchParams {
  dateOfBirth: string;
  country: string;
  educationLevel: string;
  major: string | null;
  targetDegree: string;
  englishLevel: string;
  /** YES | WILLING | PREFER_WITHOUT — see the onboarding English step. */
  hasEnglishTest?: string | null;
  budget: string | null;
  gpa: number | null;
  hasResearch: boolean;
  hasWorkExperience: boolean;
}

export interface ScholarshipData {
  id: string;
  nameEn: string;
  nameAr: string;
  country: string;
  university: string | null;
  degree: string;
  deadline: Date | null;
  flagUrl: string | null;
  description: string | null;
  benefits: string | null;
  requirements: string | null;
  sourceUrl: string | null;
  source: string | null;
  /** Real official links, set only when a human verified them. Never the
   *  aggregator listing in `sourceUrl`. Surfaced by the UI, not scored. */
  officialWebsite?: string | null;
  applicationUrl?: string | null;
  eligibleCountries: string[];
  eligibleEducation: string[];
  fieldOfStudy: string[];
  minimumAge: number | null;
  maximumAge: number | null;
  minimumGPA: number | null;
  englishRequirement: string | null;
  requiresResearch: boolean;
  requiresWorkExp: boolean;
  applicationFee: number | null;
  competitionLevel: string;
  requiredDocuments: string[];
}

export interface MatchResult {
  scholarship: ScholarshipData;
  fitScore: number;
  rank: number;
  successProbability: number;
  competitionLabel: string;
  isEligible: boolean;
  reasons: string[];
  disqualifiers: string[];
  /** Criteria the source data doesn't specify. Not a mark against the user. */
  unknowns: string[];
  /** 0-100. How complete this scholarship's structured data is. */
  dataCompleteness: number;
}

function parseStrArray(val: string | string[]): string[] {
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function calcAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export type FundingClass = "FULL" | "TUITION_ONLY" | "PARTIAL" | "UNKNOWN";
export type Budget = "NONE" | "LIMITED" | "MODERATE" | "FULL";

// Funding classification runs on raw benefits text. The marker patterns are
// deliberately pure ASCII: real data contains U+2013 en-dashes ("covers 20–100%
// of tuition"), and typing that dash literally here is fragile across file
// encodings, so dash ranges are matched via \u2010-\u2015 and \u2212 instead.
const FUNDING_PARTIAL_WORD =
  /(?:discount|reduction|partial|not\s+fully\s+funded|no\s+full[- ]?cost|grants?\/discounts)/;
const FUNDING_PARTIAL_PERCENT =
  /(?:[0-9]{1,2})\s*[\u2010-\u2015\u2212-]\s*[0-9]{1,3}\s*%\s*.*?(?:tuition|fee|waiv)|(?:^|[^\d])(?:[1-9][0-9]?)\s*%\s*.*?(?:tuition|fee|waiv)/;
const FUNDING_NO_LIVING =
  /cost\s+of\s+study\s+only|stipend[^,.]*\s+not\s+(?:automatically\s+)?included|no\s+(?:living|monthly)\s+(?:stipend|allowance)/;
const FUNDING_FULL =
  /stipend|allowance|living|subsistence|fully\s+funded|full\s+funding|complete\s+funding|all\s+costs|full\s+costs|room\s+and\s+board|monthly\s+scholarship/;
const FUNDING_TUITION = /tuition|fee|fees/;

/**
 * Classify how much of a student's costs a scholarship actually covers, read
 * from the free-text benefits JSON. Every benefit value is evaluated as its
 * own segment so a GPA requirement ("average of at least 97%") is never taken
 * for a tuition discount, and a Singapore-style "Tuition Grant" is never
 * mistaken for partial funding.
 */
export function classifyFunding(benefits: string | null): FundingClass {
  if (!benefits) return "UNKNOWN";
  let segments: string[];
  try {
    const parsed = JSON.parse(benefits);
    if (parsed && typeof parsed === "object") {
      segments = Object.values(parsed)
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.toLowerCase());
    } else {
      segments = [String(parsed).toLowerCase()];
    }
  } catch {
    segments = [benefits.toLowerCase()];
  }
  if (segments.length === 0) return "UNKNOWN";

  let hasPartial = false;
  let hasFull = false;
  let hasTuitionOnly = false;

  for (const segment of segments) {
    if (FUNDING_NO_LIVING.test(segment)) {
      hasTuitionOnly = true;
      continue;
    }
    if (FUNDING_PARTIAL_WORD.test(segment) || FUNDING_PARTIAL_PERCENT.test(segment)) {
      hasPartial = true;
      continue;
    }
    if (FUNDING_FULL.test(segment)) {
      hasFull = true;
      continue;
    }
    if (FUNDING_TUITION.test(segment)) hasTuitionOnly = true;
  }

  if (hasPartial) return "PARTIAL";
  if (hasFull) return "FULL";
  if (hasTuitionOnly) return "TUITION_ONLY";
  return "UNKNOWN";
}

// Generic words that carry no discipline signal in field matching. "information",
// "technology" and "management" are deliberately NOT here: telling Computer
// Science from Information Technology matters, and a Management major really
// does belong to a Business Management scholarship.
const FIELD_STOPWORDS = new Set([
  "science", "sciences", "study", "studies", "the", "and", "of", "in", "for",
  "with", "international", "applied", "it",
]);

// Fields whose name doesn't contain the matching major but that clearly accept
// it (a Biology major belongs to a "Life Sciences" scholarship). Hand-picked
// one-way mappings, kept tiny so the token algorithm stays the primary judge.
const FIELD_ALIASES: Record<string, readonly string[]> = {
  "life sciences": ["biology", "biochemistry", "biotechnology", "ecology"],
  "natural sciences": ["biology", "physics", "chemistry", "mathematics", "geosciences", "geology", "astronomy"],
  "health sciences": ["medicine", "pharmacy", "nursing", "dentistry", "public health"],
  "social sciences": ["political science", "sociology", "psychology", "economics"],
  "humanities and social sciences": ["political science", "arts", "history", "education", "psychology"],
  "humanities": ["arts", "history", "education"],
  "media and communication": ["journalism", "communication", "media"],
  "business and economics": ["business", "economics", "finance"],
  "business and management": ["business", "management"],
  "science and engineering": ["engineering", "physics", "chemistry"],
  "stem": ["engineering", "computer science", "physics", "chemistry", "biology", "mathematics"],
};

function fieldTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 1 && !FIELD_STOPWORDS.has(w));
}

function wordCount(value: string): number {
  return value.split(/[^a-z0-9]+/i).filter((w) => w.length > 0).length;
}

/**
 * Tight field alignment. A major and a listed field only match on a whole
 * phrase, a strong shared token, or a hand-picked alias. A single-token major
 * ("Arts", "Biology") must hit a whole token — never a substring — so "Arts"
 * can't match "Artificial Intelligence".
 */
function fieldsMatch(userMajor: string, field: string): boolean {
  const major = userMajor.toLowerCase().trim();
  const f = field.toLowerCase().trim();
  if (f === "any" || major === f) return true;
  if (major.includes(f)) return true;
  if (f.includes(major) && wordCount(major) >= 2) return true;

  const alias = FIELD_ALIASES[f];
  if (alias && alias.includes(major)) return true;

  const majorTokens = fieldTokens(major);
  const fieldTokensArr = fieldTokens(f);
  const shared = majorTokens.filter((t) => fieldTokensArr.includes(t));
  if (shared.length >= 2) return true;
  if (shared.length === 1 && shared[0]!.length >= 5) return true;
  if (majorTokens.length === 1 && fieldTokensArr.includes(majorTokens[0]!)) return true;
  return false;
}

function getCompetitionLabel(level: string): string {
  switch (level) {
    case "high": return "High Competition";
    case "medium": return "Medium Competition";
    case "low": return "Low Competition";
    default: return "Unknown";
  }
}

function daysUntilDeadline(deadline: Date | null): number | null {
  if (!deadline) return null;
  const diff = deadline.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calcSuccessProbability(fitScore: number, profile: MatchParams, competitionLevel: string): number {
  let probability = fitScore * 0.5;
  if (profile.gpa && profile.gpa >= 3.5) probability += 10;
  if (profile.hasResearch) probability += 5;
  if (profile.hasWorkExperience) probability += 5;
  if (profile.englishLevel === "ADVANCED") probability += 5;

  if (competitionLevel === "low") probability += 10;
  else if (competitionLevel === "high") probability -= 10;

  return Math.min(Math.max(Math.round(probability), 5), 95);
}

export function matchScholarshipsToUser(
  user: MatchParams,
  scholarships: ScholarshipData[]
): MatchResult[] {
  const userAge = calcAge(user.dateOfBirth);
  const userMajor = user.major?.toLowerCase() ?? "";

  const results: MatchResult[] = scholarships.map((scholarship) => {
    let score = 0;
    const reasons: string[] = [];
    const disqualifiers: string[] = [];
    // Facts we genuinely don't have, kept separate from real disqualifiers so
    // the UI can say "unverified" instead of "you don't qualify".
    const unknowns: string[] = [];
    const eligibleCountries = parseStrArray(scholarship.eligibleCountries);
    const eligibleEducation = parseStrArray(scholarship.eligibleEducation);
    const fieldOfStudy = parseStrArray(scholarship.fieldOfStudy);
    const fundingClass = classifyFunding(scholarship.benefits);

    // An empty eligibility array means WE DON'T KNOW, not "excluded".
    // 195 of the 234 seeded scholarships were scraped without structured
    // eligibility data. Treating empty as a mismatch put a fabricated red
    // "✗ you don't qualify" on 83% of the catalogue — actively misleading, and
    // the fastest possible way to lose a user's trust in the match score.
    const countryKnown = eligibleCountries.length > 0;
    const educationKnown = eligibleEducation.length > 0;
    const fieldKnown = fieldOfStudy.length > 0;

    // Tri-state: true = confirmed eligible, false = confirmed excluded,
    // null = unknown. Only an explicit false should ever block a user.
    let countryEligible: boolean | null = null;
    let eduMatch: boolean | null = null;

    if (!countryKnown) {
      // Neutral: no claim either way. Slightly below a confirmed match so
      // verified scholarships rank above unverified ones.
      score += 16;
      unknowns.push("Eligible nationalities aren't listed — check the official page");
    } else {
      const userCountry = (user.country ?? "").trim();
      const openToAll = eligibleCountries.some((c) =>
        ["all", "any", "all middle east"].includes(c.toLowerCase())
      );

      if (!userCountry) {
        // Nationality not set on the profile: can't verify, never blocks.
        countryEligible = null;
        score += 16;
        unknowns.push("Your nationality isn't set on your profile — eligibility can't be verified");
      } else {
        countryEligible = openToAll ||
          eligibleCountries.some((c) => c.toLowerCase() === userCountry.toLowerCase());

        if (countryEligible) {
          score += 25;
          reasons.push(`✓ ${userCountry} is eligible for this scholarship`);
        } else {
          score += 8;
          disqualifiers.push(`✗ ${userCountry} is not in the eligible countries list`);
        }
      }
    }

    const targetUpper = user.targetDegree.toUpperCase();

    if (!educationKnown) {
      score += 13;
      unknowns.push("Accepted degree levels aren't listed — check the official page");
    } else {
      eduMatch = eligibleEducation.includes(targetUpper) || eligibleEducation.includes("ANY");
      if (eduMatch) {
        score += 20;
        reasons.push(`✓ Accepts ${user.targetDegree} students`);
      } else {
        const partialMatch = eligibleEducation.some(
          (e) => targetUpper.includes(e) || e.includes(targetUpper)
        );
        if (partialMatch) {
          score += 12;
          reasons.push(`⚠ ${user.targetDegree} isn't listed directly, but a similar level is accepted`);
        } else {
          score += 5;
          disqualifiers.push(`✗ Degree level (${user.targetDegree}) not listed in eligibility`);
        }
      }
    }

    if (scholarship.minimumAge !== null && userAge < scholarship.minimumAge) {
      const gap = scholarship.minimumAge - userAge;
      if (gap <= 2) { score += 10; reasons.push(`⚠ Close to minimum age (need ${scholarship.minimumAge}, you're ${userAge})`); }
      else { score += 4; disqualifiers.push(`✗ Minimum age is ${scholarship.minimumAge} (you're ${userAge})`); }
    } else if (scholarship.maximumAge !== null && userAge > scholarship.maximumAge) {
      const gap = userAge - scholarship.maximumAge;
      if (gap <= 2) { score += 10; reasons.push(`⚠ Slightly above maximum age (max ${scholarship.maximumAge}, you're ${userAge})`); }
      else { score += 3; disqualifiers.push(`✗ Maximum age is ${scholarship.maximumAge} (you're ${userAge})`); }
    } else {
      score += 15;
      reasons.push(`✓ Age ${userAge} is within the accepted range`);
    }

    if (!fieldKnown) {
      score += 13;
      unknowns.push("Eligible fields of study aren't listed — check the official page");
    } else if (!userMajor || userMajor === "other") {
      // Major not set, or an unlisted specialty: can't align, and that's not a
      // mark against the user.
      score += 13;
      unknowns.push("Your major isn't set — field alignment can't be judged");
    } else {
      const acceptsAny = fieldOfStudy.some((f) => f.toLowerCase() === "any");
      const fieldMatch = fieldOfStudy.some((f) => fieldsMatch(userMajor, f));

      if (acceptsAny) {
        score += 16;
        reasons.push(`✓ All fields of study are accepted`);
      } else if (fieldMatch) {
        score += 20;
        reasons.push(`✓ Your field (${user.major ?? "N/A"}) aligns with their fields of study`);
      } else {
        score += 7;
        const topFields = fieldOfStudy.slice(0, 3).join(", ");
        reasons.push(`⚠ Your field (${user.major ?? "N/A"}) differs from listed: ${topFields}`);
      }
    }

    if (scholarship.minimumGPA !== null && user.gpa !== null) {
      if (user.gpa >= scholarship.minimumGPA) {
        score += 12;
        reasons.push(`✓ GPA ${user.gpa} meets the minimum ${scholarship.minimumGPA}`);
      } else {
        const gap = scholarship.minimumGPA - user.gpa;
        if (gap <= 0.5) { score += 7; reasons.push(`⚠ GPA ${user.gpa} is slightly below preferred ${scholarship.minimumGPA}`); }
        else { score += 3; reasons.push(`⚠ GPA ${user.gpa} is below minimum ${scholarship.minimumGPA}`); }
      }
    } else if (scholarship.minimumGPA !== null) {
      score += 4;
      reasons.push(`⚠ GPA not provided — minimum is ${scholarship.minimumGPA}`);
    } else {
      score += 8;
      reasons.push(`✓ No minimum GPA requirement`);
    }

    // English is scored on whether the student HOLDS a certificate, not on how
    // fluent they say they are. A fluent speaker without a score cannot apply
    // to a scholarship requiring IELTS 6.5; a mediocre one holding 6.5 can.
    const requiresEnglish =
      scholarship.englishRequirement !== null &&
      scholarship.englishRequirement !== "NOT_REQUIRED";

    if (user.hasEnglishTest === "PREFER_WITHOUT") {
      // A real, underserved segment. Rank no-test scholarships up hard and
      // push the rest down without hiding them.
      if (!requiresEnglish) {
        score += 18;
        reasons.push(`✓ لا تشترط اختبار لغة إنجليزية / No English test required`);
      } else {
        score += 2;
        reasons.push(`⚠ تشترط اختبار إنجليزية — وأنت تفضّل تجنّبه`);
      }
    } else if (user.hasEnglishTest === "YES") {
      score += 12;
      reasons.push(`✓ لديك نتيجة اختبار سارية / You hold a test score`);
    } else if (user.hasEnglishTest === "WILLING") {
      if (requiresEnglish) {
        score += 6;
        unknowns.push(
          "ستحتاج لأداء اختبار إنجليزية — أضفناه إلى خطتك الزمنية"
        );
      } else {
        score += 10;
        reasons.push(`✓ لا تشترط اختبار لغة إنجليزية`);
      }
    } else {
      // Legacy profiles created before the branch existed.
      if (user.englishLevel === "ADVANCED" || user.englishLevel === "TOEFL" || user.englishLevel === "IELTS") {
        score += 10;
      } else if (user.englishLevel === "INTERMEDIATE") {
        score += 5;
      } else {
        score += 3;
      }
    }

    const daysLeft = daysUntilDeadline(scholarship.deadline);
    if (daysLeft !== null) {
      if (daysLeft <= 0) {
        score -= 15;
        reasons.push(`⚠ Deadline has passed`);
        disqualifiers.push(`✗ Deadline passed (${Math.abs(daysLeft)} days ago)`);
      } else if (daysLeft <= 30) {
        // An urgent deadline matters less when the funding is partial — don't
        // let the "last chance" bump overwhelm a weak funding match.
        score += fundingClass === "PARTIAL" ? 9 : 12;
        reasons.push(`🔥 Urgent: Only ${daysLeft} days left to apply!`);
      } else if (daysLeft <= 60) {
        score += 9;
        reasons.push(`✓ ${daysLeft} days until deadline — start soon`);
      } else if (daysLeft <= 180) {
        score += 6;
        reasons.push(`✓ ${daysLeft} days until deadline`);
      } else {
        score += 4;
        reasons.push(`✓ Plenty of time (${daysLeft} days until deadline)`);
      }
    } else {
      // A null deadline means the scraper didn't capture one — NOT that the
      // scholarship accepts applications indefinitely. Saying "no strict
      // deadline" could cause someone to miss the real one.
      score += 3;
      unknowns.push("Deadline not listed — confirm on the official page before applying");
    }

    if (scholarship.requiresResearch) {
      if (user.hasResearch) {
        score += 5;
        reasons.push(`✓ Has research experience (preferred)`);
      } else {
        score -= 3;
        reasons.push(`⚠ Research experience preferred`);
      }
    } else {
      score += 3;
    }

    if (scholarship.requiresWorkExp) {
      if (user.hasWorkExperience) {
        score += 5;
        reasons.push(`✓ Has work experience (required)`);
      } else {
        score -= 3;
        reasons.push(`⚠ Work experience preferred`);
      }
    } else {
      score += 3;
    }

    if (scholarship.applicationFee !== null && user.budget === "NONE") {
      score -= 3;
      reasons.push(`⚠ Has $${scholarship.applicationFee} application fee`);
    }

    // Funding fit: how well the scholarship's real coverage matches what the
    // student can afford. Classified from the benefits text, never the record
    // name (several records are named "Fully Funded" but are only partial).
    // A null budget is treated as MODERATE. Partial coverage is a real drag for
    // students who can't self-fund and nearly irrelevant for those who can.
    const fundingScores: Record<Budget, Record<FundingClass, number>> = {
      NONE: { FULL: 18, TUITION_ONLY: 4, PARTIAL: -10, UNKNOWN: 4 },
      LIMITED: { FULL: 14, TUITION_ONLY: 5, PARTIAL: -3, UNKNOWN: 4 },
      MODERATE: { FULL: 10, TUITION_ONLY: 6, PARTIAL: 2, UNKNOWN: 2 },
      FULL: { FULL: 6, TUITION_ONLY: 6, PARTIAL: 6, UNKNOWN: 2 },
    };
    const fundingRow = fundingScores[(user.budget ?? "MODERATE") as Budget] ?? fundingScores.MODERATE;
    score += fundingRow[fundingClass];

    if (fundingClass === "FULL") {
      reasons.push(`✓ Fully funded — tuition and living costs covered`);
    } else if (fundingClass === "TUITION_ONLY") {
      reasons.push(`⚠ Tuition covered only — living costs are on you`);
    } else if (fundingClass === "PARTIAL") {
      reasons.push(`⚠ Partially funded — only part of your costs are covered`);
    } else {
      unknowns.push("Funding details aren't listed — check the official page");
    }

    const maxScore = 150;
    const normalizedFitScore = Math.min(Math.max(Math.round((score / maxScore) * 100), 0), 100);

    const successProbability = calcSuccessProbability(normalizedFitScore, user, scholarship.competitionLevel);

    // Unknown never blocks — only an explicit `false` does. Someone must not be
    // told they're ineligible because our scraper missed a field.
    // A confirmed GPA below the minimum is a hard exclusion, same as a country
    // or degree mismatch. A missing GPA stays "unknown" (never blocks) —
    // consistent with the missing-data philosophy used elsewhere.
    const gpaEligible =
      scholarship.minimumGPA === null ||
      user.gpa === null ||
      user.gpa >= scholarship.minimumGPA;

    const eligible = (
      score >= 30 &&
      countryEligible !== false &&
      eduMatch !== false &&
      (scholarship.minimumAge === null || userAge >= scholarship.minimumAge) &&
      (scholarship.maximumAge === null || userAge <= scholarship.maximumAge) &&
      (daysLeft === null || daysLeft > 0) &&
      gpaEligible
    );

    // How much structured data this record actually has. Surfaced in the UI so
    // a user can tell a fully-verified scholarship from a thin scraped one.
    const completenessChecks = [
      countryKnown,
      educationKnown,
      fieldKnown,
      scholarship.deadline !== null,
      scholarship.requiredDocuments.length > 0,
      scholarship.benefits !== null,
      scholarship.requirements !== null,
    ];
    const dataCompleteness = Math.round(
      (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
    );

    return {
      scholarship,
      fitScore: normalizedFitScore,
      rank: 0,
      successProbability,
      competitionLabel: getCompetitionLabel(scholarship.competitionLevel),
      isEligible: eligible,
      reasons,
      disqualifiers,
      unknowns,
      dataCompleteness,
    };
  });

  results.sort((a, b) => {
    if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
    // Tie-break on data quality: a fully-specified scholarship is more useful
    // to the user than a thin scraped record with the same score.
    return b.dataCompleteness - a.dataCompleteness;
  });

  // NEVER pad with ineligible scholarships to hit a minimum count. A student
  // with 0 eligible matches gets 0 recommendations, not 5 misleading cards.
  const finalResults = results.filter((r) => r.isEligible);
  finalResults.forEach((r, i) => { r.rank = i + 1; });
  return finalResults;
}
