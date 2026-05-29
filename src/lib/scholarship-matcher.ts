export interface MatchParams {
  dateOfBirth: string;
  country: string;
  educationLevel: string;
  major: string | null;
  targetDegree: string;
  englishLevel: string;
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
    const eligibleCountries = parseStrArray(scholarship.eligibleCountries);
    const eligibleEducation = parseStrArray(scholarship.eligibleEducation);
    const fieldOfStudy = parseStrArray(scholarship.fieldOfStudy);

    const countryEligible = eligibleCountries.some((c) =>
      c.toLowerCase() === "all" ||
      c.toLowerCase() === "all middle east" ||
      c.toLowerCase() === user.country.toLowerCase()
    ) || eligibleCountries.map((c) => c.toLowerCase()).includes(user.country.toLowerCase());

    if (countryEligible) {
      score += 25;
      reasons.push(`✓ ${user.country} is eligible for this scholarship`);
    } else {
      score += 8;
      disqualifiers.push(`✗ ${user.country} is not in the eligible countries list`);
      reasons.push(`⚠ Open to other nationalities — may still apply`);
    }

    const targetUpper = user.targetDegree.toUpperCase();
    const eduMatch = eligibleEducation.includes(targetUpper) || eligibleEducation.includes("ANY");
    if (eduMatch) {
      score += 20;
      reasons.push(`✓ Accepts ${user.targetDegree} students`);
    } else {
      const partialMatch = eligibleEducation.some((e) => targetUpper.includes(e) || e.includes(targetUpper));
      if (partialMatch) {
        score += 12;
        disqualifiers.push(`⚠ ${user.targetDegree} is not directly listed, but similar levels are accepted`);
        reasons.push(`⚠ Partially matches education level requirements`);
      } else {
        score += 5;
        disqualifiers.push(`✗ Degree level (${user.targetDegree}) not listed in eligibility`);
        reasons.push(`⚠ Different education level — check specific requirements`);
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

    const fieldMatch = fieldOfStudy.some((f) => {
      const fLower = f.toLowerCase();
      return fLower === "any" ||
        fLower === userMajor ||
        userMajor.includes(fLower) ||
        fLower.includes(userMajor) ||
        (userMajor.split(/[\s,/]+/).some((word) => fLower.includes(word)));
    });

    if (fieldMatch && !fieldOfStudy.some((f) => f.toLowerCase() === "any")) {
      score += 20;
      reasons.push(`✓ Your field (${user.major ?? "N/A"}) aligns with their fields of study`);
    } else if (fieldOfStudy.some((f) => f.toLowerCase() === "any")) {
      score += 16;
      reasons.push(`✓ All fields of study are accepted`);
    } else {
      score += 7;
      const topFields = fieldOfStudy.slice(0, 3).join(", ");
      reasons.push(`⚠ Your field (${user.major ?? "N/A"}) differs from listed: ${topFields}`);
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

    if (user.englishLevel === "ADVANCED" || user.englishLevel === "TOEFL" || user.englishLevel === "IELTS") {
      score += 10;
      reasons.push(`✓ Strong English proficiency`);
    } else if (user.englishLevel === "INTERMEDIATE") {
      score += 5;
      reasons.push(`⚠ May need English test (TOEFL/IELTS)`);
    } else {
      score += 3;
      reasons.push(`⚠ English proficiency may need improvement`);
    }

    const daysLeft = daysUntilDeadline(scholarship.deadline);
    if (daysLeft !== null) {
      if (daysLeft <= 0) {
        score -= 15;
        reasons.push(`⚠ Deadline has passed`);
        disqualifiers.push(`✗ Deadline passed (${Math.abs(daysLeft)} days ago)`);
      } else if (daysLeft <= 30) {
        score += 12;
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
      score += 3;
      reasons.push(`✓ No strict deadline`);
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

    const maxScore = 130;
    const normalizedFitScore = Math.min(Math.max(Math.round((score / maxScore) * 100), 0), 100);

    const successProbability = calcSuccessProbability(normalizedFitScore, user, scholarship.competitionLevel);

    const eligible = (
      score >= 30 &&
      countryEligible &&
      eduMatch &&
      (scholarship.minimumAge === null || userAge >= scholarship.minimumAge) &&
      (scholarship.maximumAge === null || userAge <= scholarship.maximumAge) &&
      (daysLeft === null || daysLeft > 0)
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
    };
  });

  results.sort((a, b) => {
    if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
    return b.fitScore - a.fitScore;
  });

  const MIN_RESULTS = 5;
  if (results.length > 0) {
    const eligibleCount = results.filter((r) => r.isEligible).length;
    if (eligibleCount < MIN_RESULTS) {
      const needed = MIN_RESULTS;
      const taken = new Set<string>();
      const finalResults: MatchResult[] = [];

      for (const result of results) {
        if (finalResults.length >= needed) break;
        if (!taken.has(result.scholarship.id)) {
          taken.add(result.scholarship.id);
          finalResults.push(result);
        }
      }

      finalResults.forEach((r, i) => { r.rank = i + 1; });
      return finalResults;
    }
  }

  const finalResults = results.slice(0, Math.max(MIN_RESULTS, results.length));
  finalResults.forEach((r, i) => { r.rank = i + 1; });
  return finalResults;
}
