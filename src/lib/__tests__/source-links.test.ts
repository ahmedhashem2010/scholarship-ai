import { describe, it, expect } from "vitest";
import {
  hostOf,
  isAggregatorUrl,
  resolveSourceLinks,
} from "@/lib/source-links";

/* ------------------------------------------------------------------ */
/* Task 3E — BUG 1: an aggregator listing (for9a.com) must never be    */
/* presented as the scholarship's "official" website.                  */
/* ------------------------------------------------------------------ */

describe("hostOf", () => {
  it("normalizes scheme, www and case", () => {
    expect(hostOf("https://www.For9a.com/opportunity/x")).toBe("for9a.com");
    expect(hostOf("https://for9a.com/x")).toBe("for9a.com");
  });

  it("returns null for garbage / empty input", () => {
    expect(hostOf(null)).toBeNull();
    expect(hostOf("")).toBeNull();
    expect(hostOf("not a url")).toBeNull();
  });
});

describe("isAggregatorUrl", () => {
  it("detects for9a.com as an aggregator", () => {
    expect(isAggregatorUrl("https://www.for9a.com/en/opportunity/foo")).toBe(true);
  });

  it("does not flag a real official domain", () => {
    expect(isAggregatorUrl("https://www.uskudar.edu.tr/scholarships")).toBe(false);
    expect(isAggregatorUrl("https://admissions.mcgill.ca/mccall-macbain")).toBe(false);
  });
});

describe("resolveSourceLinks", () => {
  it("a for9a listing alone NEVER yields an official action", () => {
    const r = resolveSourceLinks({
      sourceUrl: "https://www.for9a.com/en/opportunity/foo",
      officialWebsite: null,
      applicationUrl: null,
    });
    expect(r.hasOfficial).toBe(false);
    expect(r.primary).toBeNull();
    expect(r.source).not.toBeNull();
    expect(r.source!.kind).toBe("aggregator-listing");
    expect(r.source!.isOfficial).toBe(false);
  });

  it("applicationUrl is the strongest official action (apply > website)", () => {
    const r = resolveSourceLinks({
      sourceUrl: "https://www.for9a.com/en/opportunity/foo",
      officialWebsite: "https://www.uni.edu/scholarship",
      applicationUrl: "https://apply.uni.edu/apply",
    });
    expect(r.hasOfficial).toBe(true);
    expect(r.primary!.kind).toBe("apply");
    expect(r.primary!.href).toBe("https://apply.uni.edu/apply");
    expect(r.primary!.isOfficial).toBe(true);
  });

  it("officialWebsite becomes the primary action when there is no apply link", () => {
    const r = resolveSourceLinks({
      sourceUrl: null,
      officialWebsite: "https://www.uni.edu/scholarship",
      applicationUrl: null,
    });
    expect(r.hasOfficial).toBe(true);
    expect(r.primary!.kind).toBe("official");
    expect(r.primary!.isOfficial).toBe(true);
  });

  it("keeps the aggregator listing as a clearly-labelled provenance link when official is known", () => {
    const r = resolveSourceLinks({
      sourceUrl: "https://www.for9a.com/en/opportunity/foo",
      officialWebsite: "https://www.uni.edu/scholarship",
      applicationUrl: null,
    });
    expect(r.primary!.isOfficial).toBe(true);
    expect(r.source!.kind).toBe("aggregator-listing");
    expect(r.source!.label).toMatch(/listing on For9a/i);
  });

  it("an unverified non-aggregator source page is labelled as source, not official", () => {
    const r = resolveSourceLinks({
      sourceUrl: "https://some-blog.example/listing",
      officialWebsite: null,
      applicationUrl: null,
    });
    expect(r.hasOfficial).toBe(false);
    expect(r.source!.kind).toBe("source-page");
    expect(r.source!.isOfficial).toBe(false);
  });

  it("no URLs at all → no link, nothing fabricated", () => {
    const r = resolveSourceLinks({ sourceUrl: null, officialWebsite: null, applicationUrl: null });
    expect(r.primary).toBeNull();
    expect(r.source).toBeNull();
    expect(r.hasOfficial).toBe(false);
  });
});
