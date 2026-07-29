/**
 * Brand constants — the single place the product's name and voice live.
 *
 * Before this file, the product called itself "Scholarship Hub" in the email
 * templates and AGENTS.md, but "ScholarshipAI" in design-system.md and the page
 * metadata. Users saw two different products depending on where they landed.
 *
 * Never hardcode the product name in a component. Import it. A rename should be
 * one edit here, not a find-and-replace across 120 files.
 */

export const BRAND = {
  name: "SmartScholar",
  /** Arabic wordmark. Transliterating "SmartScholar" reads badly in Arabic —
      a meaningful Arabic name works far better than phonetic letters. */
  nameAr: "سمارت سكولر",

  domain: "smartscholar.org",

  /** Used in <title> and OG tags. */
  tagline: "Find the scholarships you can actually win",
  taglineAr: "اعثر على المنح التي يمكنك الفوز بها فعلاً",

  /**
   * One sentence, plain language, no buzzwords.
   * Deliberately not "AI-powered platform" — that describes the technology, not
   * the outcome, and every competitor says it.
   */
  description:
    "We match Arab students to scholarships they actually qualify for, then show them exactly what to prepare and when.",
  descriptionAr:
    "نطابق الطلاب العرب مع المنح التي تنطبق عليهم شروطها فعلاً، ونوضح لهم ما يجب تجهيزه ومتى.",

  supportEmail: "support@smartscholar.org",
} as const;

/**
 * The three things that make this different from a scholarship listings site.
 * Used on the landing page and in marketing copy — keep them consistent.
 */
export const VALUE_PROPS = [
  {
    key: "eligibility",
    titleEn: "Know if you qualify — before you apply",
    titleAr: "اعرف إن كنت مؤهلاً قبل أن تتقدم",
    bodyEn:
      "Every scholarship is scored against your actual profile: nationality, degree, GPA, English level and age. No more reading twenty pages to find out you were never eligible.",
    bodyAr:
      "كل منحة تُقيَّم بناءً على ملفك الشخصي: الجنسية والدرجة والمعدل ومستوى الإنجليزية والعمر. لا داعي لقراءة عشرين صفحة لتكتشف أنك غير مؤهل أصلاً.",
  },
  {
    key: "roadmap",
    titleEn: "A dated plan, not just a deadline",
    titleAr: "خطة بمواعيد، وليست مجرد موعد نهائي",
    bodyEn:
      "We work backwards from the deadline and tell you when to book your IELTS, when to ask for recommendation letters, and when to start writing.",
    bodyAr:
      "نبدأ من الموعد النهائي ونعود للخلف لنخبرك متى تحجز اختبار الآيلتس، ومتى تطلب خطابات التوصية، ومتى تبدأ الكتابة.",
  },
  {
    key: "review",
    titleEn: "Your documents, reviewed honestly",
    titleAr: "مستنداتك، بمراجعة صادقة",
    bodyEn:
      "Upload your CV or personal statement and get a scored review with specific, prioritised fixes — not vague encouragement.",
    bodyAr:
      "ارفع سيرتك الذاتية أو خطاب الدوافع واحصل على تقييم بدرجات مع تحسينات محددة ومرتبة حسب الأولوية — لا كلام إنشائي.",
  },
] as const;

/** Sensible defaults for og:image and social cards. */
export const SEO = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  twitterHandle: "",
  locale: "ar_EG",
  alternateLocale: "en_US",
} as const;

export function pageTitle(page?: string): string {
  return page ? `${page} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`;
}
