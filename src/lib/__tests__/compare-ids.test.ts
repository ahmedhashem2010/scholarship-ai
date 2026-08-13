// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  COMPARE_MAX_SELECTIONS,
  encodeCompareIds,
  parseCompareIds,
} from "@/lib/compare-ids";

describe("parseCompareIds", () => {
  it("returns an empty array for null, undefined or empty input", () => {
    expect(parseCompareIds(null)).toEqual([]);
    expect(parseCompareIds(undefined)).toEqual([]);
    expect(parseCompareIds("")).toEqual([]);
  });

  it("ignores blank segments", () => {
    expect(parseCompareIds("  , ,  ,,")).toEqual([]);
    expect(parseCompareIds("clx1, ,clx2,")).toEqual(["clx1", "clx2"]);
  });

  it("splits comma-separated ids", () => {
    expect(parseCompareIds("clx1,clx2,clx3")).toEqual(["clx1", "clx2", "clx3"]);
  });

  it("decodes percent-encoded ids", () => {
    expect(parseCompareIds("a%26b,c%3Dd")).toEqual(["a&b", "c=d"]);
  });

  it("drops segments that fail to decode", () => {
    expect(parseCompareIds("good,%zz,bad%2")).toEqual(["good"]);
  });
});

describe("encodeCompareIds", () => {
  it("round-trips ids that need URL encoding", () => {
    const ids = ["a&b=c?d#e", "x y+z", "plain"];
    expect(parseCompareIds(encodeCompareIds(ids))).toEqual(ids);
  });

  it("round-trips plain ids unchanged", () => {
    const ids = ["clx123", "clx456"];
    expect(encodeCompareIds(ids)).toBe("clx123,clx456");
    expect(parseCompareIds(encodeCompareIds(ids))).toEqual(ids);
  });

  it("is a no-op for ids the browser already decoded", () => {
    const ids = ["a&b", "c=d"];
    expect(parseCompareIds("a&b,c=d")).toEqual(ids);
  });
});

describe("COMPARE_MAX_SELECTIONS", () => {
  it("matches the limit documented across the app", () => {
    expect(COMPARE_MAX_SELECTIONS).toBe(4);
  });
});
