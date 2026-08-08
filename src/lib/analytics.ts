function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(args);
}

function isGAEnabled(): boolean {
  return Boolean(typeof process !== "undefined" && process.env?.NEXT_PUBLIC_GA_ID);
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (!isGAEnabled()) return;
  gtag("event", name, ...(params !== undefined ? [params] : []));
}

export const ConversionEvents = {
  signup: () => trackEvent("signup", { method: "email" }),
  onboardingComplete: () => trackEvent("onboarding_complete"),
  firstDocumentUpload: () => trackEvent("first_document_upload"),
  firstReview: () => trackEvent("first_review"),
} as const;
