import { describe, it, expect } from "vitest";
import {
  normalizeRecord,
  validateRecord,
  repairMojibake,
  findMatch,
  mergeScholarship,
  planImport,
  isEmpty,
} from "../../../scripts/lib/scholarship-data.mjs";

describe("repairMojibake", () => {
  it("reverses UTF-8-read-as-CP1252 corruption", () => {
    expect(repairMojibake("Bachelorâ€™s degree")).toBe("Bachelor’s degree");
  });

  it("reverses en/em dashes and other high-range sequences", () => {
    expect(repairMojibake("Italy â€“ 2026")).toBe("Italy – 2026");
  });

  it("leaves clean text untouched", () => {
    expect(repairMojibake("A plain scholarship title 2026")).toBe(
      "A plain scholarship title 2026"
    );
  });

  it("leaves real multi-byte (Arabic) text untouched", () => {
    const ar = "منحة الحكومة الإيطالية";
    expect(repairMojibake(ar)).toBe(ar);
  });

  it("does not corrupt legitimate accented Latin text", () => {
    expect(repairMojibake("Üniversitesi scholarship")).toBe(
      "Üniversitesi scholarship"
    );
  });
});

describe("fixMojibake / normalizeRecord", () => {
  it("repairs text fields but never nameEn (the identity key)", () => {
    const normalized = normalizeRecord({
      nameEn: "Fully Funded Scholarship for Bachelorâ€™s in Italy",
      nameAr: "منحة Bachelorâ€™s في إيطاليا",
      description: "Open to Bachelorâ€™s students.",
      country: "Italy",
      degree: "Master / PhD",
      sourceUrl: "https://example.com/x",
    });
    expect(normalized.nameEn).toBe(
      "Fully Funded Scholarship for Bachelorâ€™s in Italy"
    );
    expect(normalized.description).toBe("Open to Bachelor’s students.");
  });

  it("leaves mixed Arabic+mojibake nameAr unrepaired (byte round-trip cannot mix)", () => {
    const normalized = normalizeRecord({
      nameEn: "X",
      nameAr: "منحة Bachelorâ€™s في إيطاليا",
      description: "clean",
      country: "Italy",
      degree: "Master",
    });
    expect(normalized.nameAr).toBe("منحة Bachelorâ€™s في إيطاليا");
  });

  it("normalizes arrays, dates, booleans and defaults", () => {
    const n = normalizeRecord({
      nameEn: "  Test Scholarship  ",
      nameAr: "منحة اختبار",
      country: "Egypt",
      degree: "Master",
      deadline: "2027-03-01T00:00:00.000Z",
      eligibleCountries: "Egypt, Jordan",
      requiresResearch: "true",
      minimumGPA: 3.5,
      benefits: "",
    });
    expect(n.nameEn).toBe("Test Scholarship");
    expect(n.eligibleCountries).toEqual(["Egypt", "Jordan"]);
    expect(n.deadline).toBeInstanceOf(Date);
    expect(n.requiresResearch).toBe(true);
    expect(n.minimumGPA).toBe(3.5);
    expect(n.benefits).toBeUndefined();
    expect(n.eligibleEducation).toEqual([]);
    expect(n.competitionLevel).toBe("medium");
  });
});

