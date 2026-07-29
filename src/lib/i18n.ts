/**
 * Translation dictionary.
 *
 * Before this, "Arabic support" meant flipping `dir="rtl"` — every word on the
 * page stayed in English. An Arabic-first product needs actual Arabic.
 *
 * Scope is deliberate: landing page, navigation, onboarding and shared UI.
 * The dashboard internals stay English for launch; translating everything is a
 * week-two job and would blow the sprint.
 *
 * The Arabic here is written, not machine-translated. Where a natural Arabic
 * phrasing differs from the English, the Arabic wins — it's the primary
 * language for this audience.
 */

export type Language = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const t: Dict = {
  // --- Navigation -----------------------------------------------------------
  "nav.scholarships": { ar: "المنح", en: "Scholarships" },
  "nav.dashboard": { ar: "لوحتي", en: "Dashboard" },
  "nav.documents": { ar: "مستنداتي", en: "Documents" },
  "nav.roadmap": { ar: "خطتي", en: "My plan" },
  "nav.pricing": { ar: "الأسعار", en: "Pricing" },
  "nav.help": { ar: "المساعدة", en: "Help" },
  "nav.login": { ar: "تسجيل الدخول", en: "Log in" },
  "nav.signup": { ar: "ابدأ مجاناً", en: "Get started" },
  "nav.logout": { ar: "تسجيل الخروج", en: "Log out" },
  "nav.profile": { ar: "ملفي الشخصي", en: "Profile" },
  "nav.credits": { ar: "الرصيد", en: "Credits" },

  // --- Landing: hero --------------------------------------------------------
  "hero.headline": {
    ar: "اعثر على المنح التي يمكنك الفوز بها فعلاً",
    en: "Find the scholarships you can actually win",
  },
  "hero.sub": {
    ar: "توقّف عن تصفّح مئات المنح غير المناسبة. أخبرنا عن نفسك، وسنعرض لك ما تنطبق عليك شروطه — مع خطة زمنية واضحة لكل خطوة.",
    en: "Stop scrolling past hundreds of scholarships you'll never qualify for. Tell us about yourself and we'll show you the ones that fit — with a dated plan for every step.",
  },
  "hero.cta": { ar: "اعرف المنح المناسبة لك", en: "See your matches" },
  "hero.ctaSecondary": { ar: "تصفّح المنح", en: "Browse scholarships" },
  "hero.noCard": { ar: "مجاني للبدء · بدون بطاقة ائتمان", en: "Free to start · no credit card" },

  // --- Landing: social proof -----------------------------------------------
  "proof.scholarships": { ar: "منحة دراسية", en: "scholarships" },
  "proof.countries": { ar: "دولة", en: "countries" },
  "proof.verified": { ar: "تم التحقق منها يدوياً", en: "human-verified" },

  // --- Landing: how it works -----------------------------------------------
  "how.title": { ar: "كيف تعمل المنصة", en: "How it works" },
  "how.step1.title": { ar: "أخبرنا عن نفسك", en: "Tell us about you" },
  "how.step1.body": {
    ar: "خمس خطوات قصيرة: بلدك، درجتك العلمية، تخصصك، ومستوى الإنجليزية.",
    en: "Five short steps: your country, degree, field and English level.",
  },
  "how.step2.title": { ar: "شاهد نسبة التطابق", en: "See your fit score" },
  "how.step2.body": {
    ar: "نعرض لك سبب تأهلك أو عدم تأهلك لكل منحة — بوضوح وبدون مجاملة.",
    en: "We show you exactly why you match — or why you don't.",
  },
  "how.step3.title": { ar: "اتبع خطتك الزمنية", en: "Follow your roadmap" },
  "how.step3.body": {
    ar: "خطة بمواعيد محددة: متى تحجز الاختبار، ومتى تطلب التوصيات، ومتى تقدّم.",
    en: "Dated milestones: when to book your test, request letters, and submit.",
  },

  // --- Landing: sections ----------------------------------------------------
  "section.featured": { ar: "منح مفتوحة الآن", en: "Open right now" },
  "section.featuredSub": {
    ar: "عيّنة من قاعدة بياناتنا — سجّل لترى ما يناسبك أنت",
    en: "A sample from our database — sign up to see what fits you",
  },
  "section.pricing": { ar: "الأسعار", en: "Pricing" },
  "section.pricingSub": {
    ar: "البحث عن المنح والخطة الزمنية مجاناً دائماً. ادفع فقط مقابل مراجعة مستنداتك.",
    en: "Matching and roadmaps are always free. You only pay for document reviews.",
  },
  "section.faq": { ar: "أسئلة شائعة", en: "Common questions" },

  // --- Scholarship card / detail -------------------------------------------
  "sch.deadline": { ar: "آخر موعد", en: "Deadline" },
  "sch.daysLeft": { ar: "يوماً متبقياً", en: "days left" },
  "sch.ongoing": { ar: "مفتوحة باستمرار", en: "Rolling — always open" },
  "sch.deadlineUnknown": { ar: "الموعد غير محدد", en: "Deadline not listed" },
  "sch.fitScore": { ar: "نسبة التطابق", en: "Fit score" },
  "sch.whyMatch": { ar: "لماذا تناسبك", en: "Why you match" },
  "sch.whyNot": { ar: "ما قد يمنعك", en: "What might block you" },
  "sch.unverified": { ar: "لم يتم التحقق منها بعد", en: "Not yet verified" },
  "sch.unknownInfo": { ar: "معلومات غير مذكورة في المصدر", en: "Not stated by the source" },
  "sch.verifiedOn": { ar: "تم التحقق في", en: "Verified" },
  "sch.viewOfficial": { ar: "الصفحة الرسمية", en: "Official page" },
  "sch.requiredDocs": { ar: "المستندات المطلوبة", en: "Required documents" },
  "sch.benefits": { ar: "ما تغطيه المنحة", en: "What it covers" },
  "sch.eligibility": { ar: "شروط الأهلية", en: "Eligibility" },
  "sch.save": { ar: "احفظ المنحة", en: "Save scholarship" },
  "sch.saved": { ar: "محفوظة", en: "Saved" },

  // --- Dashboard ------------------------------------------------------------
  "dash.greeting": { ar: "أهلاً", en: "Hi" },
  "dash.nextStep": { ar: "خطوتك التالية", en: "Your next step" },
  "dash.deadlines": { ar: "أقرب المواعيد", en: "Upcoming deadlines" },
  "dash.matches": { ar: "أفضل المنح لك", en: "Your best matches" },
  "dash.documents": { ar: "مستنداتك", en: "Your documents" },
  "dash.viewAll": { ar: "عرض الكل", en: "View all" },

  // --- Empty states ---------------------------------------------------------
  "empty.noMatches.title": { ar: "لا توجد نتائج بعد", en: "No matches yet" },
  "empty.noMatches.body": {
    ar: "أكمل ملفك الشخصي وسنعرض لك المنح المناسبة خلال ثوانٍ.",
    en: "Complete your profile and we'll show you matching scholarships in seconds.",
  },
  "empty.noMatches.cta": { ar: "أكمل ملفي", en: "Complete profile" },
  "empty.noDocs.title": { ar: "لم ترفع أي مستند", en: "No documents yet" },
  "empty.noDocs.body": {
    ar: "ارفع سيرتك الذاتية أو خطاب الدوافع لتحصل على مراجعة مفصّلة.",
    en: "Upload your CV or personal statement to get a detailed review.",
  },
  "empty.noDocs.cta": { ar: "ارفع مستنداً", en: "Upload a document" },

  // --- Onboarding -----------------------------------------------------------
  "onb.step": { ar: "خطوة", en: "Step" },
  "onb.of": { ar: "من", en: "of" },
  "onb.next": { ar: "التالي", en: "Next" },
  "onb.back": { ar: "السابق", en: "Back" },
  "onb.finish": { ar: "إنهاء", en: "Finish" },
  "onb.about": { ar: "عنك", en: "About you" },
  "onb.education": { ar: "دراستك", en: "Education" },
  "onb.english": { ar: "الإنجليزية", en: "English" },
  "onb.experience": { ar: "خبرتك", en: "Experience" },
  "onb.review": { ar: "مراجعة", en: "Review" },
  "onb.fullName": { ar: "الاسم الكامل", en: "Full name" },
  "onb.dob": { ar: "تاريخ الميلاد", en: "Date of birth" },
  "onb.country": { ar: "بلد الجنسية", en: "Country of citizenship" },

  // --- Common ---------------------------------------------------------------
  "common.loading": { ar: "جارِ التحميل…", en: "Loading…" },
  "common.error": { ar: "حدث خطأ ما", en: "Something went wrong" },
  "common.retry": { ar: "أعد المحاولة", en: "Try again" },
  "common.free": { ar: "مجاناً", en: "Free" },
  "common.close": { ar: "إغلاق", en: "Close" },
  "common.search": { ar: "ابحث", en: "Search" },
};

/** Looks up a key. Returns the key itself if missing, so gaps are visible. */
export function translate(key: string, lang: Language): string {
  const entry = t[key];
  if (!entry) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[i18n] Missing translation key: "${key}"`);
    }
    return key;
  }
  return entry[lang];
}

/**
 * Arabic-Indic numerals. Arabic speakers in MENA read both, but dates and
 * counts feel noticeably more native in Arabic-Indic within Arabic copy.
 */
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function localiseNumber(n: number | string, lang: Language): string {
  if (lang === "en") return String(n);
  return String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]!);
}
