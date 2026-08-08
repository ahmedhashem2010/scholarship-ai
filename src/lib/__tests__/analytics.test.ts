import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { trackEvent, ConversionEvents } from "@/lib/analytics";

beforeEach(() => {
  window.dataLayer = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("trackEvent", () => {
  it("does nothing when GA_ID is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "");
    trackEvent("test_event", { key: "value" });
    expect(window.dataLayer).toEqual([]);
  });

  it("should push events to dataLayer when GA_ID is set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-XXXXXXXXXX");
    trackEvent("test_event", { key: "value" });
    expect(window.dataLayer!.length).toBe(1);
    expect(window.dataLayer![0]).toEqual(["event", "test_event", { key: "value" }]);
  });
});

describe("ConversionEvents", () => {
  it("signup pushes signup event", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-XXXXXXXXXX");
    ConversionEvents.signup();
    expect(window.dataLayer![0]).toEqual(["event", "signup", { method: "email" }]);
  });

  it("onboardingComplete pushes onboarding_complete event", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-XXXXXXXXXX");
    ConversionEvents.onboardingComplete();
    expect(window.dataLayer![0]).toEqual(["event", "onboarding_complete"]);
  });
});
