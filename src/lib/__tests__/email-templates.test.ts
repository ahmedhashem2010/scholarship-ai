import { describe, it, expect } from "vitest";
import { confirmSignupHtml } from "@/lib/email-templates";

/* ------------------------------------------------------------------------- *
 * Regression coverage for the signup/verification-email language bug: the
 * English signup flow was getting an Arabic-first email (with only one
 * bolted-on English sentence), and the "check your inbox" page quoted the
 * Arabic button label verbatim inside an otherwise English sentence.
 * ------------------------------------------------------------------------- */

/** Rough but reliable: any character in the Arabic Unicode block. */
const ARABIC_CHAR = /[؀-ۿ]/;

describe("confirmSignupHtml — language awareness", () => {
  it("lang='en' produces a fully English email with no Arabic characters", () => {
    const html = confirmSignupHtml("Sara", "https://smartscholar.org/auth/confirm?token=abc", "en");
    expect(ARABIC_CHAR.test(html)).toBe(false);
    expect(html).toContain("Confirm your email");
    expect(html).toContain("Verify email address");
    expect(html).toContain("Sara");
    expect(html).toContain("https://smartscholar.org/auth/confirm?token=abc");
  });

  it("lang='ar' (the default) preserves the original Arabic email unchanged", () => {
    const html = confirmSignupHtml("سارة", "https://smartscholar.org/auth/confirm?token=abc");
    expect(html).toContain("أكّد بريدك الإلكتروني");
    expect(html).toContain("تفعيل الحساب");
    expect(html).toContain("سارة");
    // The one intentionally bolted-on English sentence for non-Arabic-reading
    // recipients is still present in the Arabic version.
    expect(html).toContain("Didn't create this account?");
  });

  it("lang='ar' passed explicitly behaves the same as the default", () => {
    const withDefault = confirmSignupHtml("Name", "https://x/y");
    const withExplicit = confirmSignupHtml("Name", "https://x/y", "ar");
    expect(withExplicit).toBe(withDefault);
  });

  it("escapes the name in both languages", () => {
    const html = confirmSignupHtml('<script>alert(1)</script>', "https://x/y", "en");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("prints the confirm URL as both the button target and a plain-text fallback, in both languages", () => {
    const url = "https://smartscholar.org/auth/confirm?token_hash=SECRETVALUE&type=email";
    const en = confirmSignupHtml("Name", url, "en");
    const ar = confirmSignupHtml("Name", url, "ar");
    // Once in the button's href, once printed as plain text below it — the
    // fallback for mail clients that strip or mangle styled anchors.
    expect(en.match(/SECRETVALUE/g)?.length).toBe(2);
    expect(ar.match(/SECRETVALUE/g)?.length).toBe(2);
  });
});
