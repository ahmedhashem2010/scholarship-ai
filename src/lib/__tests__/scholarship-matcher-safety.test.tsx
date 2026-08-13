import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  classifyFunding,
  matchScholarshipsToUser,
  type ScholarshipData,
  type MatchParams,
} from "@/lib/scholarship-matcher";
import { personas } from "../../../scripts/matching-audit/personas";
import { ScholarshipCard } from "@/components/ui/scholarship-card";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { ReactElement } from "react";

/** ScholarshipCard reads the active language via context — tests render it standalone. */
function renderCard(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

/* ------------------------------------------------------------------ */
/* Task 3C — matching safety regression tests.                         */
/* Reuses the 17 synthetic personas defined in Task 3B.                */
/*                                                                     */
/* NOTE: after the BUG 2 fix, ineligible scholarships are never        */
/* returned at all, so "blocked" is asserted as "absent from results"  */
/* rather than "present with isEligible=false".                        */
/* ------------------------------------------------------------------ */

const future = (days: number): Date => new Date(Date.now() + days * 86_400_000);

function makeScholarship(overrides: Partial<ScholarshipData> = {}): ScholarshipData {
  return {
    id: "sch-1",
    nameEn: "Test Scholarship",
    nameAr: "منحة",
    country: "Turkey",
    university: null,
    degree: "Master",
    deadline: future(90),
    flagUrl: null,
    description: null,
    benefits: "{}",
    requirements: null,
    sourceUrl: null,
    source: null,
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement: null,
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: [],
    ...overrides,
  };
}

const persona = (id: string): MatchParams => {
  const p = personas.find((x) => x.id === id);
  if (!p) throw new Error(`persona ${id} not found`);
  return p.profile;
};

/** A always-eligible baseline scholarship to keep result sets non-empty. */
const baseline = () => makeScholarship({ id: "baseline" });

const returnedIds = (res: { scholarship: ScholarshipData }[]): string[] =>
  res.map((r) => r.scholarship.id);

/* ------------------------------------------------------------------ */
/* BUG 1 — minimumGPA is hard eligibility                             */
/* ------------------------------------------------------------------ */

const KAUST = makeScholarship({
  id: "kaust",
  nameEn: "KAUST Fellowship (Saudi Arabia)",
  minimumAge: 18,
  maximumAge: 35,
  minimumGPA: 3.0,
  eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
});

describe("BUG 1 — minimumGPA hard eligibility", () => {
  it("GPA below minimum → ineligible (P08: 2.5 vs KAUST 3.0)", () => {
    const res = matchScholarshipsToUser(persona("P08"), [KAUST]);
    expect(returnedIds(res)).not.toContain("kaust");

    const mixed = matchScholarshipsToUser(persona("P08"), [KAUST, baseline()]);
    expect(returnedIds(mixed)).not.toContain("kaust");
    expect(returnedIds(mixed)).toContain("baseline");
  });

  it("GPA exactly at minimum → eligible", () => {
    const p = { ...persona("P08"), gpa: 3.0 };
    const res = matchScholarshipsToUser(p, [KAUST]);
    expect(returnedIds(res)).toContain("kaust");
    expect(res.find((r) => r.scholarship.id === "kaust")!.isEligible).toBe(true);
  });

  it("GPA above minimum → eligible (P09: 3.8 vs KAUST 3.0)", () => {
    const res = matchScholarshipsToUser(persona("P09"), [KAUST]);
    expect(returnedIds(res)).toContain("kaust");
    expect(res.find((r) => r.scholarship.id === "kaust")!.isEligible).toBe(true);
  });

  it("scholarship without minimumGPA → existing behavior preserved", () => {
    const noMin = makeScholarship({ minimumGPA: null });
    const res = matchScholarshipsToUser(persona("P08"), [noMin]);
    expect(res).toHaveLength(1);
    expect(res[0]!.isEligible).toBe(true);
    expect(res[0]!.disqualifiers).toEqual([]);
  });

  it("missing student GPA + scholarship requires minimum → not blocked (unknown, not ineligible)", () => {
    const p = { ...persona("P08"), gpa: null };
    const res = matchScholarshipsToUser(p, [KAUST]);
    expect(returnedIds(res)).toContain("kaust");
    const kaust = res.find((r) => r.scholarship.id === "kaust")!;
    expect(kaust.isEligible).toBe(true);
    expect(kaust.reasons.some((r) => r.includes("GPA not provided"))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* BUG 2 — never pad with ineligible results                          */
/* ------------------------------------------------------------------ */

describe("BUG 2 — never pad with ineligible results", () => {
  it("0 eligible → 0 recommendations (P16 exchange)", () => {
    const masterOnly = makeScholarship({
      eligibleEducation: ["MASTER"],
    });
    const res = matchScholarshipsToUser(persona("P16"), [masterOnly]);
    expect(res).toHaveLength(0);
  });

  it("1 eligible → 1 recommendation", () => {
    const eligible = makeScholarship({ id: "a", eligibleEducation: ["MASTER"] });
    const ineligible = makeScholarship({
      id: "b",
      eligibleEducation: ["BACHELOR"],
    });
    const res = matchScholarshipsToUser(persona("P02"), [ineligible, eligible]);
    expect(res).toHaveLength(1);
    expect(res[0]!.isEligible).toBe(true);
    expect(returnedIds(res)).not.toContain("b");
  });

  it("2 eligible → 2 recommendations", () => {
    const pool = [
      makeScholarship({ id: "a", eligibleEducation: ["MASTER"] }),
      makeScholarship({ id: "b", eligibleEducation: ["MASTER"] }),
      makeScholarship({ id: "c", eligibleEducation: ["BACHELOR"] }),
      makeScholarship({ id: "d", eligibleEducation: ["BACHELOR"] }),
    ];
    const res = matchScholarshipsToUser(persona("P02"), pool);
    expect(res).toHaveLength(2);
    expect(res.every((r) => r.isEligible)).toBe(true);
  });

  it("5+ eligible → normal result limit behavior", () => {
    const pool = Array.from({ length: 8 }, (_, i) =>
      makeScholarship({ id: `s${i}`, eligibleEducation: ["MASTER"] })
    );
    const res = matchScholarshipsToUser(persona("P02"), pool);
    expect(res.length).toBeGreaterThanOrEqual(5);
    expect(res.every((r) => r.isEligible)).toBe(true);
  });

  it("no returned recommendation may be isEligible=false", () => {
    const pool = [
      makeScholarship({ id: "a", eligibleEducation: ["MASTER"] }),
      makeScholarship({ id: "b", eligibleCountries: ["Saudi Arabia", "Jordan"] }),
      makeScholarship({ id: "c", maximumAge: 25 }),
      makeScholarship({ id: "d", deadline: future(-5) }),
    ];
    for (const p of personas) {
      const res = matchScholarshipsToUser(p.profile, pool);
      for (const r of res) expect(r.isEligible, `${p.id} returned ineligible`).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Persona safety cases (reusing Task 3B personas)                    */
/* ------------------------------------------------------------------ */

describe("persona safety cases", () => {
  it("1. ineligible nationality → blocked (P05 India vs MENA list)", () => {
    const mena = makeScholarship({
      id: "mena",
      eligibleCountries: ["Egypt", "Saudi Arabia", "Jordan", "UAE", "Morocco", "Tunisia"],
    });
    const res = matchScholarshipsToUser(persona("P05"), [mena, baseline()]);
    expect(returnedIds(res)).not.toContain("mena");
    expect(returnedIds(res)).toContain("baseline");
  });

  it("2. wrong degree → blocked (P02 master vs bachelor-only)", () => {
    const bachelorOnly = makeScholarship({ id: "b", eligibleEducation: ["BACHELOR"] });
    const res = matchScholarshipsToUser(persona("P02"), [bachelorOnly, baseline()]);
    expect(returnedIds(res)).not.toContain("b");
  });

  it("3. maximum age exceeded → blocked (P06 40 vs max 34)", () => {
    const maxAge = makeScholarship({ id: "ma", maximumAge: 34 });
    const res = matchScholarshipsToUser(persona("P06"), [maxAge, baseline()]);
    expect(returnedIds(res)).not.toContain("ma");
  });

  it("4. below minimum age → blocked (P07 15 vs min 18)", () => {
    const minAge = makeScholarship({ id: "mi", minimumAge: 18 });
    const res = matchScholarshipsToUser(persona("P07"), [minAge, baseline()]);
    expect(returnedIds(res)).not.toContain("mi");
  });

  it("5. expired scholarship → blocked", () => {
    const expired = makeScholarship({ id: "exp", deadline: future(-5) });
    const res = matchScholarshipsToUser(persona("P02"), [expired, baseline()]);
    expect(returnedIds(res)).not.toContain("exp");
  });

  it("6. below minimum GPA → blocked (P08 vs KAUST)", () => {
    const res = matchScholarshipsToUser(persona("P08"), [KAUST, baseline()]);
    expect(returnedIds(res)).not.toContain("kaust");
  });

  it("7. eligible GPA → allowed (P09 vs KAUST)", () => {
    const res = matchScholarshipsToUser(persona("P09"), [KAUST]);
    expect(returnedIds(res)).toContain("kaust");
  });

  it("8. no returned recommendation may be isEligible=false (full frozen-50-like pool)", () => {
    const pool = [
      KAUST,
      makeScholarship({ id: "s1", eligibleEducation: ["BACHELOR"], minimumAge: 16 }),
      makeScholarship({ id: "s2", eligibleCountries: ["Egypt", "Saudi Arabia"] }),
      makeScholarship({ id: "s3", maximumAge: 35 }),
      makeScholarship({ id: "s4", deadline: future(20) }),
      makeScholarship({ id: "s5" }),
    ];
    for (const p of personas) {
      const res = matchScholarshipsToUser(p.profile, pool);
      for (const r of res) expect(r.isEligible, `${p.id} returned ineligible`).toBe(true);
    }
  });

  it("P16 exchange case → 0 recommendations, never padded", () => {
    const pool = [
      makeScholarship({ id: "a", eligibleEducation: ["MASTER"] }),
      makeScholarship({ id: "b", eligibleEducation: ["BACHELOR", "MASTER", "PHD"] }),
      makeScholarship({ id: "c", eligibleEducation: ["PHD"] }),
    ];
    const res = matchScholarshipsToUser(persona("P16"), pool);
    expect(res).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* BUG 3 — user-facing card must not present ineligible as applicable */
/* ------------------------------------------------------------------ */

function buildMatch(scholarship: ScholarshipData, isEligible: boolean) {
  return {
    scholarship,
    fitScore: 85,
    rank: 1,
    successProbability: 70,
    competitionLabel: "Medium Competition",
    isEligible,
    reasons: ["✓ Accepts master students", "✓ All fields of study are accepted"],
    disqualifiers: isEligible ? [] : ["✗ Degree level (bachelor) not listed in eligibility"],
    unknowns: [],
    dataCompleteness: 100,
  };
}

describe("BUG 3 — card must not present ineligible scholarships as application opportunities", () => {
  it("does not render Start Application for an ineligible match", () => {
    const sch = makeScholarship({ id: "x", nameEn: "Ineligible Scholarship" });
    renderCard(<ScholarshipCard match={buildMatch(sch, false)} index={0} />);
    expect(screen.queryByRole("link", { name: /start application/i })).toBeNull();
    expect(screen.getByRole("link", { name: /details/i })).toBeTruthy();
  });

  it("renders Start Application only for an eligible match", () => {
    const sch = makeScholarship({ id: "y", nameEn: "Eligible Scholarship" });
    renderCard(<ScholarshipCard match={buildMatch(sch, true)} index={0} />);
    expect(screen.getByRole("link", { name: /start application/i })).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* Task 3D — ranking quality regressions                               */
/* ------------------------------------------------------------------ */

const withMajor = (major: string, over: Partial<MatchParams> = {}): MatchParams => ({
  ...persona("P02"),
  major,
  ...over,
});

describe("Task 3D — funding classification", () => {
  it("classifies full funding from a stipend value", () => {
    expect(classifyFunding(JSON.stringify({ allowance: "Monthly stipend of $2,000", tuition: "Full tuition fees" })))
      .toBe("FULL");
  });

  it("classifies tuition-only from a 100% waiver with no stipend", () => {
    expect(classifyFunding(JSON.stringify({ coverage: "100% tuition and fees waiver" })))
      .toBe("TUITION_ONLY");
  });

  it("never reads a GPA percentage as a funding discount", () => {
    const benefits = JSON.stringify({
      coverage: "100% tuition and academic-fees waiver",
      gpa: "High-school average of at least 97%",
    });
    expect(classifyFunding(benefits)).toBe("TUITION_ONLY");
  });

  it("classifies partial from a percentage range (en-dash)", () => {
    expect(classifyFunding(JSON.stringify({ scholarship: "Covers 20–100% of tuition" })))
      .toBe("PARTIAL");
  });

  it("does not treat the Singapore Tuition Grant as partial funding", () => {
    expect(classifyFunding(JSON.stringify({ coverage: "Full tuition fees (after the Tuition Grant)" })))
      .toBe("TUITION_ONLY");
  });

  it("classifies partial from a tuition discount word", () => {
    expect(classifyFunding(JSON.stringify({ coverage: "25% tuition-fee reduction" })))
      .toBe("PARTIAL");
  });
});

describe("Task 3D — funding scoring", () => {
  it("ranks a fully-funded scholarship above tuition-only for a NONE budget", () => {
    const full = makeScholarship({
      id: "full",
      benefits: JSON.stringify({ allowance: "Monthly stipend", tuition: "Full tuition" }),
    });
    const tuitionOnly = makeScholarship({
      id: "tuition",
      benefits: JSON.stringify({ coverage: "100% tuition waiver" }),
    });
    const res = matchScholarshipsToUser(withMajor("Business", { budget: "NONE" }), [tuitionOnly, full]);
    expect(res[0]!.scholarship.id).toBe("full");
  });

  it("penalizes partial funding for a NONE budget without hiding it", () => {
    const partial = makeScholarship({
      id: "p",
      benefits: JSON.stringify({ scholarship: "Covers 50% of tuition" }),
    });
    const res = matchScholarshipsToUser(withMajor("Business", { budget: "NONE" }), [partial]);
    expect(res).toHaveLength(1);
    expect(res[0]!.isEligible).toBe(true);
    expect(res[0]!.reasons.some((r) => r.includes("Partially funded"))).toBe(true);
  });

  it("funding is a smaller factor when the student can self-fund", () => {
    const full = makeScholarship({
      id: "full",
      benefits: JSON.stringify({ allowance: "Monthly stipend", tuition: "Full tuition" }),
    });
    const partial = makeScholarship({
      id: "partial",
      benefits: JSON.stringify({ scholarship: "Covers 50% of tuition" }),
    });
    const res = matchScholarshipsToUser(withMajor("Business", { budget: "FULL" }), [full, partial]);
    expect(res[0]!.scholarship.id).toBe("full");
    // The gap between FULL and PARTIAL funding must be much smaller than the
    // NONE-budget gap (6 vs 6 = 0 here vs 18 vs -10 = 28 there).
    const gap = res[0]!.fitScore - res[1]!.fitScore;
    const noneGap = (() => {
      const noneRes = matchScholarshipsToUser(withMajor("Business", { budget: "NONE" }), [full, partial]);
      return noneRes[0]!.fitScore - noneRes[1]!.fitScore;
    })();
    expect(gap).toBeLessThan(noneGap);
  });
});

describe("Task 3D — field matching tightening", () => {
  const schWithFields = (fields: string[], id = "f") => makeScholarship({ id, fieldOfStudy: fields });

  it("exact field phrase matches", () => {
    const res = matchScholarshipsToUser(withMajor("Computer Science"), [schWithFields(["Computer Science"])]);
    expect(res[0]!.reasons.some((r) => r.includes("aligns"))).toBe(true);
  });

  it("major phrase contained in a combined field matches", () => {
    const res = matchScholarshipsToUser(withMajor("Computer Science"), [
      schWithFields(["Computer Science and Information Technology"]),
    ]);
    expect(res[0]!.reasons.some((r) => r.includes("aligns"))).toBe(true);
  });

  it("Arts does NOT match Artificial Intelligence", () => {
    const res = matchScholarshipsToUser(withMajor("Arts"), [schWithFields(["Artificial Intelligence"])]);
    expect(res[0]!.reasons.some((r) => r.includes("differs"))).toBe(true);
  });

  it("Biology matches Life Sciences via alias", () => {
    const res = matchScholarshipsToUser(withMajor("Biology"), [schWithFields(["Life Sciences"])]);
    expect(res[0]!.reasons.some((r) => r.includes("aligns"))).toBe(true);
  });

  it("Engineering matches Software Engineering via shared whole token", () => {
    const res = matchScholarshipsToUser(withMajor("Engineering"), [schWithFields(["Software Engineering"])]);
    expect(res[0]!.reasons.some((r) => r.includes("aligns"))).toBe(true);
  });

  it("major set to Other is treated as unknown, not mismatch", () => {
    const res = matchScholarshipsToUser(withMajor("Other"), [schWithFields(["Computer Science"])]);
    expect(res[0]!.unknowns.some((r) => r.includes("major isn't set"))).toBe(true);
  });
});

describe("Task 3D — empty nationality & deadline cap", () => {
  it("empty user country never disqualifies", () => {
    const mena = makeScholarship({ id: "m", eligibleCountries: ["Egypt", "Jordan"] });
    const res = matchScholarshipsToUser({ ...persona("P05"), country: "" }, [mena]);
    expect(res).toHaveLength(1);
    expect(res[0]!.isEligible).toBe(true);
    expect(res[0]!.unknowns.some((r) => r.includes("nationality isn't set"))).toBe(true);
  });

  it("confirmed ineligible nationality is still blocked when country is set", () => {
    const mena = makeScholarship({ id: "m", eligibleCountries: ["Egypt", "Jordan"] });
    const res = matchScholarshipsToUser(persona("P05"), [mena, baseline()]);
    expect(returnedIds(res)).not.toContain("m");
  });

  it("partial funding caps the urgent-deadline bonus", () => {
    const partial = makeScholarship({
      id: "partial",
      benefits: JSON.stringify({ coverage: "50% of tuition" }),
      deadline: future(10),
    });
    const full = makeScholarship({
      id: "full",
      benefits: JSON.stringify({ allowance: "Monthly stipend" }),
      deadline: future(10),
    });
    // Same urgent deadline, same budget: full funding must outrank partial.
    // Without the cap, the +12 urgency bump would partially mask the -10
    // partial-funding penalty and shrink the gap.
    const res = matchScholarshipsToUser(withMajor("Business", { budget: "NONE" }), [full, partial]);
    expect(res[0]!.scholarship.id).toBe("full");
    const gap = res[0]!.fitScore - res[1]!.fitScore;
    expect(gap).toBeGreaterThanOrEqual(18);
  });
});

/* ------------------------------------------------------------------ */
/* Task 3E — matches page contract & deterministic reasons             */
/* ------------------------------------------------------------------ */

describe("Task 3E — ranked results contract (drives /scholarships/matches)", () => {
  it("returns every eligible match ranked best-first with contiguous ranks", () => {
    const pool = [
      makeScholarship({ id: "a", fieldOfStudy: ["Computer Science"] }),
      makeScholarship({ id: "b", fieldOfStudy: ["Computer Science"], benefits: JSON.stringify({ allowance: "Monthly stipend" }) }),
      makeScholarship({ id: "c", fieldOfStudy: ["Computer Science"], deadline: future(15) }),
    ];
    const res = matchScholarshipsToUser(withMajor("Computer Science"), pool);
    expect(res.length).toBe(3);
    res.forEach((r, i) => {
      expect(r.isEligible).toBe(true);
      expect(r.rank).toBe(i + 1);
    });
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1]!.fitScore).toBeGreaterThanOrEqual(res[i]!.fitScore);
    }
  });

  it("0 eligible matches → 0 results (never pads, so the page can show a true empty state)", () => {
    const blockedProfile: MatchParams = {
      dateOfBirth: new Date(2000, 0, 1).toISOString(),
      country: "India",
      educationLevel: "BACHELOR",
      major: "Engineering",
      targetDegree: "BACHELOR",
      englishLevel: "ADVANCED",
      hasEnglishTest: "YES",
      budget: "MODERATE",
      gpa: 3.5,
      hasResearch: false,
      hasWorkExperience: false,
    };
    const pool = [
      makeScholarship({ id: "x", eligibleCountries: ["Saudi Arabia", "Egypt"] }),
      makeScholarship({ id: "y", eligibleEducation: ["MASTER", "PHD"] }),
    ];
    const res = matchScholarshipsToUser(blockedProfile, pool);
    expect(res).toHaveLength(0);
  });
});

describe("Task 3E — matching is deterministic and reasons are evidence-backed", () => {
  it("same input twice → identical reasons (no LLM, no randomness)", () => {
    const sch = makeScholarship({
      id: "det",
      benefits: JSON.stringify({ coverage: "100% tuition waiver" }),
      deadline: future(45),
      minimumGPA: 3.0,
    });
    const profile = withMajor("Computer Science", { gpa: 3.5 });
    const a = matchScholarshipsToUser(profile, [sch])[0]!;
    const b = matchScholarshipsToUser(profile, [sch])[0]!;
    expect(JSON.stringify(a.reasons)).toBe(JSON.stringify(b.reasons));
  });

  it("a funding claim only appears when the benefits text supports it", () => {
    const fullyFunded = makeScholarship({
      id: "full",
      benefits: JSON.stringify({ allowance: "Monthly stipend", tuition: "Full tuition" }),
    });
    const unknownFunding = makeScholarship({ id: "unk", benefits: null });
    const profile = withMajor("Business", { budget: "NONE" });

    const fullRes = matchScholarshipsToUser(profile, [fullyFunded])[0]!;
    expect(fullRes.reasons.some((r) => r.includes("Fully funded"))).toBe(true);

    const unkRes = matchScholarshipsToUser(profile, [unknownFunding])[0]!;
    expect(unkRes.reasons.some((r) => r.includes("funded"))).toBe(false);
    expect(unkRes.unknowns.some((r) => r.includes("Funding details aren't listed"))).toBe(true);
  });

  it("a deadline claim only appears when a real deadline exists", () => {
    const noDeadline = makeScholarship({ id: "nd", deadline: null });
    const res = matchScholarshipsToUser(withMajor("Business"), [noDeadline])[0]!;
    expect(res.reasons.some((r) => /days until deadline/i.test(r))).toBe(false);
    expect(res.unknowns.some((r) => r.includes("Deadline not listed"))).toBe(true);
  });
});

describe("Task 3E — match card renders reasons with progressive disclosure", () => {
  const sch = makeScholarship({ id: "card", nameEn: "Reason Scholarship" });

  it("renders the matcher's reason wording verbatim (never invents facts)", () => {
    const match = {
      ...buildMatch(sch, true),
      reasons: [
        "✓ Age 23 is within the accepted range",
        "✓ Fully funded for tuition and living",
      ],
    };
    renderCard(<ScholarshipCard match={match} index={0} />);
    expect(screen.getByText("Age 23 is within the accepted range")).toBeTruthy();
    expect(screen.getByText("Fully funded for tuition and living")).toBeTruthy();
    expect(screen.queryByText("✓ Age 23 is within the accepted range")).toBeNull();
  });

  it("shows at most 3 reasons by default and offers a disclosure toggle", () => {
    const reasons = Array.from({ length: 5 }, (_, i) => `✓ Reason number ${i + 1}`);
    const match = { ...buildMatch(sch, true), reasons };
    renderCard(<ScholarshipCard match={match} index={0} />);
    expect(screen.getByText("Reason number 1")).toBeTruthy();
    expect(screen.getByText("Reason number 3")).toBeTruthy();
    expect(screen.queryByText("Reason number 4")).toBeNull();
    expect(screen.getByRole("button", { name: /show all reasons/i })).toBeTruthy();
  });

  it("expanding reveals every reason (mobile-friendly progressive disclosure)", () => {
    const reasons = Array.from({ length: 5 }, (_, i) => `✓ Reason number ${i + 1}`);
    const match = { ...buildMatch(sch, true), reasons };
    renderCard(<ScholarshipCard match={match} index={0} />);
    fireEvent.click(screen.getByRole("button", { name: /show all reasons/i }));
    expect(screen.getByText("Reason number 4")).toBeTruthy();
    expect(screen.getByText("Reason number 5")).toBeTruthy();
    expect(screen.getByRole("button", { name: /show fewer/i })).toBeTruthy();
  });

  it("does not render a disclosure toggle when there are few reasons", () => {
    const match = { ...buildMatch(sch, true), reasons: ["✓ Age 23 is within the accepted range"] };
    renderCard(<ScholarshipCard match={match} index={0} />);
    expect(screen.queryByRole("button", { name: /show all reasons/i })).toBeNull();
  });
});