describe("validateRecord", () => {
  const valid = {
    nameEn: "Test Scholarship",
    nameAr: "منحة اختبار",
    country: "Italy",
    degree: "Master",
    deadline: "2027-03-01T00:00:00.000Z",
    sourceUrl: "https://example.com/x",
    competitionLevel: "high",
    requiredDocuments: ["CV", "TRANSCRIPT"],
  };

  it("accepts a valid record", () => {
    const r = validateRecord(valid, { isNew: true });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("requires nameEn", () => {
    const r = validateRecord({ ...valid, nameEn: "  " }, { isNew: true });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain("Missing nameEn");
  });

  it("requires nameAr/country/degree only for new records", () => {
    const r = validateRecord({ nameEn: "X", sourceUrl: "https://a.b/c" }, { isNew: true });
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/nameAr/);
    expect(r.errors.join()).toMatch(/country/);
    expect(r.errors.join()).toMatch(/degree/);
  });

  it("rejects invalid dates and URLs", () => {
    const bad = validateRecord(
      { ...valid, deadline: "not-a-date", sourceUrl: "not a url" },
      { isNew: true }
    );
    expect(bad.ok).toBe(false);
    expect(bad.errors.join()).toMatch(/Invalid deadline/);
    expect(bad.errors.join()).toMatch(/Invalid sourceUrl/);
  });

  it("rejects malformed arrays", () => {
    const bad = validateRecord(
      { ...valid, eligibleCountries: { nope: true } },
      { isNew: true }
    );
    expect(bad.ok).toBe(false);
    expect(bad.errors.join()).toMatch(/must be an array/);
  });

  it("warns on unknown document types and competition levels", () => {
    const r = validateRecord(
      { ...valid, requiredDocuments: ["CV", "SOMETHING_NEW"], competitionLevel: "super" },
      { isNew: true }
    );
    expect(r.ok).toBe(true);
    expect(r.warnings.join()).toMatch(/SOMETHING_NEW/);
    expect(r.warnings.join()).toMatch(/competitionLevel/);
  });

  it("warns when degree names no recognised level", () => {
    const r = validateRecord({ ...valid, degree: "Unspecified study" }, { isNew: true });
    expect(r.ok).toBe(true);
    expect(r.warnings.join()).toMatch(/no recognised level/);
  });
});

describe("findMatch", () => {
  const existing = [
    { id: "a", nameEn: "Alpha Scholarship", sourceUrl: "https://example.com/alpha" },
    { id: "b", nameEn: "Beta Scholarship", sourceUrl: "https://example.com/dup" },
    { id: "c", nameEn: "Gamma Scholarship", sourceUrl: "https://example.com/dup" },
  ];

  it("matches exactly by nameEn", () => {
    const m = findMatch(existing, { nameEn: "Alpha Scholarship" });
    expect(m.kind).toBe("exact");
    expect(m.existing?.id).toBe("a");
  });

  it("falls back to a single sourceUrl match (rename candidate)", () => {
    const m = findMatch(existing, {
      nameEn: "Alpha Scholarship (Updated)",
      sourceUrl: "https://example.com/alpha",
    });
    expect(m.kind).toBe("source-url");
    expect(m.existing?.id).toBe("a");
  });

  it("does not rename when sourceUrl matches multiple records", () => {
    const m = findMatch(existing, {
      nameEn: "Another",
      sourceUrl: "https://example.com/dup",
    });
    expect(m.kind).toBe("none");
  });

  it("returns none when nothing matches", () => {
    const m = findMatch(existing, { nameEn: "Brand New", sourceUrl: "https://x.y/z" });
    expect(m.kind).toBe("none");
  });

  it("can disable sourceUrl matching", () => {
    const m = findMatch(
      existing,
      { nameEn: "Alpha Scholarship (Updated)", sourceUrl: "https://example.com/alpha" },
      { matchBySourceUrl: false }
    );
    expect(m.kind).toBe("none");
  });
});

describe("mergeScholarship", () => {
  const existing = {
    nameEn: "X",
    nameAr: "منحة X",
    country: "Italy",
    degree: "Master",
    description: "Existing rich description",
    eligibleEducation: ["MASTER"],
    minimumGPA: 3.0,
    sourceUrl: "https://example.com/x",
  };

  it("fills empty existing fields", () => {
    const { update } = mergeScholarship(existing, {
      country: "Italy",
      university: "Sapienza",
      eligibleEducation: ["MASTER"],
    });
    expect(update.university).toBe("Sapienza");
    expect(update.country).toBeUndefined(); // already equal
  });

  it("keeps populated existing values on conflict", () => {
    const { update, kept, isChanged } = mergeScholarship(existing, {
      description: "Incoming different description",
    });
    expect(update.description).toBeUndefined();
    expect(kept.length).toBe(1);
    expect(kept[0]?.field).toBe("description");
    expect(isChanged).toBe(false);
  });

  it("overwrites on conflict when force is true", () => {
    const { update, kept } = mergeScholarship(existing, {
      description: "Incoming different description",
    }, { force: true });
    expect(update.description).toBe("Incoming different description");
    expect(kept.length).toBe(0);
  });

  it("never erases a populated field with an empty value", () => {
    const { update } = mergeScholarship(existing, { description: "", minimumGPA: null });
    expect(update.description).toBeUndefined();
    expect(update.minimumGPA).toBeUndefined();
  });

  it("detects equal arrays regardless of order", () => {
    const { update } = mergeScholarship(existing, { eligibleEducation: ["PHD", "MASTER"] });
    expect(update.eligibleEducation).toBeUndefined();
  });
});

describe("planImport", () => {
  const existingRecords = [
    {
      id: "e1",
      nameEn: "Existing One",
      sourceUrl: "https://example.com/one",
      description: "already here",
      nameAr: "منحة موجودة",
      country: "Italy",
      degree: "Master",
      competitionLevel: "medium",
      source: "SCRAPED",
    },
  ];

  const incomingRecords = [
    { nameEn: "Brand New", nameAr: "منحة جديدة", country: "Italy", degree: "Master", sourceUrl: "https://example.com/new" },
    { nameEn: "Existing One", nameAr: "منحة موجودة", country: "Italy", degree: "Master", description: "already here", sourceUrl: "https://example.com/one" },
    { nameEn: "Existing One (Renamed)", nameAr: "منحة", country: "Italy", degree: "Master", sourceUrl: "https://example.com/one" },
    { nameEn: "No Name" },
  ];

  it("classifies new / unchanged / skipped correctly", () => {
    const plan = planImport({ existingRecords, incomingRecords });
    expect(plan.summary.new).toBe(1);
    expect(plan.summary.update).toBe(1);
    expect(plan.summary.skipped).toBe(1); // missing nameEn

    const byStatus = Object.fromEntries(plan.items.map((i) => [i.index, i.status]));
    expect(byStatus[0]).toBe("new");
    expect(byStatus[1]).toBe("unchanged"); // identical content
    expect(byStatus[2]).toBe("update"); // rename via sourceUrl
    expect(byStatus[3]).toBe("skipped");
  });

  it("marks a sourceUrl rename with isRename and nameEn in the payload", () => {
    const plan = planImport({ existingRecords, incomingRecords });
    const rename = plan.items.find((i) => i.isRename);
    expect(rename).toBeTruthy();
    expect(rename?.updatePayload?.nameEn).toBe("Existing One (Renamed)");
    expect(rename?.existing?.id).toBe("e1");
  });

  it("skips duplicate nameEn within the file", () => {
    const plan = planImport({
      existingRecords: [],
      incomingRecords: [
        { nameEn: "Dup", nameAr: "أ", country: "IT", degree: "Master" },
        { nameEn: "dup", nameAr: "ب", country: "IT", degree: "Master" },
      ],
    });
    expect(plan.summary.new).toBe(1);
    expect(plan.summary.skipped).toBe(1);
    expect(plan.items[1]?.errors?.join()).toMatch(/Duplicate nameEn/);
  });

  it("counts kept conflicts", () => {
    const plan = planImport({
      existingRecords,
      incomingRecords: [
        {
          nameEn: "Existing One",
          nameAr: "منحة موجودة",
          country: "Italy",
          degree: "Master",
          description: "a completely different description",
          sourceUrl: "https://example.com/one",
        },
      ],
    });
    expect(plan.summary.keptFields).toBe(1);
    expect(plan.items[0]?.kept?.[0]?.field).toBe("description");
  });
});

describe("isEmpty", () => {
  it("treats undefined/null/empty-string/empty-array as empty", () => {
    expect(isEmpty(undefined, "string")).toBe(true);
    expect(isEmpty(null, "string")).toBe(true);
    expect(isEmpty("  ", "string")).toBe(true);
    expect(isEmpty([], "array")).toBe(true);
    expect(isEmpty("x", "string")).toBe(false);
    expect(isEmpty(["a"], "array")).toBe(false);
  });
});
